<?php

declare(strict_types=1);

namespace App\Http\Controllers\Hanging;

use App\Data\PageMetaData;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * GET /hanging: the spot the hanging piece landing page, with a Start or
 * Resume button. The browser knows whether there is a session to resume.
 */
class ShowHangingController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('marking/Landing', [
            'meta' => PageMetaData::hanging(),
            'mode' => 'hanging',
        ]);
    }
}
