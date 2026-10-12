<?php

declare(strict_types=1);

use App\Models\Puzzle;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Writes an intermediate file of made-up puzzles and returns its path.
 *
 * @param  list<array{id: string, piece: string, moves: list<string>}>  $puzzles
 */
function puzzlesFile(array $puzzles): string
{
    $lines = [json_encode(['kind' => 'puzzles', 'format' => 1, 'options' => []])];

    foreach ($puzzles as $puzzle) {
        $lines[] = json_encode([
            'lichess_id' => $puzzle['id'],
            'fen' => 'made up',
            'setup_move' => $puzzle['moves'][0],
            'first_move' => $puzzle['moves'][1],
            'reply_move' => $puzzle['moves'][2],
            'second_move' => $puzzle['moves'][3],
            'piece' => $puzzle['piece'],
            'rating' => 1000,
            'popularity' => 90,
            'plays' => 600,
            'themes' => ['fork', 'short'],
        ]);
    }

    $path = tempnam(sys_get_temp_dir(), 'puzzles-');
    file_put_contents($path, implode("\n", $lines)."\n");

    return $path;
}

test('importing the same puzzles twice keeps every ID', function (): void {
    $file = puzzlesFile([
        ['id' => 'aaaaa', 'piece' => 'knight', 'moves' => ['e7e5', 'g1f3', 'd7d6', 'f3e5']],
        ['id' => 'bbbbb', 'piece' => 'queen', 'moves' => ['e7e5', 'd1h5', 'g7g6', 'h5e5']],
        ['id' => 'ccccc', 'piece' => 'pawn', 'moves' => ['d7d5', 'e4d5', 'g8f6', 'd5d6']],
    ]);

    $idsByLichessId = fn (): array => Puzzle::query()->orderBy('id')->pluck('id', 'lichess_id')->all();

    $this->artisan('import:puzzles', ['file' => $file])->assertSuccessful();

    $first = $idsByLichessId();

    expect($first)->toHaveCount(3);

    // A second run adds nothing and changes no ID.
    $this->artisan('import:puzzles', ['file' => $file])->assertSuccessful();

    expect($idsByLichessId())->toBe($first);

    // The update option rewrites details in place, under the same IDs.
    $this->artisan('import:puzzles', ['file' => $file, '--update' => true])->assertSuccessful();

    expect($idsByLichessId())->toBe($first);
});
