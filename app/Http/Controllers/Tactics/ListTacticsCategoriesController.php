<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tactics;

use App\Data\PageMetaData;
use App\Data\TacticsCategoryData;
use App\Http\Controllers\Controller;
use App\Models\Puzzle;
use Inertia\Inertia;
use Inertia\Response;

/**
 * GET /tactics: the six piece categories, in their fixed order, each with
 * its number of puzzles. The page adds the all pieces option itself.
 */
class ListTacticsCategoriesController extends Controller
{
    private const array PIECES = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

    public function __invoke(): Response
    {
        $categories = [];

        foreach (self::PIECES as $piece) {
            $categories[] = new TacticsCategoryData(
                piece: $piece,
                puzzle_count: Puzzle::query()->where('piece', $piece)->count(),
            );
        }

        return Inertia::render('tactics/Categories', [
            'meta' => PageMetaData::tacticsCategories(),
            'categories' => $categories,
        ]);
    }
}
