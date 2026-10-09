<?php

namespace App\Support;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Cookie;
use Throwable;

/**
 * The admin session is a signed JWT in an httpOnly cookie, so no session
 * storage is needed between serverless invocations.
 */
class AdminSession
{
    public const COOKIE = 'admin_token';

    private const LIFETIME_MINUTES = 12 * 60;

    public static function secret(): ?string
    {
        return config('shop.jwt_secret') ?: null;
    }

    /** True when the request carries a valid admin session cookie. */
    public static function check(Request $request): bool
    {
        $token = $request->cookie(self::COOKIE);
        $secret = self::secret();

        if (! is_string($token) || $token === '' || ! $secret) {
            return false;
        }

        try {
            JWT::decode($token, new Key($secret, 'HS256'));

            return true;
        } catch (Throwable) {
            return false;
        }
    }

    public static function issueCookie(): Cookie
    {
        $now = time();
        $token = JWT::encode(
            ['role' => 'admin', 'iat' => $now, 'exp' => $now + self::LIFETIME_MINUTES * 60],
            self::secret(),
            'HS256',
        );

        return cookie(self::COOKIE, $token, self::LIFETIME_MINUTES, '/', null, self::secure(), true, false, 'Strict');
    }

    public static function forgetCookie(): Cookie
    {
        return cookie(self::COOKIE, '', -2628000, '/', null, self::secure(), true, false, 'Strict');
    }

    private static function secure(): bool
    {
        return app()->environment('production');
    }
}
