<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // 10 login attempts per 15 minutes per IP. Counts live in the database
        // cache table so every serverless instance shares them.
        RateLimiter::for('login', fn (Request $request) => Limit::perMinutes(15, 10)
            ->by($request->ip())
            ->response(fn (Request $request, array $headers) => response()->json(
                ['error' => 'Too many login attempts. Try again later.'],
                429,
                $headers,
            )));
    }
}
