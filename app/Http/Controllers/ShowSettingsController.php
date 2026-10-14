<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Data\PageMetaData;
use Inertia\Inertia;
use Inertia\Response;

/**
 * GET /settings: the user's settings. They are kept in the browser, so the
 * page needs nothing from the server but its title and description.
 */
class ShowSettingsController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Settings', [
            'meta' => PageMetaData::settings(),
        ]);
    }
}
