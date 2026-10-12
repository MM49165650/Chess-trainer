<?php

declare(strict_types=1);

use App\Data\PageMetaData;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request): bool => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (NotFoundHttpException $exception, Request $request): ?Response {
            // Every 404 under /api has the same body, whatever was asked for.
            if ($request->is('api/*')) {
                return new JsonResponse(['message' => 'Not found.'], 404);
            }

            if ($request->expectsJson()) {
                return null;
            }

            // Everywhere else an address that matches no page, or names a
            // master or game that does not exist, gets the site's own page.
            return Inertia::render('NotFound', ['meta' => PageMetaData::notFound()])->toResponse($request)->setStatusCode(404);
        });
    })->create();
