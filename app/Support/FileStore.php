<?php

namespace App\Support;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Uploaded images go to Vercel Blob in production (public URLs) and to
 * storage/app/uploads locally (served at /uploads/<name>).
 */
class FileStore
{
    private const BLOB_API = 'https://vercel.com/api/blob';

    public static function localDir(): string
    {
        return storage_path('app/uploads');
    }

    /** True when uploads have somewhere to go (Vercel's own disk is read-only). */
    public static function configured(): bool
    {
        return config('shop.blob_token') || ! env('VERCEL');
    }

    /**
     * Stores the file and returns the URL the frontend should use for it.
     *
     * @throws RuntimeException with a message the admin can act on
     */
    public static function save(UploadedFile $file): string
    {
        $ext = substr(preg_replace('/[^a-z0-9.]/', '', strtolower($file->getClientOriginalExtension())), 0, 10);
        $name = now()->getTimestampMs().'-'.random_int(0, 999_999_999).($ext !== '' ? ".$ext" : '');

        $token = config('shop.blob_token');
        if (! $token) {
            if (! self::configured()) {
                throw new RuntimeException(
                    "Image storage isn't set up yet. In Vercel, open Storage, create a Blob store, "
                    .'connect it to this project, then redeploy.'
                );
            }
            $file->move(self::localDir(), $name);

            return "/uploads/$name";
        }

        // The store id is the fourth "_"-separated part of the token.
        $storeId = explode('_', $token)[3] ?? '';

        try {
            $response = Http::withToken($token)
                ->withHeaders([
                    'x-api-version' => '12',
                    'x-vercel-blob-store-id' => $storeId,
                    'x-vercel-blob-access' => 'public',
                    'x-content-type' => $file->getMimeType(),
                    'x-add-random-suffix' => '0',
                    'x-cache-control-max-age' => '31536000',
                ])
                ->withBody(file_get_contents($file->getRealPath()), $file->getMimeType())
                ->timeout(30)
                ->put(self::BLOB_API.'/?'.http_build_query(['pathname' => "uploads/$name"]));
        } catch (ConnectionException $e) {
            Log::error('Image upload: could not reach Vercel Blob', ['exception' => $e]);

            throw new RuntimeException("Couldn't reach image storage. Please try again.");
        }

        if ($response->failed() || ! $response->json('url')) {
            Log::error('Image upload: Vercel Blob refused it', [
                'status' => $response->status(),
                'body' => mb_substr($response->body(), 0, 500),
            ]);
            $reason = $response->json('error.message') ?? $response->json('error.code') ?? "status {$response->status()}";

            throw new RuntimeException(
                "Image storage refused the upload ({$reason}). Check the Blob store is connected to this project."
            );
        }

        return $response->json('url');
    }
}
