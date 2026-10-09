<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

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

    /** Stores the file and returns the URL the frontend should use for it. */
    public static function save(UploadedFile $file): string
    {
        $ext = substr(preg_replace('/[^a-z0-9.]/', '', strtolower($file->getClientOriginalExtension())), 0, 10);
        $name = now()->getTimestampMs().'-'.random_int(0, 999_999_999).($ext !== '' ? ".$ext" : '');

        $token = config('shop.blob_token');
        if (! $token) {
            $file->move(self::localDir(), $name);

            return "/uploads/$name";
        }

        // The store id is the fourth "_"-separated part of the token.
        $storeId = explode('_', $token)[3] ?? '';

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
            ->put(self::BLOB_API.'/?'.http_build_query(['pathname' => "uploads/$name"]))
            ->throw();

        return $response->json('url');
    }
}
