<?php

namespace App\Http\Middleware;

use App\Support\AdminSession;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->hasCookie(AdminSession::COOKIE)) {
            return response()->json(['error' => 'Not authenticated'], 401);
        }

        if (! AdminSession::check($request)) {
            return response()->json(['error' => 'Invalid or expired session'], 401);
        }

        return $next($request);
    }
}
