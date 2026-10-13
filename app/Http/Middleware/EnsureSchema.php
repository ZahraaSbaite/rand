<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Runs database/schema.sql once if the database has no tables yet, so a fresh
 * database works without a manual setup step. An existing database is left
 * alone, so seed rows the admin deleted don't come back.
 */
class EnsureSchema
{
    private static bool $ready = false;

    public function handle(Request $request, Closure $next): Response
    {
        if (! self::$ready) {
            $tables = DB::selectOne(
                "SELECT to_regclass('public.site_settings') AS settings, to_regclass('public.cache') AS cache"
            );

            if (! $tables->settings) {
                DB::unprepared(file_get_contents(database_path('schema.sql')));
                Log::info('Database schema created');
            }
            // Databases created by the old Node backend lack the cache table
            // that login rate limiting uses.
            if (! $tables->cache) {
                DB::unprepared(file_get_contents(database_path('cache.sql')));
            }

            // Reviews used to need approval and product ratings only counted
            // approved ones. Now every review is public, so recount once.
            if (! Cache::has('upgrade:reviews-recounted')) {
                DB::update(
                    'UPDATE products p SET
                       review_count = (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id),
                       rating = COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 1) FROM reviews r WHERE r.product_id = p.id), 0)'
                );
                Cache::forever('upgrade:reviews-recounted', true);
            }

            self::$ready = true;
        }

        return $next($request);
    }
}
