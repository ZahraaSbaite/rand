<?php

use App\Http\Controllers\UploadController;
use App\Support\AdminSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// Reports whether the database is reachable. A signed-in admin also gets why
// not and which services are configured (never secret values; hosts, IPs and
// user names are stripped from errors). The public only sees ok / error.
Route::get('/health', function (Request $request) {
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

    $status = $database === 'ok' ? 'ok' : 'error';
    if (! AdminSession::check($request)) {
        return ['status' => $status];
    }

    return [
        'status' => $status,
        'database' => $database,
        'env' => $vars,
        'image_storage' => config('shop.blob_token')
            ? 'vercel-blob'
            : (\App\Support\FileStore::configured() ? 'local-disk' : 'not-configured'),
        'libpq' => $libpq[1] ?? null,
    ];
});

// Images uploaded during local development (production images live in Vercel Blob).
Route::get('/uploads/{name}', [UploadController::class, 'show'])
    ->where('name', '[A-Za-z0-9._-]+');
