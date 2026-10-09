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

    protected function isUniqueViolation(QueryException $e): bool
    {
        return $e->getCode() === '23505';
    }

    protected function isForeignKeyViolation(QueryException $e): bool
    {
        return $e->getCode() === '23503';
    }
}
