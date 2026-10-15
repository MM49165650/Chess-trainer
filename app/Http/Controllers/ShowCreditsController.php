<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Data\PageMetaData;
use Inertia\Inertia;
use Inertia\Response;

/**
 * GET /credits: who made the boards, pieces, board code and data the site
 * uses. The list is kept with the settings catalogue, in the browser code.
 */
class ShowCreditsController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Credits', [
            'meta' => PageMetaData::credits(),
        ]);
    }
}
