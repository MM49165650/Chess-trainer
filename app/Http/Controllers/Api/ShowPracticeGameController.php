<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Data\PracticeGamePlayData;
use App\Http\Controllers\Controller;
use App\Models\PracticeGame;
use Illuminate\Http\JsonResponse;

/**
 * GET /api/practice-games/{id}: one practice game with its moves and their
 * answers. The response is the same for every visitor, so it may be cached.
 */
class ShowPracticeGameController extends Controller
{
    /**
     * A game never changes, so a copy may be kept for a day.
     */
    private const int CACHE_SECONDS = 86400;

    public function __invoke(string $id): JsonResponse
    {
        $game = PracticeGame::query()->find((int) $id);

        abort_if($game === null, 404);

        $data = PracticeGamePlayData::from([
            'id' => $game->id,
            'ply_count' => $game->ply_count,
            'answers_version' => $game->answers_version,
            'moves' => $game->moves,
        ]);

        // Only a successful response carries the public cache header.
        return response()
            ->json($data)
            ->setPublic()
            ->setMaxAge(self::CACHE_SECONDS);
    }
}
