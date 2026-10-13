<?php

declare(strict_types=1);

namespace App\Http\Controllers\Dev;

use App\Data\PracticeGameData;
use App\Http\Controllers\Controller;
use App\Models\PracticeGame;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * GET /dev/answers/{game?}: the development-only page that steps through a
 * practice game and shows its stored answers. Without a game it goes to the
 * first one. The route exists only in the local environment.
 */
class ShowAnswerViewerController extends Controller
{
    public function __invoke(?string $game = null): Response|RedirectResponse
    {
        if ($game === null) {
            $first = PracticeGame::query()->min('id');

            // With no games loaded, the page says so.
            return $first === null
                ? Inertia::render('dev/AnswerViewer', ['game' => null, 'previousId' => null, 'nextId' => null])
                : to_route('dev.answers', ['game' => $first]);
        }

        $found = PracticeGame::query()->find((int) $game);

        abort_if($found === null, 404);

        return Inertia::render('dev/AnswerViewer', [
            'game' => PracticeGameData::from([
                'id' => $found->id,
                'white_rating' => $found->white_rating,
                'black_rating' => $found->black_rating,
                'time_control' => $found->time_control,
                'ply_count' => $found->ply_count,
                'answers_version' => $found->answers_version,
                'moves' => $found->moves,
            ]),
            'previousId' => PracticeGame::query()->where('id', '<', $found->id)->max('id'),
            'nextId' => PracticeGame::query()->where('id', '>', $found->id)->min('id'),
        ]);
    }
}
