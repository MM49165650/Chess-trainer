<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Data\GameMoveData;
use App\Data\MasterGameImportData;
use App\Models\Master;
use App\Models\MasterGame;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * The load stage of the master game import: Appendix E of the requirements.
 * It reads the intermediate file written by `npm run extract:masters`,
 * validates its shape, and inserts, skips or updates each game by its
 * fingerprint. It contains no chess logic and never deletes a row.
 */
#[Description('Load master games from an intermediate file')]
#[Signature('import:master-games
        {file : The intermediate file written by extract:masters}
        {--dry-run : Print the report without changing anything}
        {--update : Rewrite the details of games that are already loaded}')]
class ImportMasterGamesCommand extends Command
{
    private const string KIND = 'master_games';

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

        /** @var array<string, int> $masterIds */
        $masterIds = Master::query()->pluck('id', 'slug')->all();

        $games = [];
        $problems = [];

        foreach ($lines as $index => $line) {
            if ($index === 0 || trim($line) === '') {
                continue;
            }

            $game = $this->readLine($line, $masterIds);

            if (is_string($game)) {
                $problems[] = 'Line '.($index + 1).': '.$game;
            } else {
                $games[] = $game;
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
            ? $this->load($games, $masterIds, $update, write: false)
            : DB::transaction(fn (): array => $this->load($games, $masterIds, $update, write: true));

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
            return 'This is not a master games file: its first line must name the kind "'.self::KIND.'".';
        }

        if (($header['format'] ?? null) !== self::FORMAT) {
            return 'This file has a format number this command does not know. It reads format '.self::FORMAT.'.';
        }

        return null;
    }

    /**
     * Reads one game, or returns a message saying why the line is invalid.
     *
     * @param  array<string, int>  $masterIds
     */
    private function readLine(string $line, array $masterIds): MasterGameImportData|string
    {
        $fields = json_decode($line, true);

        if (! is_array($fields)) {
            return 'not a JSON object.';
        }

        try {
            $game = MasterGameImportData::validateAndCreate($fields);
        } catch (ValidationException $exception) {
            return $exception->validator->errors()->first();
        }

        if (! array_key_exists($game->master_slug, $masterIds)) {
            return 'unknown master "'.$game->master_slug.'".';
        }

        if (count($game->moves) !== $game->ply_count) {
            return 'the moves list has '.count($game->moves).' entries, but ply_count is '.$game->ply_count.'.';
        }

        return $game;
    }

    /**
     * Inserts, skips or updates each game by its fingerprint.
     *
     * @param  list<MasterGameImportData>  $games
     * @param  array<string, int>  $masterIds
     * @return array{imported: int, updated: int, already_loaded: int, repeated_in_file: int}
     */
    private function load(array $games, array $masterIds, bool $update, bool $write): array
    {
        $counts = ['imported' => 0, 'updated' => 0, 'already_loaded' => 0, 'repeated_in_file' => 0];

        $loaded = [];

        foreach (array_chunk($games, 500) as $chunk) {
            $fingerprints = array_map(fn (MasterGameImportData $game): string => $game->fingerprint, $chunk);

            foreach (MasterGame::query()->whereIn('fingerprint', $fingerprints)->pluck('fingerprint') as $fingerprint) {
                if (is_string($fingerprint)) {
                    $loaded[$fingerprint] = true;
                }
            }
        }

        $seen = [];

        foreach ($games as $game) {
            if (array_key_exists($game->fingerprint, $seen)) {
                $counts['repeated_in_file']++;

                continue;
            }

            $seen[$game->fingerprint] = true;

            $details = [
                'opponent_name' => $game->opponent_name,
                'opponent_short_name' => $game->opponent_short_name,
                'year' => $game->year,
                'event' => $game->event,
            ];

            if (! array_key_exists($game->fingerprint, $loaded)) {
                $counts['imported']++;

                if ($write) {
                    MasterGame::query()->create([
                        ...$details,
                        'master_id' => $masterIds[$game->master_slug],
                        'fingerprint' => $game->fingerprint,
                        'master_color' => $game->master_color,
                        'ply_count' => $game->ply_count,
                        'guess_count' => $game->guess_count,
                        'moves' => array_map(
                            fn (GameMoveData $move): array => ['uci' => $move->uci, 'san' => $move->san],
                            $game->moves,
                        ),
                    ]);
                }
            } elseif ($update) {
                // The same fingerprint means the same master, colour and
                // moves, so only the details can differ.
                $counts['updated']++;

                if ($write) {
                    MasterGame::query()->where('fingerprint', $game->fingerprint)->update($details);
                }
            } else {
                $counts['already_loaded']++;
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

        $this->line('Master games from '.$path.($dryRun ? ' (dry run: nothing was changed)' : ''));
        $this->line('  Games in the file    '.array_sum($counts));
        $this->line('  Imported             '.$counts['imported']);
        $this->line('  Updated              '.$counts['updated']);
        $this->line('  Skipped              '.$skipped);
        $this->line('    already loaded     '.$counts['already_loaded']);
        $this->line('    repeated in file   '.$counts['repeated_in_file']);
        $this->line('  Master games in the database: '.MasterGame::query()->count());
    }
}
