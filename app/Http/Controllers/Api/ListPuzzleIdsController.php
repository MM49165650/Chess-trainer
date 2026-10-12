<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Data\PuzzleIdListData;
use App\Http\Controllers\Controller;
use App\Models\Puzzle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GET /api/puzzles/ids?piece=knight: every puzzle in one category, as pairs
 * of ID and rating. The response is the same for every visitor, so it may be
 * cached.
 */
class ListPuzzleIdsController extends Controller
{
    /**
     * A newly imported puzzle appears within an hour.
     */
    private const int CACHE_SECONDS = 3600;

    private const array PIECES = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

    public function __invoke(Request $request): JsonResponse
    {
        $piece = $request->query('piece');

        // The all pieces option is made in the browser from the six lists.
        if (! is_string($piece) || ! in_array($piece, self::PIECES, true)) {
            return response()->json(['message' => 'The piece must be one of: '.implode(', ', self::PIECES).'.'], 422);
        }

        // Ordered by rating and then ID, so the list is the same every time.
        $puzzles = Puzzle::query()
            ->where('piece', $piece)
            ->orderBy('rating')
            ->orderBy('id')
            ->get(['id', 'rating']);

        $items = [];

        foreach ($puzzles as $puzzle) {
            $items[] = [$puzzle->id, $puzzle->rating];
        }

        // Only a successful response carries the public cache header.
        return response()
            ->json(new PuzzleIdListData($piece, $items))
            ->setPublic()
            ->setMaxAge(self::CACHE_SECONDS);
    }
}
