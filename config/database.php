<?php

return [

    'default' => 'pgsql',

    'connections' => [

        'pgsql' => [
            'driver' => 'pgsql',
            // DATABASE_URL / POSTGRES_URL are set by Vercel's Neon integration.
            'url' => env('DB_URL', env('DATABASE_URL', env('POSTGRES_URL'))),
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '5432'),
            'database' => env('DB_DATABASE', 'crochet_shop'),
            'username' => env('DB_USERNAME', 'postgres'),
            'password' => env('DB_PASSWORD', ''),
            'charset' => 'utf8',
            'prefix' => '',
            'prefix_indexes' => true,
            'search_path' => 'public',
            // Timestamps are stored without a zone; keep them in UTC.
            'timezone' => 'UTC',
            'sslmode' => env('DB_SSLMODE', 'prefer'),
        ],

    ],

    'migrations' => [
        'table' => 'migrations',
        'update_date_on_publish' => true,
    ],

];
