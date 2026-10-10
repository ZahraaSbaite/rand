<?php

// Customer emails go out through a Gmail account: set MAIL_USERNAME (the
// Gmail address) and MAIL_PASSWORD (a Google app password). Without them,
// emails are written to the log instead of being sent.
return [

    'default' => env('MAIL_MAILER', env('MAIL_USERNAME') ? 'smtp' : 'log'),

    'mailers' => [

        'smtp' => [
            'transport' => 'smtp',
            'scheme' => env('MAIL_SCHEME', 'smtps'),
            'host' => env('MAIL_HOST', 'smtp.gmail.com'),
            'port' => (int) env('MAIL_PORT', 465),
            'username' => trim((string) env('MAIL_USERNAME')),
            // Google shows app passwords in groups of four; the spaces aren't part of it.
            'password' => str_replace(' ', '', trim((string) env('MAIL_PASSWORD'))),
            'timeout' => 10,
            'local_domain' => env('MAIL_EHLO_DOMAIN'),
        ],

        'log' => [
            'transport' => 'log',
            'channel' => env('MAIL_LOG_CHANNEL'),
        ],

        'array' => [
            'transport' => 'array',
        ],

    ],

    'from' => [
        'address' => trim((string) env('MAIL_FROM_ADDRESS', env('MAIL_USERNAME', 'hello@example.com'))),
        'name' => env('MAIL_FROM_NAME', 'Strand'),
    ],

];
