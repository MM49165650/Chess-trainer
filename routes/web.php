<?php

declare(strict_types=1);

use App\Http\Controllers\Guess\PlayMasterGameController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

Route::get('/', fn (): Response => Inertia::render('Home'))->name('home');

// Guess the move. When /guess/{master}/random arrives it must be registered
// above this route, and {game} accepts digits only so the two never clash.
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
