<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Data\PuzzleData;
use App\Data\PuzzleListData;
use App\Http\Controllers\Controller;
use App\Models\Puzzle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GET /api/puzzles?ids=1,2,3: up to 20 puzzles by ID. The response is the
 * same for every visitor, so it may be cached.
 */
class ListPuzzlesController extends Controller
{
    /**
     * A puzzle never changes, so a copy may be kept for a day.
     */
    private const int CACHE_SECONDS = 86400;

    private const int MAX_IDS = 20;

    public function __invoke(Request $request): JsonResponse
    {
        $ids = $request->query('ids');

        // Whole numbers separated by commas. The length limit keeps each one
        // within a bigint.
        if (! is_string($ids) || preg_match('/^[0-9]{1,18}(,[0-9]{1,18})*$/', $ids) !== 1) {
            return $this->invalid('The ids must be a list of numbers separated by commas.');
        }

        $listed = array_map(intval(...), explode(',', $ids));

        if (count($listed) > self::MAX_IDS) {
            return $this->invalid('The ids must list at most '.self::MAX_IDS.' puzzles.');
        }

        $puzzles = Puzzle::query()
            ->whereKey($listed)
            ->get(['id', 'fen', 'setup_move', 'first_move', 'reply_move', 'second_move', 'piece', 'rating'])
            ->keyBy('id');

        // In the order asked for. A repeated ID is returned once, and an ID
        // that names no puzzle is left out.
        $items = [];

        foreach (array_unique($listed) as $id) {
            $puzzle = $puzzles->get($id);

            if ($puzzle !== null) {
                $items[] = new PuzzleData(
                    id: $puzzle->id,
                    fen: $puzzle->fen,
                    setup_move: $puzzle->setup_move,
                    first_move: $puzzle->first_move,
                    reply_move: $puzzle->reply_move,
                    second_move: $puzzle->second_move,
                    piece: $puzzle->piece,
                    rating: $puzzle->rating,
                );
            }
        }

        // Only a successful response carries the public cache header.
        return response()
            ->json(new PuzzleListData($items), options: JSON_UNESCAPED_SLASHES)
            ->setPublic()
            ->setMaxAge(self::CACHE_SECONDS);
    }

    private function invalid(string $message): JsonResponse
    {
        return response()->json(['message' => $message], 422);
    }
}
