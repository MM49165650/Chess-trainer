<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tactics;

use App\Data\PageMetaData;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * GET /tactics/{piece}: the page where the tactics of one piece are played.
 * The page gets only the piece; its puzzles come from the data endpoints.
 */
class PlayTacticsController extends Controller
{
    public function __invoke(string $piece): Response
    {
        return Inertia::render('tactics/Play', [
            'meta' => PageMetaData::tactics($piece),
            'piece' => $piece,
        ]);
    }
}
