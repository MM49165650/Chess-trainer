<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Data\PageMetaData;
use Inertia\Inertia;
use Inertia\Response;

/**
 * GET /privacy: what the site keeps about its visitors, and where. Nothing
 * is kept on the server.
 */
class ShowPrivacyController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Privacy', [
            'meta' => PageMetaData::privacy(),
        ]);
    }
}
