<?php

namespace App\Http\Controllers;

use App\Support\AdminSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    // POST /api/auth/login (rate limited, see AppServiceProvider)
    public function login(Request $request)
    {
        $password = $request->input('password');
        if (! is_string($password) || $password === '') {
            return $this->error('Password is required', 400);
        }

        $hash = config('shop.admin_password_hash');
        if (! $hash || ! AdminSession::secret()) {
            Log::error('ADMIN_PASSWORD_HASH or JWT_SECRET is not configured');

            return $this->error('Server is not configured for login', 500);
        }
        if (strlen(AdminSession::secret()) < 32) {
            Log::error('JWT_SECRET must be at least 32 characters long');

            return $this->error('Server is not configured for login', 500);
        }

        // password_verify accepts the $2a$/$2b$ hashes bcryptjs produced.
        if (! password_verify($password, $hash)) {
            return $this->error('Incorrect password', 401);
        }

        return response()->json(['ok' => true])->withCookie(AdminSession::issueCookie());
    }

    // POST /api/auth/logout
    public function logout()
    {
        return response()->json(['ok' => true])->withCookie(AdminSession::forgetCookie());
    }

    // GET /api/auth/me (admin middleware does the checking)
    public function me()
    {
        return ['ok' => true];
    }
}
