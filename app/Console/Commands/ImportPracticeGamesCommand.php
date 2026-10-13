<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Data\PracticeGameImportData;
use App\Data\PracticeMoveData;
use App\Models\PracticeGame;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * The load stage of the practice game import: Appendix E of the
 * requirements. It reads the intermediate file written by
 * `npm run extract:practice`, validates its shape, and inserts, skips or
 * updates each game by its fingerprint. It contains no chess logic and never
 * deletes a row.
 */
#[Description('Load practice games from an intermediate file')]
#[Signature('import:practice-games
        {file : The intermediate file written by extract:practice}
        {--dry-run : Print the report without changing anything}
        {--update : Rewrite the details and answers of games that are already loaded}')]
class ImportPracticeGamesCommand extends Command
{
    private const string KIND = 'practice_games';

    private const int FORMAT = 1;

    public function handle(): int
    {
        $path = $this->argument('file');

        if (! is_file($path)) {
            $this->error('The file does not exist.');

            return self::FAILURE;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES);

        if ($lines === false || $lines === []) {
            $this->error('The file is empty or cannot be read.');

            return self::FAILURE;
        }

        $headerProblem = $this->headerProblem($lines[0]);

        if ($headerProblem !== null) {
            $this->error($headerProblem);

            return self::FAILURE;
        }

        // Every line is validated first, but only its fingerprint is kept:
        // a full file of games with their answers does not fit in memory.
        $fingerprints = [];
        $problems = [];

        foreach ($lines as $index => $line) {
            if ($index === 0 || trim($line) === '') {
                continue;
            }

            $game = $this->readLine($line);

            if (is_string($game)) {
                $problems[] = 'Line '.($index + 1).': '.$game;
            } else {
                $fingerprints[$index] = $game->fingerprint;
            }
        }

        // A load is all or nothing.
        if ($problems !== []) {
            $this->error('Nothing was written. '.count($problems).' invalid line(s):');

            foreach ($problems as $problem) {
                $this->line('  '.$problem);
            }

            return self::FAILURE;
        }

        $dryRun = $this->option('dry-run') === true;
        $update = $this->option('update') === true;

        $counts = $dryRun
            ? $this->load($lines, $fingerprints, $update, write: false)
            : DB::transaction(fn (): array => $this->load($lines, $fingerprints, $update, write: true));

        $this->report($path, $dryRun, $counts);

        return self::SUCCESS;
    }

    /**
     * Says what is wrong with the header line, or null when it is right.
     */
    private function headerProblem(string $line): ?string
    {
        $header = json_decode($line, true);

        if (! is_array($header) || ($header['kind'] ?? null) !== self::KIND) {
            return 'This is not a practice games file: its first line must name the kind "'.self::KIND.'".';
        }

        if (($header['format'] ?? null) !== self::FORMAT) {
            return 'This file has a format number this command does not know. It reads format '.self::FORMAT.'.';
        }

        return null;
    }

    /**
     * Reads one game, or returns a message saying why the line is invalid.
     */
    private function readLine(string $line): PracticeGameImportData|string
    {
        $fields = json_decode($line, true);

        if (! is_array($fields)) {
            return 'not a JSON object.';
        }

        try {
            $game = PracticeGameImportData::validateAndCreate($fields);
        } catch (ValidationException $exception) {
            return $exception->validator->errors()->first();
        }

        if (count($game->moves) !== $game->ply_count) {
            return 'the moves list has '.count($game->moves).' entries, but ply_count is '.$game->ply_count.'.';
        }

        return $game;
    }

    /**
     * Inserts, skips or updates each game by its fingerprint. A game is read
     * from its line again only when it is about to be written.
     *
     * @param  list<string>  $lines
     * @param  array<int, string>  $fingerprints  The fingerprint of each valid line, by line index.
     * @return array{imported: int, updated: int, already_loaded: int, repeated_in_file: int}
     */
    private function load(array $lines, array $fingerprints, bool $update, bool $write): array
    {
        $counts = ['imported' => 0, 'updated' => 0, 'already_loaded' => 0, 'repeated_in_file' => 0];

        $loaded = [];

        foreach (array_chunk($fingerprints, 500) as $chunk) {
            foreach (PracticeGame::query()->whereIn('fingerprint', $chunk)->pluck('fingerprint') as $fingerprint) {
                if (is_string($fingerprint)) {
                    $loaded[$fingerprint] = true;
                }
            }
        }

        $seen = [];

        foreach ($fingerprints as $index => $fingerprint) {
            if (array_key_exists($fingerprint, $seen)) {
                $counts['repeated_in_file']++;

                continue;
            }

            $seen[$fingerprint] = true;

            $isNew = ! array_key_exists($fingerprint, $loaded);

            if (! $isNew && ! $update) {
                $counts['already_loaded']++;

                continue;
            }

            $counts[$isNew ? 'imported' : 'updated']++;

            if (! $write) {
                continue;
            }

            // The line passed validation above, so it is read without it here.
            $game = PracticeGameImportData::from(json_decode($lines[$index] ?? '', true));

            // Everything but the fingerprint, which is what identifies it.
            // The update option is how a fix to the calculation reaches
            // games already loaded: Appendix D.
            $details = [
                'white_rating' => $game->white_rating,
                'black_rating' => $game->black_rating,
                'time_control' => $game->time_control,
                'ply_count' => $game->ply_count,
                'answers_version' => $game->answers_version,
                'moves' => array_map(
                    fn (PracticeMoveData $move): array => [
                        'uci' => $move->uci,
                        'san' => $move->san,
                        'piece' => $move->piece,
                        'lost' => $move->lost,
                        'controlled' => $move->controlled,
                        'hanging' => $move->hanging,
                    ],
                    $game->moves,
                ),
            ];

            if ($isNew) {
                PracticeGame::query()->create([...$details, 'fingerprint' => $fingerprint]);
            } else {
                PracticeGame::query()->where('fingerprint', $fingerprint)->firstOrFail()->update($details);
            }
        }

        return $counts;
    }

    /**
     * @param  array{imported: int, updated: int, already_loaded: int, repeated_in_file: int}  $counts
     */
    private function report(string $path, bool $dryRun, array $counts): void
    {
        $skipped = $counts['already_loaded'] + $counts['repeated_in_file'];

        $this->line('Practice games from '.$path.($dryRun ? ' (dry run: nothing was changed)' : ''));
        $this->line('  Games in the file    '.array_sum($counts));
        $this->line('  Imported             '.$counts['imported']);
        $this->line('  Updated              '.$counts['updated']);
        $this->line('  Skipped              '.$skipped);
        $this->line('    already loaded     '.$counts['already_loaded']);
        $this->line('    repeated in file   '.$counts['repeated_in_file']);
        $this->line('  Practice games in the database: '.PracticeGame::query()->count());
    }
}
