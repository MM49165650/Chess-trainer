<?php

declare(strict_types=1);

namespace App\Http\Controllers\Dev;

use App\Data\PracticeGameMovesData;
use App\Http\Controllers\Controller;
use App\Models\PracticeGame;
use Illuminate\Http\JsonResponse;

/**
 * GET /dev/answers/following/{game}: the moves of the next practice games
 * after the given one, in ID order. The answer viewer searches them in the
 * browser for the next special move, since no chess logic runs in PHP. The
 * route exists only in the local environment.
 */
class ListFollowingPracticeGamesController extends Controller
{
    private const int GAMES_PER_REQUEST = 50;

    public function __invoke(string $game): JsonResponse
    {
        $games = PracticeGame::query()
            ->where('id', '>', (int) $game)
            ->orderBy('id')
            ->limit(self::GAMES_PER_REQUEST)
            ->get(['id', 'moves']);

        return response()->json(
            $games->map(fn (PracticeGame $found): PracticeGameMovesData => PracticeGameMovesData::from([
                'id' => $found->id,
                'moves' => $found->moves,
            ]))->all(),
        );
    }
}
