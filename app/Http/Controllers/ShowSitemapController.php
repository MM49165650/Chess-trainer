<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Master;
use App\Models\MasterGame;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Config;

/**
 * GET /sitemap.xml: the home page, the masters page, each master's page and
 * every master game page. It is the same for every visitor, so it may be
 * cached.
 */
class ShowSitemapController extends Controller
{
    /**
     * Newly imported games appear within the hour.
     */
    private const int CACHE_SECONDS = 3600;

    public function __invoke(): Response
    {
        $paths = [
            route('home', absolute: false),
            route('guess.masters', absolute: false),
        ];

        foreach (Master::query()->orderBy('sort_order')->get() as $master) {
            $paths[] = route('guess.games', ['master' => $master->slug], absolute: false);

            // Only the IDs are read, never the moves.
            foreach (MasterGame::query()->where('master_id', $master->id)->orderBy('id')->pluck('id') as $id) {
                $paths[] = route('guess.play', ['master' => $master->slug, 'game' => $id], absolute: false);
            }
        }

        // Addresses are built on the site's own address, not on whatever
        // host the request named.
        $root = rtrim(Config::string('app.url'), '/');

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n"
            .'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";

        foreach ($paths as $path) {
            $xml .= '  <url><loc>'.htmlspecialchars($root.$path, ENT_XML1).'</loc></url>'."\n";
        }

        $xml .= '</urlset>'."\n";

        return response($xml, headers: ['Content-Type' => 'application/xml; charset=UTF-8'])
            ->setPublic()
            ->setMaxAge(self::CACHE_SECONDS);
    }
}
