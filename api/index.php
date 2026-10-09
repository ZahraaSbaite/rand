<?php

// Vercel function entry point: every /api/* and /uploads/* request lands here
// (see vercel.json) and is handed to Laravel.

// The function's disk is read-only apart from /tmp, so point Laravel's
// generated files there and send logs to stderr. Project env vars win.
$defaults = [
    'APP_ENV' => 'production',
    'APP_DEBUG' => 'false',
    'LOG_CHANNEL' => 'stderr',
    'CACHE_STORE' => 'database',
    'SESSION_DRIVER' => 'array',
    'APP_CONFIG_CACHE' => '/tmp/config.php',
    'APP_EVENTS_CACHE' => '/tmp/events.php',
    'APP_PACKAGES_CACHE' => '/tmp/packages.php',
    'APP_ROUTES_CACHE' => '/tmp/routes.php',
    'APP_SERVICES_CACHE' => '/tmp/services.php',
    'VIEW_COMPILED_PATH' => '/tmp',
];

foreach ($defaults as $key => $value) {
    if (getenv($key) === false) {
        putenv("$key=$value");
        $_ENV[$key] = $_SERVER[$key] = $value;
    }
}

// vercel.json passes the original path as ?__route=, since the rewrite
// replaces the request path with /api/index.php.
if (isset($_GET['__route'])) {
    $path = '/'.ltrim((string) $_GET['__route'], '/');
    unset($_GET['__route']);
    $query = http_build_query($_GET);
    $_SERVER['REQUEST_URI'] = $path.($query === '' ? '' : "?$query");
    $_SERVER['QUERY_STRING'] = $query;
}

// Present the app as running from the site root. Otherwise Laravel treats
// /api as the base URL and /api/products would be routed as /products.
$_SERVER['SCRIPT_NAME'] = $_SERVER['PHP_SELF'] = '/index.php';
$_SERVER['SCRIPT_FILENAME'] = __DIR__.'/../public/index.php';

require __DIR__.'/../public/index.php';
