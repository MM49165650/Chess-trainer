<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Data\PuzzleImportData;
use App\Models\Puzzle;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * The load stage of the puzzle import: Appendix E of the requirements. It
 * reads the intermediate file written by `npm run extract:puzzles`,
 * validates its shape, and inserts, skips or updates each puzzle by its
 * Lichess ID. It contains no chess logic and never deletes a row.
 */
#[Description('Load puzzles from an intermediate file')]
#[Signature('import:puzzles
        {file : The intermediate file written by extract:puzzles}
        {--dry-run : Print the report without changing anything}
        {--update : Rewrite the details of puzzles that are already loaded}')]
class ImportPuzzlesCommand extends Command
{
    private const string KIND = 'puzzles';

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

        // Every line is validated before anything is written.
        $puzzles = [];
        $problems = [];

        foreach ($lines as $index => $line) {
            if ($index === 0 || trim($line) === '') {
                continue;
            }

            $puzzle = $this->readLine($line);

            if (is_string($puzzle)) {
                $problems[] = 'Line '.($index + 1).': '.$puzzle;
            } else {
                $puzzles[] = $puzzle;
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
            ? $this->load($puzzles, $update, write: false)
            : DB::transaction(fn (): array => $this->load($puzzles, $update, write: true));

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
            return 'This is not a puzzles file: its first line must name the kind "'.self::KIND.'".';
        }

        if (($header['format'] ?? null) !== self::FORMAT) {
            return 'This file has a format number this command does not know. It reads format '.self::FORMAT.'.';
        }

        return null;
    }

    /**
     * Reads one puzzle, or returns a message saying why the line is invalid.
     */
    private function readLine(string $line): PuzzleImportData|string
    {
        $fields = json_decode($line, true);

        if (! is_array($fields)) {
            return 'not a JSON object.';
        }

        try {
            $puzzle = PuzzleImportData::validateAndCreate($fields);
        } catch (ValidationException $exception) {
            return $exception->validator->errors()->first();
        }

        if (! array_is_list($puzzle->themes) || array_filter($puzzle->themes, is_string(...)) !== $puzzle->themes) {
            return 'themes must be a list of strings.';
        }

        return $puzzle;
    }

    /**
     * Inserts, skips or updates each puzzle by its Lichess ID.
     *
     * @param  list<PuzzleImportData>  $puzzles
     * @return array{imported: int, updated: int, already_loaded: int, repeated_in_file: int}
     */
    private function load(array $puzzles, bool $update, bool $write): array
    {
        $counts = ['imported' => 0, 'updated' => 0, 'already_loaded' => 0, 'repeated_in_file' => 0];

        $loaded = [];

        foreach (array_chunk($puzzles, 500) as $chunk) {
            $ids = array_map(fn (PuzzleImportData $puzzle): string => $puzzle->lichess_id, $chunk);

            foreach (Puzzle::query()->whereIn('lichess_id', $ids)->pluck('lichess_id') as $lichessId) {
                if (is_string($lichessId)) {
                    $loaded[$lichessId] = true;
                }
            }
        }

        $seen = [];

        foreach ($puzzles as $puzzle) {
            if (array_key_exists($puzzle->lichess_id, $seen)) {
                $counts['repeated_in_file']++;

                continue;
            }

            $seen[$puzzle->lichess_id] = true;

            $isNew = ! array_key_exists($puzzle->lichess_id, $loaded);

            if (! $isNew && ! $update) {
                $counts['already_loaded']++;

                continue;
            }

            $counts[$isNew ? 'imported' : 'updated']++;

            if (! $write) {
                continue;
            }

            // Everything but the Lichess ID, which is what identifies it.
            $details = [
                'fen' => $puzzle->fen,
                'setup_move' => $puzzle->setup_move,
                'first_move' => $puzzle->first_move,
                'reply_move' => $puzzle->reply_move,
                'second_move' => $puzzle->second_move,
                'piece' => $puzzle->piece,
                'rating' => $puzzle->rating,
                'popularity' => $puzzle->popularity,
                'plays' => $puzzle->plays,
                'themes' => $puzzle->themes,
            ];

            if ($isNew) {
                Puzzle::query()->create([...$details, 'lichess_id' => $puzzle->lichess_id]);
            } else {
                Puzzle::query()->where('lichess_id', $puzzle->lichess_id)->update($details);
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

        $this->line('Puzzles from '.$path.($dryRun ? ' (dry run: nothing was changed)' : ''));
        $this->line('  Puzzles in the file  '.array_sum($counts));
        $this->line('  Imported             '.$counts['imported']);
        $this->line('  Updated              '.$counts['updated']);
        $this->line('  Skipped              '.$skipped);
        $this->line('    already loaded     '.$counts['already_loaded']);
        $this->line('    repeated in file   '.$counts['repeated_in_file']);
        $this->line('  Puzzles in the database: '.Puzzle::query()->count());
    }
}
