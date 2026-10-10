<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    private const RANGES = [7, 30, 90, 365];

    private const TRACKING_STAGES = [
        'received', 'preparing', 'crocheting', 'quality_check', 'ready', 'shipped', 'delivered',
    ];

    // GET /api/admin/analytics?days=7|30|90|365|all
    public function __invoke(Request $request)
    {
        $days = in_array((int) $request->query('days'), self::RANGES, true) ? (int) $request->query('days') : null;
        $allTime = $request->query('days') === 'all';
        $days ??= $allTime ? null : 30;

        $today = Carbon::now('UTC')->startOfDay();
        if ($allTime) {
            $first = DB::table('orders')->min('created_at');
            $from = $first ? Carbon::parse($first, 'UTC')->startOfDay() : $today->copy();
            $days = (int) $from->diffInDays($today) + 1;
        } else {
            $from = $today->copy()->subDays($days - 1);
        }

        // Day bars up to a month, then weeks, then months, so a chart never has hundreds of bars.
        $unit = $days <= 31 ? 'day' : ($days <= 120 ? 'week' : 'month');

        return [
            'range' => [
                'from' => $from->toDateString(),
                'to' => $today->toDateString(),
                'days' => $days,
                'unit' => $unit,
                'all_time' => $allTime,
            ],
            'totals' => $this->totals($from, null),
            // The same number of days just before, for "vs previous period".
            'previous' => $allTime ? null : $this->totals($from->copy()->subDays($days), $from),
            'series' => $this->series($from, $unit),
            'by_category' => $this->byCategory($from),
            'top_products' => $this->topProducts($from),
            'stages' => $this->stages($from),
            'inbox' => $this->inbox($from),
        ];
    }

    private function totals(Carbon $from, ?Carbon $to): array
    {
        $orders = DB::table('orders')
            ->where('created_at', '>=', $from)
            ->when($to, fn ($q) => $q->where('created_at', '<', $to))
            ->selectRaw('COALESCE(SUM(total_cents), 0)::bigint AS revenue, COUNT(*)::int AS orders')
            ->first();

        $items = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.created_at', '>=', $from)
            ->when($to, fn ($q) => $q->where('orders.created_at', '<', $to))
            ->sum('order_items.quantity');

        $count = (int) $orders->orders;

        return [
            'revenue_cents' => (int) $orders->revenue,
            'orders' => $count,
            'items_sold' => (int) $items,
            'average_order_cents' => $count ? intdiv((int) $orders->revenue, $count) : 0,
        ];
    }

    /** Revenue and order count per day/week/month, with empty buckets filled in as zero. */
    private function series(Carbon $from, string $unit): array
    {
        $rows = DB::select(
            "SELECT to_char(b.bucket, 'YYYY-MM-DD') AS start,
                    COALESCE(SUM(o.total_cents), 0)::bigint AS revenue,
                    COUNT(o.id)::int AS orders
             FROM generate_series(
                    date_trunc(?, CAST(? AS timestamp)),
                    date_trunc(?, now() AT TIME ZONE 'UTC'),
                    CAST(? AS interval)
                  ) AS b(bucket)
             LEFT JOIN orders o
               ON date_trunc(?, o.created_at) = b.bucket AND o.created_at >= ?
             GROUP BY b.bucket
             ORDER BY b.bucket",
            [$unit, $from, $unit, "1 $unit", $unit, $from],
        );

        return array_map(fn ($r) => [
            'start' => $r->start,
            'revenue_cents' => (int) $r->revenue,
            'orders' => (int) $r->orders,
        ], $rows);
    }

    private function byCategory(Carbon $from): array
    {
        $rows = DB::select(
            "SELECT COALESCE(NULLIF(p.category, ''), 'Uncategorized') AS category,
                    SUM(oi.quantity * oi.price_cents)::bigint AS revenue,
                    SUM(oi.quantity)::int AS units
             FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             JOIN products p ON p.id = oi.product_id
             WHERE o.created_at >= ?
             GROUP BY 1
             ORDER BY revenue DESC",
            [$from],
        );

        return array_map(fn ($r) => [
            'category' => $r->category,
            'revenue_cents' => (int) $r->revenue,
            'units' => (int) $r->units,
        ], $rows);
    }

    private function topProducts(Carbon $from): array
    {
        $rows = DB::select(
            'SELECT p.id, p.name,
                    SUM(oi.quantity)::int AS units,
                    SUM(oi.quantity * oi.price_cents)::bigint AS revenue
             FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             JOIN products p ON p.id = oi.product_id
             WHERE o.created_at >= ?
             GROUP BY p.id, p.name
             ORDER BY units DESC, revenue DESC
             LIMIT 8',
            [$from],
        );

        return array_map(fn ($r) => [
            'id' => (int) $r->id,
            'name' => $r->name,
            'units' => (int) $r->units,
            'revenue_cents' => (int) $r->revenue,
        ], $rows);
    }

    /** Where this period's orders are now, in fulfillment order. */
    private function stages(Carbon $from): array
    {
        $counts = DB::table('orders')
            ->where('created_at', '>=', $from)
            ->selectRaw('tracking_stage, COUNT(*)::int AS count')
            ->groupBy('tracking_stage')
            ->pluck('count', 'tracking_stage');

        return array_map(
            fn ($stage) => ['stage' => $stage, 'orders' => (int) ($counts[$stage] ?? 0)],
            self::TRACKING_STAGES,
        );
    }

    private function inbox(Carbon $from): array
    {
        $reviews = DB::table('reviews')
            ->where('created_at', '>=', $from)
            ->selectRaw('COUNT(*)::int AS count, ROUND(AVG(rating)::numeric, 1) AS average')
            ->first();

        return [
            'custom_orders' => (int) DB::table('custom_order_requests')->where('created_at', '>=', $from)->count(),
            'messages' => (int) DB::table('contact_messages')->where('created_at', '>=', $from)->count(),
            'reviews' => (int) $reviews->count,
            'average_rating' => $reviews->average === null ? null : (float) $reviews->average,
        ];
    }
}
