<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Data\PageMetaData;
use Inertia\Inertia;
use Inertia\Response;

/**
 * GET /about: what the site is and how the four modes work. The page needs
 * nothing from the server but its title and description.
 */
class ShowAboutController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('About', [
            'meta' => PageMetaData::about(),
        ]);
    }
}
