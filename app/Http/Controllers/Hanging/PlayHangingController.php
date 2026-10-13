<?php

declare(strict_types=1);

namespace App\Http\Controllers\Hanging;

use App\Data\PageMetaData;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * GET /hanging/play: the spot the hanging piece exercise. It is the marking
 * page of square control in its other mode. The page gets no game; the
 * browser picks one and fetches it from the data endpoints.
 */
class PlayHangingController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('marking/Play', [
            'meta' => PageMetaData::hangingPlay(),
            'mode' => 'hanging',
        ]);
    }
}
