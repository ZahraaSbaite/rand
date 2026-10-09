<?php

use App\Http\Controllers\UploadController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => ['status' => 'ok']);

// Images uploaded during local development (production images live in Vercel Blob).
Route::get('/uploads/{name}', [UploadController::class, 'show'])
    ->where('name', '[A-Za-z0-9._-]+');
