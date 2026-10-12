<?php

declare(strict_types=1);

namespace App\Http\Controllers\Guess;

use App\Data\MasterListItemData;
use App\Http\Controllers\Controller;
use App\Models\Master;
use Inertia\Inertia;
use Inertia\Response;

/**
 * GET /guess: the masters, in their fixed order, each with its number of
 * games.
 */
class ListMastersController extends Controller
{
    public function __invoke(): Response
    {
        $masters = Master::query()
            ->withCount('games')
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Master $master): MasterListItemData => MasterListItemData::from([
                'slug' => $master->slug,
                'name' => $master->name,
                'game_count' => $master->games_count,
            ]))
            ->all();

        return Inertia::render('guess/Masters', ['masters' => $masters]);
    }
}
