<?php

declare(strict_types=1);

use App\Models\PracticeGame;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Writes an intermediate file of made-up practice games and returns its path.
 * The answer sets are made up too: the load stage has no chess logic.
 *
 * @param  list<list<string>>  $games  Each game as its moves.
 */
function practiceGamesFile(array $games): string
{
    $lines = [json_encode(['kind' => 'practice_games', 'format' => 1, 'options' => []])];

    foreach ($games as $moves) {
        $lines[] = json_encode([
            'fingerprint' => hash('sha256', implode(' ', $moves)),
            'white_rating' => 1100,
            'black_rating' => 1150,
            'time_control' => '600+0',
            'ply_count' => count($moves),
            'answers_version' => 2,
            'moves' => array_map(fn (string $move): array => [
                'uci' => $move,
                'san' => $move,
                'piece' => 'pawn',
                'lost' => ['d3', 'f3'],
                'controlled' => ['d5', 'f5'],
                'rook' => null,
                'hanging' => [],
            ], $moves),
        ]);
    }

    $path = tempnam(sys_get_temp_dir(), 'practice-games-');
    file_put_contents($path, implode("\n", $lines)."\n");

    return $path;
}

test('importing the same practice games twice keeps every ID', function (): void {
    $file = practiceGamesFile([
        ['e2e4', 'e7e5', 'g1f3'],
        ['d2d4', 'd7d5', 'c2c4', 'e7e6'],
        ['e2e4', 'c7c5', 'g1f3', 'd7d6', 'd2d4'],
    ]);

    $idsByFingerprint = fn (): array => PracticeGame::query()->orderBy('id')->pluck('id', 'fingerprint')->all();

    $this->artisan('import:practice-games', ['file' => $file])->assertSuccessful();

    $first = $idsByFingerprint();

    expect($first)->toHaveCount(3);

    // A second run adds nothing and changes no ID.
    $this->artisan('import:practice-games', ['file' => $file])->assertSuccessful();

    expect($idsByFingerprint())->toBe($first);

    // The update option rewrites details and answers in place, under the same IDs.
    $this->artisan('import:practice-games', ['file' => $file, '--update' => true])->assertSuccessful();

    expect($idsByFingerprint())->toBe($first);
});

test('a practice game with an invalid square is rejected and nothing is written', function (): void {
    $file = practiceGamesFile([
        ['e2e4', 'e7e5', 'g1f3'],
        ['d2d4', 'd7d5', 'c2c4', 'e7e6'],
    ]);

    // The second game's last move gets a square that is not on the board.
    $lines = file($file, FILE_IGNORE_NEW_LINES);
    $game = json_decode($lines[2], true);
    $game['moves'][3]['hanging'] = ['e5', 'i9'];
    $lines[2] = json_encode($game);
    file_put_contents($file, implode("\n", $lines)."\n");

    $this->artisan('import:practice-games', ['file' => $file])
        ->expectsOutputToContain('Line 3')
        ->assertFailed();

    expect(PracticeGame::query()->count())->toBe(0);
});
