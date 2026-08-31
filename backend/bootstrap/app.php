<?php

use App\Http\Middleware\EnsureUserHasRole;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\PostTooLargeException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Bearer-token auth only (frontend stores the Sanctum token from
        // /auth/login in localStorage, no cookies) - statefulApi() would
        // make Sanctum require session CSRF for requests from the
        // frontend's origin, which a token-only client never sends.
        $middleware->alias([
            'role' => EnsureUserHasRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // PHP rejects oversized uploads before validation runs, so this
        // would otherwise surface to the seller as "The POST data is too
        // large." with no hint about what to do.
        $exceptions->render(function (PostTooLargeException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Those photos are too large to upload. Please use smaller images.',
                    'errors' => ['images' => ['Those photos are too large to upload. Please use smaller images.']],
                ], 413);
            }
        });
    })->create();
