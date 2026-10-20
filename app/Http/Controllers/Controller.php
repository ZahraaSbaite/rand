<?php

namespace App\Http\Controllers;

use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

abstract class Controller
{
    /**
     * The given body fields that were sent with a non-null value. Updates only
     * touch these, so a partial body leaves the other columns alone.
     */
    protected function provided(Request $request, array $fields): array
    {
        return array_filter($request->only($fields), fn ($value) => $value !== null);
    }

    protected function error(string $message, int $status): JsonResponse
    {
        return response()->json(['error' => $message], $status);
    }

    /**
     * Checks public form input: each listed field, when sent, must be text no
     * longer than its limit, and email fields must be valid addresses.
     * Returns an error response, or null when everything is fine.
     *
     * @param  array<string, int>  $limits  field => maximum characters
     */
    protected function invalidInput(Request $request, array $limits, array $emails = []): ?JsonResponse
    {
        foreach ($limits as $field => $max) {
            $value = $request->input($field);
            if ($value === null) {
                continue;
            }
            if (! is_scalar($value) || mb_strlen((string) $value) > $max) {
                $label = str_replace('_', ' ', $field);

                return $this->error(ucfirst($label)." is too long (at most {$max} characters).", 400);
            }
        }
        foreach ($emails as $field) {
            $email = trim((string) $request->input($field));
            if ($email !== '' && ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return $this->error('Please enter a valid email address.', 400);
            }
        }

        return null;
    }

    protected function isUniqueViolation(QueryException $e): bool
    {
        return $e->getCode() === '23505';
    }

    protected function isForeignKeyViolation(QueryException $e): bool
    {
        return $e->getCode() === '23503';
    }
}
