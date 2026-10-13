<?php

declare(strict_types=1);

use App\Http\Controllers\Api\ListPracticeGameIdsController;
use App\Http\Controllers\Api\ListPuzzleIdsController;
use App\Http\Controllers\Api\ListPuzzlesController;
use App\Http\Controllers\Api\ShowMasterGameController;
use App\Http\Controllers\Api\ShowPracticeGameController;
use Illuminate\Support\Facades\Route;

/*
 * The data endpoints: Appendix F of docs/requirements.md. They are stateless,
 * with no session and no cookie, because a response that sets a cookie is not
 * cached by Cloudflare.
 */
Route::middleware('throttle:120,1')->group(function (): void {
    // An ID that is not a number names no game, so it is a 404 like an
    // unknown ID. The length limit keeps it within a bigint.
    Route::get('/master-games/{id}', ShowMasterGameController::class)
        ->where('id', '[0-9]{1,18}')
        ->name('api.master-games.show');

    // The ID list is registered above the game route, and {id} accepts
    // digits only, so the two never clash.
    Route::get('/practice-games/ids', ListPracticeGameIdsController::class)->name('api.practice-games.ids');

    Route::get('/practice-games/{id}', ShowPracticeGameController::class)
        ->where('id', '[0-9]{1,18}')
        ->name('api.practice-games.show');

    Route::get('/puzzles/ids', ListPuzzleIdsController::class)->name('api.puzzles.ids');

    Route::get('/puzzles', ListPuzzlesController::class)->name('api.puzzles.index');
});
