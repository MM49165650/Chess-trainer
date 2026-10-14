<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Data\MasterSummaryData;
use App\Data\PageMetaData;
use App\Models\Master;
use Inertia\Inertia;
use Inertia\Response;

/**
 * GET /progress: the user's stats in the four modes. They are kept in the
 * browser, so the page only needs the masters' names, in their fixed order.
 */
class ShowProgressController extends Controller
{
    public function __invoke(): Response
    {
        $masters = Master::query()
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Master $master): MasterSummaryData => MasterSummaryData::from([
                'slug' => $master->slug,
                'name' => $master->name,
            ]))
            ->all();

        return Inertia::render('Progress', [
            'meta' => PageMetaData::progress(),
            'masters' => $masters,
        ]);
    }
}
