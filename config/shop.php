<?php

// Secrets are trimmed because values pasted into a hosting dashboard often
// pick up a trailing newline, which would make every login fail.
return [

    // bcrypt hash of the admin password (hashes made by the old Node backend still work).
    'admin_password_hash' => trim((string) env('ADMIN_PASSWORD_HASH')) ?: null,

    // Long random string used to sign admin session tokens.
    'jwt_secret' => trim((string) env('JWT_SECRET')) ?: null,

    // Set automatically when a Vercel Blob store is connected to the project.
    // Without it, uploaded images are saved under storage/app/uploads.
    'blob_token' => trim((string) env('BLOB_READ_WRITE_TOKEN')) ?: null,

    // The public shop address, for links in customer emails. On Vercel it
    // defaults to the production domain.
    'site_url' => rtrim(
        env('SITE_URL')
            ?: (env('VERCEL_PROJECT_PRODUCTION_URL') ? 'https://'.env('VERCEL_PROJECT_PRODUCTION_URL') : 'http://localhost:5173'),
        '/',
    ),

];
