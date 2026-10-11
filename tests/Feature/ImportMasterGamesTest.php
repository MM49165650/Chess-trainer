<?php

declare(strict_types=1);

use App\Models\MasterGame;
use Database\Seeders\MasterSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Writes an intermediate file of made-up master games and returns its path.
 *
 * @param  list<array{slug: string, color: string, opponent: string, moves: list<string>}>  $games
 */
function masterGamesFile(array $games): string
{
    $lines = [json_encode(['kind' => 'master_games', 'format' => 1, 'options' => []])];

    foreach ($games as $game) {
        $lines[] = json_encode([
            'master_slug' => $game['slug'],
            'fingerprint' => hash('sha256', $game['slug'].'|'.$game['color'].'|'.implode(' ', $game['moves'])),
            'master_color' => $game['color'],
            'opponent_name' => $game['opponent'],
            'year' => 1950,
            'event' => 'Made up',
            'ply_count' => count($game['moves']),
            'guess_count' => $game['color'] === 'white' ? intdiv(count($game['moves']) + 1, 2) : intdiv(count($game['moves']), 2),
            'moves' => array_map(fn (string $move): array => ['uci' => $move, 'san' => $move], $game['moves']),
        ]);
    }

    $path = tempnam(sys_get_temp_dir(), 'master-games-');
    file_put_contents($path, implode("\n", $lines)."\n");

    return $path;
}

test('importing the same master games twice keeps every ID', function (): void {
    $this->seed(MasterSeeder::class);

    $file = masterGamesFile([
        ['slug' => 'capablanca', 'color' => 'white', 'opponent' => 'Ann Example', 'moves' => ['e2e4', 'e7e5', 'g1f3']],
        ['slug' => 'capablanca', 'color' => 'black', 'opponent' => 'Ben Example', 'moves' => ['d2d4', 'd7d5', 'c2c4', 'e7e6']],
        ['slug' => 'tal', 'color' => 'white', 'opponent' => 'Cy Example', 'moves' => ['e2e4', 'c7c5', 'g1f3', 'd7d6', 'd2d4']],
    ]);

    $idsByFingerprint = fn (): array => MasterGame::query()->orderBy('id')->pluck('id', 'fingerprint')->all();

    $this->artisan('import:master-games', ['file' => $file])->assertSuccessful();

    $first = $idsByFingerprint();

    expect($first)->toHaveCount(3);

    // A second run adds nothing and changes no ID.
    $this->artisan('import:master-games', ['file' => $file])->assertSuccessful();

    expect($idsByFingerprint())->toBe($first);

    // The update option rewrites details in place, under the same IDs.
    $this->artisan('import:master-games', ['file' => $file, '--update' => true])->assertSuccessful();

    expect($idsByFingerprint())->toBe($first);
});
