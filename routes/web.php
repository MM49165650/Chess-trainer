<?php

declare(strict_types=1);

use App\Http\Controllers\Guess\ListMasterGamesController;
use App\Http\Controllers\Guess\ListMastersController;
use App\Http\Controllers\Guess\PlayMasterGameController;
use App\Http\Controllers\Guess\RandomMasterGameController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

Route::get('/', fn (): Response => Inertia::render('Home'))->name('home');

// Guess the move. /guess/{master}/random is registered above the play route,
// and {game} accepts digits only, so the two never clash.
Route::get('/guess', ListMastersController::class)->name('guess.masters');

Route::get('/guess/{master}', ListMasterGamesController::class)
    ->where('master', '[a-z]+')
    ->name('guess.games');

Route::get('/guess/{master}/random', RandomMasterGameController::class)
    ->where('master', '[a-z]+')
    ->name('guess.random');

Route::get('/guess/{master}/{game}', PlayMasterGameController::class)
    ->where('master', '[a-z]+')
    ->where('game', '[0-9]{1,18}')
    ->name('guess.play');

// Development-only pages. They are never registered on the public site, and
// a production build leaves their code out as well.
if (app()->environment('local')) {
    Route::get('/dev/board', fn (): Response => Inertia::render('dev/BoardDemo'))->name('dev.board');
    Route::get('/dev/components', fn (): Response => Inertia::render('dev/ComponentSamples'))->name('dev.components');
}
