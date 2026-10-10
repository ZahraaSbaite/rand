<?php

use App\Http\Controllers\UploadController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// Reports whether the database is reachable, and why not. Only says which
// connection variables are set (never their values) and strips hosts, IPs
// and user names from the error.
Route::get('/health', function () {
    // For each connection variable: unset, or the provider's domain (e.g. "prisma.io").
    $vars = [];
    foreach (['DB_URL', 'DATABASE_URL', 'POSTGRES_URL'] as $name) {
        $host = parse_url((string) getenv($name), PHP_URL_HOST);
        $vars[$name] = $host ? implode('.', array_slice(explode('.', $host), -2)) : false;
    }

    // Older libpq versions don't send SNI, which some hosted Postgres proxies require.
    ob_start();
    phpinfo(INFO_MODULES);
    preg_match('/libpq\)? Version\s*(?:=>)?\s*([\d.]+)/i', strip_tags(ob_get_clean()), $libpq);

    try {
        DB::select('SELECT 1');
        $database = 'ok';
    } catch (Throwable $e) {
        $message = preg_replace(
            ['/"[^"]*"/', '/\b\d{1,3}(\.\d{1,3}){3}\b/', '/\(Connection: .*$/s'],
            ['"…"', '…', ''],
            $e->getMessage(),
        );
        $database = trim($message);
    }

    return [
        'status' => $database === 'ok' ? 'ok' : 'error',
        'database' => $database,
        'env' => $vars,
        'libpq' => $libpq[1] ?? null,
    ];
});

// Images uploaded during local development (production images live in Vercel Blob).
Route::get('/uploads/{name}', [UploadController::class, 'show'])
    ->where('name', '[A-Za-z0-9._-]+');
