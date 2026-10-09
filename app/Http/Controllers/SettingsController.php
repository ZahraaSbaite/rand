<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    // GET /api/settings - all site settings as { key: value }
    public function index()
    {
        return response()->json($this->all());
    }

    // PUT /api/settings - upsert any number of { key: value } pairs
    public function update(Request $request)
    {
        $rows = collect($request->json()->all())
            ->filter(fn ($value, $key) => is_string($value) && preg_match('/^[a-z0-9_]{1,64}$/', (string) $key))
            ->map(fn ($value, $key) => ['key' => $key, 'value' => $value])
            ->values()
            ->all();

        if ($rows === []) {
            return $this->error('No valid settings provided', 400);
        }

        DB::table('site_settings')->upsert($rows, ['key'], ['value']);

        return response()->json($this->all());
    }

    private function all(): object
    {
        return (object) DB::table('site_settings')->pluck('value', 'key')->all();
    }
}
