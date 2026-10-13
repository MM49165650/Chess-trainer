<?php

declare(strict_types=1);

namespace App\Http\Controllers\Dev;

use App\Http\Controllers\Controller;
use App\Models\PracticeGame;
use Illuminate\Http\RedirectResponse;

/**
 * GET /dev/answers/random: redirects the answer viewer to a random practice
 * game. With no games loaded it goes to the viewer, which says so.
 */
class RandomAnswerViewerController extends Controller
{
    public function __invoke(): RedirectResponse
    {
        $game = PracticeGame::query()->inRandomOrder()->value('id');

        return $game === null
            ? to_route('dev.answers')
            : to_route('dev.answers', ['game' => $game]);
    }
}
