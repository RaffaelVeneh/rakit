<?php

use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);

        // Authentication and authorisation are separate questions. `auth` answers
        // "is somebody signed in"; `admin` answers "is it an administrator". The
        // console needs both, and the second is the one that was missing.
        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
        ]);

        // A guest who reaches a protected page is sent to sign in, and returned to
        // where they were going once they have.
        $middleware->redirectGuestsTo(fn () => route('login'));
        // No CSRF exemptions. Seven state-changing routes used to be listed here
        // because they answered with a rendered Blade document and were posted by
        // the browser as ordinary forms, which carry no XSRF header. Every one of
        // them is now an Inertia page driven by `useForm` or `router`, and Inertia
        // posts over axios with `X-XSRF-TOKEN` attached automatically — so the
        // exemptions were dead weight, and two of them (`tps/store`, `oas/store`)
        // were writes sitting outside the token check for no reason at all.
        // Restoring the check costs nothing and closes them.
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
