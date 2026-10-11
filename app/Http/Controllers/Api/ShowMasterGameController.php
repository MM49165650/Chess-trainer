<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Data\MasterGameData;
use App\Http\Controllers\Controller;
use App\Models\MasterGame;
use Illuminate\Http\JsonResponse;

/**
 * GET /api/master-games/{id}: one master game with its details and moves.
 * The response is the same for every visitor, so it may be cached.
 */
class ShowMasterGameController extends Controller
{
    /**
     * A game never changes, so a copy may be kept for a day.
     */
    private const int CACHE_SECONDS = 86400;

    public function __invoke(string $id): JsonResponse
    {
        $game = MasterGame::query()->with('master')->find((int) $id);
        $master = $game?->master;

        abort_if($game === null || $master === null, 404, 'This master game does not exist.');

        $data = MasterGameData::from([
            'id' => $game->id,
            'master' => ['slug' => $master->slug, 'name' => $master->name],
            'master_color' => $game->master_color,
            'opponent_name' => $game->opponent_name,
            'year' => $game->year,
            'event' => $game->event,
            'ply_count' => $game->ply_count,
            'guess_count' => $game->guess_count,
            'moves' => $game->moves,
        ]);

        // Only a successful response carries the public cache header.
        return response()
            ->json($data, options: JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            ->setPublic()
            ->setMaxAge(self::CACHE_SECONDS);
    }
}
