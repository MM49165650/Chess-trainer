<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Data\PracticeGameIdListData;
use App\Http\Controllers\Controller;
use App\Models\PracticeGame;
use Illuminate\Http\JsonResponse;

/**
 * GET /api/practice-games/ids: the IDs of all practice games. The browser
 * picks one of them at random. The response is the same for every visitor,
 * so it may be cached.
 */
class ListPracticeGameIdsController extends Controller
{
    /**
     * A newly imported game appears within an hour.
     */
    private const int CACHE_SECONDS = 3600;

    public function __invoke(): JsonResponse
    {
        // Ordered by ID, so the list is the same every time.
        $ids = [];

        foreach (PracticeGame::query()->orderBy('id')->get(['id']) as $game) {
            $ids[] = $game->id;
        }

        // Only a successful response carries the public cache header.
        return response()
            ->json(new PracticeGameIdListData($ids))
            ->setPublic()
            ->setMaxAge(self::CACHE_SECONDS);
    }
}
