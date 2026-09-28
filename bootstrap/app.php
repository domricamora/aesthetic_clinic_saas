<?php

use App\Http\Middleware\CacheFrontendAssets;
use App\Http\Middleware\CaptureAttribution;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            CaptureAttribution::class,
            AddLinkHeadersForPreloadedAssets::class,
            CacheFrontendAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // A stale CSRF token (a tab left open, a session that was cleared, a
        // deploy that rolled the session) should not strand anyone on a dead
        // "Page Expired" page. Send them back to a freshly rendered form with a
        // message so the next attempt just works. Laravel turns the token
        // mismatch into a 419 HttpException before render callbacks run.
        $exceptions->render(function (HttpExceptionInterface $exception, Request $request) {
            if ($exception->getStatusCode() !== 419) {
                return null;
            }

            // Inertia drives the UI over XHR, so it needs the redirect rather
            // than the JSON body a real API client would expect.
            if (! $request->header('X-Inertia') && $request->expectsJson()) {
                return response()->json(['message' => 'Page expired.'], 419);
            }

            $message = __('Your session expired. Please try again.');

            return redirect($request->is('login') ? route('login') : url()->previous())
                ->withInput($request->except(['password', 'password_confirmation', 'current_password', '_token']))
                ->with('status', $message)
                ->with('success', $message);
        });
    })->create();
