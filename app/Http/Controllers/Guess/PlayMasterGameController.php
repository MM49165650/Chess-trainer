<?php

declare(strict_types=1);

namespace App\Http\Controllers\Guess;

use App\Data\MasterGameDetailsData;
use App\Data\PageMetaData;
use App\Http\Controllers\Controller;
use App\Models\MasterGame;
use Inertia\Inertia;
use Inertia\Response;

/**
 * GET /guess/{master}/{game}: the page where a master game is played. The
 * page gets the game's details; its moves come from the data endpoint.
 */
class PlayMasterGameController extends Controller
{
    public function __invoke(string $master, string $game): Response
    {
        // The moves can be long, and the page does not need them here.
        $found = MasterGame::query()
            ->select(['id', 'master_id', 'master_color', 'opponent_name', 'opponent_short_name', 'year', 'event', 'ply_count', 'guess_count'])
            ->with('master')
            ->find((int) $game);

        $winner = $found?->master;

        // A game is only found under its own master.
        abort_if($found === null || $winner === null || $winner->slug !== $master, 404);

        return Inertia::render('guess/Play', [
            'meta' => PageMetaData::game($winner, $found),
            'game' => MasterGameDetailsData::from([
                'id' => $found->id,
                'master' => ['slug' => $winner->slug, 'name' => $winner->name],
                'master_color' => $found->master_color,
                'opponent_name' => $found->opponent_name,
                'opponent_short_name' => $found->opponent_short_name,
                'year' => $found->year,
                'event' => $found->event,
                'ply_count' => $found->ply_count,
                'guess_count' => $found->guess_count,
            ]),
        ]);
    }
}
