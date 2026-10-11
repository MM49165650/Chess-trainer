<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

Route::get('/', fn (): Response => Inertia::render('Home'))->name('home');

// Development-only pages. They are never registered on the public site, and
// a production build leaves their code out as well.
if (app()->environment('local')) {
    Route::get('/dev/board', fn (): Response => Inertia::render('dev/BoardDemo'))->name('dev.board');
    Route::get('/dev/components', fn (): Response => Inertia::render('dev/ComponentSamples'))->name('dev.components');
}
