<?php

declare(strict_types=1);

namespace App\Http\Controllers\Hanging;

use App\Data\PageMetaData;
use App\Http\Controllers\Controller;
use App\Models\PracticeGame;
use Inertia\Inertia;
use Inertia\Response;

/**
 * GET /hanging/game/{game}: one practice game in spot the hanging piece, by
 * its number, so that a coach can give a student a game. The page is the
 * exercise's own, told which game to open; an unknown number is a 404.
 */
class PlayHangingGameController extends Controller
{
    public function __invoke(string $game): Response
    {
        $number = (int) $game;

        abort_unless(PracticeGame::query()->whereKey($number)->exists(), 404);

        return Inertia::render('marking/Play', [
            'meta' => PageMetaData::hangingGame($number),
            'mode' => 'hanging',
            'number' => $number,
        ]);
    }
}
