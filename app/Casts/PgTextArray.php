<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/** Maps a Postgres TEXT[] column to a PHP list of strings and back. */
class PgTextArray implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): array
    {
        if ($value === null || $value === '{}') {
            return [];
        }

        // Postgres array literal, e.g. {Oat,"Tomato & Oat","say \"hi\""}
        $items = [];
        $end = strlen($value) - 1;
        $i = 1;

        while ($i < $end) {
            if ($value[$i] === '"') {
                $item = '';
                for ($i++; $value[$i] !== '"'; $i++) {
                    if ($value[$i] === '\\') {
                        $i++;
                    }
                    $item .= $value[$i];
                }
                $items[] = $item;
                $i++;
            } else {
                $comma = strpos($value, ',', $i);
                $next = $comma === false ? $end : $comma;
                $item = substr($value, $i, $next - $i);
                $items[] = $item === 'NULL' ? null : $item;
                $i = $next;
            }
            $i++; // skip the comma
        }

        return $items;
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        $items = array_map(
            fn ($item) => $item === null ? 'NULL' : '"'.addcslashes((string) $item, '"\\').'"',
            array_values((array) $value),
        );

        return '{'.implode(',', $items).'}';
    }
}
