<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

/**
 * How full the custom order queue is, in hours of work. The studio sets how
 * many hours a week go to custom pieces and how many weeks ahead it books;
 * once the queued work fills that window, new requests are turned away.
 */
class CommissionCapacity
{
    /** Requests that hold a place in the queue. */
    public const ACTIVE = ['new', 'quoted', 'approved', 'in_progress'];

    public const SETTINGS = ['custom_hours_per_week', 'custom_booking_weeks', 'custom_default_hours'];

    /**
     * @return array{limited: bool, open: bool, weeks_out: ?int, booked_hours: float, limit_hours: ?float}
     */
    public static function current(): array
    {
        $settings = DB::table('site_settings')->whereIn('key', self::SETTINGS)->pluck('value', 'key');
        $perWeek = (float) ($settings['custom_hours_per_week'] ?? 0);
        $weeks = max(1, (int) ($settings['custom_booking_weeks'] ?? 0) ?: 6);
        $defaultHours = (float) ($settings['custom_default_hours'] ?? 0) ?: 6.0;

        // Unquoted requests count as the typical piece, once per item asked for.
        $booked = (float) DB::table('custom_order_requests')
            ->whereIn('status', self::ACTIVE)
            ->selectRaw('COALESCE(SUM(COALESCE(quote_hours, ? * GREATEST(quantity, 1))), 0) AS hours', [$defaultHours])
            ->value('hours');

        if ($perWeek <= 0) {
            return ['limited' => false, 'open' => true, 'weeks_out' => null, 'booked_hours' => round($booked, 1), 'limit_hours' => null];
        }

        $limit = $perWeek * $weeks;

        return [
            'limited' => true,
            'open' => $booked < $limit,
            'weeks_out' => (int) ceil($booked / $perWeek),
            'booked_hours' => round($booked, 1),
            'limit_hours' => $limit,
        ];
    }
}
