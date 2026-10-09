<?php

use App\Http\Middleware\EnsureSchema;
use App\Http\Middleware\RequireAdmin;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull;
use Illuminate\Foundation\Http\Middleware\TrimStrings;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        web: __DIR__.'/../routes/web.php',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Vercel sits in front of the app; trust it so rate limiting sees real client IPs.
        $middleware->trustProxies(at: '*');

        // Admins clear a field by sending "", so keep empty strings as they are.
        $middleware->remove([ConvertEmptyStringsToNull::class, TrimStrings::class]);

        $middleware->append(SecurityHeaders::class);

        // Creates the tables on first use of an empty database.
        $middleware->prependToGroup('api', EnsureSchema::class);
        // routes/web.php only serves images and a health check: no session, cookies or CSRF.
        $middleware->group('web', []);

        $middleware->alias(['admin' => RequireAdmin::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // The frontend reads { error } from every failed response.
        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }
            // Already a finished response (e.g. the login rate limiter's 429).
            if ($e instanceof HttpResponseException) {
                return $e->getResponse();
            }
            if ($e instanceof HttpExceptionInterface) {
                $status = $e->getStatusCode();

                return response()->json(
                    ['error' => $e->getMessage() ?: (Response::$statusTexts[$status] ?? 'Request failed')],
                    $status,
                    $e->getHeaders(),
                );
            }

            return response()->json(['error' => 'Something went wrong. Please try again.'], 500);
        });
    })->create();
