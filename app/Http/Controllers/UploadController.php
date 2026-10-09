<?php

namespace App\Http\Controllers;

use App\Support\FileStore;
use Illuminate\Http\Request;

class UploadController extends Controller
{
    // Vercel caps request bodies at 4.5MB.
    public const MAX_BYTES = 4 * 1024 * 1024;

    private const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    // POST /api/upload - one image in the "image" field
    public function store(Request $request)
    {
        $file = $request->file('image');

        if (! $file) {
            return $this->error('No file uploaded', 400);
        }
        if (! $file->isValid() || $file->getSize() > self::MAX_BYTES) {
            return $this->error('Images must be 4MB or smaller', 400);
        }
        if (! in_array($file->getMimeType(), self::IMAGE_TYPES, true)) {
            return $this->error('Only JPEG, PNG, WEBP, or GIF images are allowed', 400);
        }

        return response()->json(['url' => FileStore::save($file)], 201);
    }

    // GET /uploads/{name} - images saved to local disk during development
    public function show(string $name)
    {
        $path = FileStore::localDir().DIRECTORY_SEPARATOR.$name;
        abort_unless(is_file($path), 404);

        return response()->file($path, ['Cache-Control' => 'public, max-age=31536000, immutable']);
    }
}
