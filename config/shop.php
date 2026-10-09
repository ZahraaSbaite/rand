<?php

return [

    // bcrypt hash of the admin password (hashes made by the old Node backend still work).
    'admin_password_hash' => env('ADMIN_PASSWORD_HASH'),

    // Long random string used to sign admin session tokens.
    'jwt_secret' => env('JWT_SECRET'),

    // Set automatically when a Vercel Blob store is connected to the project.
    // Without it, uploaded images are saved under storage/app/uploads.
    'blob_token' => env('BLOB_READ_WRITE_TOKEN'),

];
