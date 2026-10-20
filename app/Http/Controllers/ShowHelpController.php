<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Data\PageMetaData;
use Inertia\Inertia;
use Inertia\Response;

/**
 * GET /help: where the user's progress is kept, what can lose it, and how to
 * install the site.
 */
class ShowHelpController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Help', [
            'meta' => PageMetaData::help(),
        ]);
    }
}
