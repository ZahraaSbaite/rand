<?php

use App\Http\Controllers\AdminStatsController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CollectionController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\CustomOrderController;
use App\Http\Controllers\FaqController;
use App\Http\Controllers\JournalController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProcessStepController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\StoryBlockController;
use App\Http\Controllers\UploadController;
use Illuminate\Support\Facades\Route;

// Everything here is served under /api. Routes inside the 'admin' group need
// the admin session cookie; the rest are public.

Route::pattern('id', '[0-9]+');

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me'])->middleware('admin');
});

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);

Route::get('/orders/track', [OrderController::class, 'track']);
Route::post('/orders', [OrderController::class, 'store']);

Route::get('/categories', [CategoryController::class, 'index']);

Route::post('/custom-orders', [CustomOrderController::class, 'store']);
Route::post('/contact', [ContactController::class, 'store']);

Route::get('/reviews', [ReviewController::class, 'index']);
Route::get('/reviews/public', [ReviewController::class, 'publicIndex']);
Route::post('/reviews', [ReviewController::class, 'store']);

Route::get('/settings', [SettingsController::class, 'index']);

// Editable page content: same shape for each kind.
$content = [
    'collections' => CollectionController::class,
    'faqs' => FaqController::class,
    'journal' => JournalController::class,
    'process-steps' => ProcessStepController::class,
    'story-blocks' => StoryBlockController::class,
];

foreach ($content as $path => $controller) {
    Route::get("/$path", [$controller, 'index']);
}

Route::middleware('admin')->group(function () use ($content) {
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);

    Route::get('/orders', [OrderController::class, 'index']);
    Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);
    Route::patch('/orders/{id}/tracking', [OrderController::class, 'updateTracking']);
    Route::delete('/orders/{id}', [OrderController::class, 'destroy']);

    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    Route::get('/custom-orders', [CustomOrderController::class, 'index']);
    Route::patch('/custom-orders/{id}', [CustomOrderController::class, 'update']);
    Route::delete('/custom-orders/{id}', [CustomOrderController::class, 'destroy']);

    Route::get('/contact', [ContactController::class, 'index']);
    Route::patch('/contact/{id}', [ContactController::class, 'update']);
    Route::delete('/contact/{id}', [ContactController::class, 'destroy']);

    Route::get('/reviews/admin', [ReviewController::class, 'adminIndex']);
    Route::patch('/reviews/{id}/approve', [ReviewController::class, 'approve']);
    Route::patch('/reviews/{id}/unapprove', [ReviewController::class, 'unapprove']);
    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);

    foreach ($content as $path => $controller) {
        Route::post("/$path", [$controller, 'store']);
        Route::patch("/$path/{id}", [$controller, 'update']);
        Route::delete("/$path/{id}", [$controller, 'destroy']);
    }

    Route::post('/upload', [UploadController::class, 'store']);
    Route::put('/settings', [SettingsController::class, 'update']);
    Route::get('/admin/stats', AdminStatsController::class);
});
