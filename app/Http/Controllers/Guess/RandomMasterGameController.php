<?php

declare(strict_types=1);

namespace App\Http\Controllers\Guess;

use App\Http\Controllers\Controller;
use App\Models\Master;
use App\Models\MasterGame;
use Illuminate\Http\RedirectResponse;

/**
 * GET /guess/{master}/random: redirects to a random game by that master. A
 * master with no games goes to their list, which says so.
 */
class RandomMasterGameController extends Controller
{
    public function __invoke(string $master): RedirectResponse
    {
        $found = Master::query()->where('slug', $master)->first();

        abort_if($found === null, 404);

        $game = MasterGame::query()
            ->where('master_id', $found->id)
            ->inRandomOrder()
            ->value('id');

        return $game === null
            ? to_route('guess.games', ['master' => $found->slug])
            : to_route('guess.play', ['master' => $found->slug, 'game' => $game]);
    }
}
