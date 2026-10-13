<?php

declare(strict_types=1);

namespace App\Http\Controllers\Squares;

use App\Data\PageMetaData;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * GET /squares/play: the square-control exercise. The page is shared with
 * spot the hanging piece and told which mode it is in. It gets no game; the
 * browser picks one and fetches it from the data endpoints.
 */
class PlaySquaresController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('marking/Play', [
            'meta' => PageMetaData::squaresPlay(),
            'mode' => 'squares',
        ]);
    }
}
