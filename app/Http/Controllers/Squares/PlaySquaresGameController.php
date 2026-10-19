<?php

declare(strict_types=1);

namespace App\Http\Controllers\Squares;

use App\Data\PageMetaData;
use App\Http\Controllers\Controller;
use App\Models\PracticeGame;
use Inertia\Inertia;
use Inertia\Response;

/**
 * GET /squares/game/{game}: one practice game in square control, by its
 * number, so that a coach can give a student a game. The page is the
 * exercise's own, told which game to open; an unknown number is a 404.
 */
class PlaySquaresGameController extends Controller
{
    public function __invoke(string $game): Response
    {
        $number = (int) $game;

        abort_unless(PracticeGame::query()->whereKey($number)->exists(), 404);

        return Inertia::render('marking/Play', [
            'meta' => PageMetaData::squaresGame($number),
            'mode' => 'squares',
            'number' => $number,
        ]);
    }
}
