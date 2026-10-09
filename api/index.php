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

require __DIR__.'/../public/index.php';
