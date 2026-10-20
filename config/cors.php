<?php

// On Vercel the frontend and API share an origin, so CORS only matters when
// the frontend is served from somewhere else (FRONTEND_URL). The Vite dev
// server is trusted only outside production.
return [

    'paths' => ['api/*', 'uploads/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter([
        env('FRONTEND_URL') ?: (env('APP_ENV') === 'production' ? null : 'http://localhost:5173'),
    ])),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
