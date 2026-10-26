<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Support\Facades\DB;

class AdminStatsController extends Controller
{
    private const LOW_STOCK = 2;

    // GET /api/admin/stats - numbers for the dashboard overview
    public function __invoke()
    {
        // Board columns follow each order's status (its tracking stage).
        $byStatus = DB::table('orders')
            ->selectRaw("CASE
                    WHEN tracking_stage IN ('shipped', 'delivered') THEN 'done'
                    WHEN tracking_stage = 'received' THEN 'not_started'
                    ELSE 'in_progress'
                END AS column_key, COUNT(*)::int AS count")
            ->groupByRaw('1')
            ->pluck('count', 'column_key');

        $revenue = DB::selectOne(
            "SELECT
               COALESCE(SUM(total_cents), 0)::bigint AS all_time,
               COALESCE(SUM(total_cents) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'), 0)::bigint AS last_30,
               COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS orders_30
             FROM orders"
        );

        // Made-to-order pieces have no stock count, so they never sell out on stock.
        $products = DB::selectOne(
            "SELECT COUNT(*)::int AS total,
                    COUNT(*) FILTER (WHERE status = 'published')::int AS visible,
                    COUNT(*) FILTER (WHERE status = 'sold_out'
                      OR (status = 'published' AND fulfillment = 'ready' AND stock_quantity <= 0))::int AS sold_out
             FROM products"
        );

        // Per option, so "Plum / Large" running out shows even when other colors are fine.
        $lowStock = collect(DB::select(
            "SELECT p.id, p.name, p.category, p.option_groups, v.options, v.stock_quantity
             FROM product_variants v JOIN products p ON p.id = v.product_id
             WHERE p.status = 'published' AND p.fulfillment = 'ready' AND v.is_available
               AND v.stock_quantity <= ?
             ORDER BY v.stock_quantity, p.name, v.sort_order
             LIMIT 8",
            [self::LOW_STOCK],
        ))->map(function ($row) {
            $options = json_decode($row->options, true) ?: [];
            $label = implode(' / ', array_filter(array_map(
                fn ($group) => $options[$group['name']] ?? null,
                json_decode($row->option_groups, true) ?: [],
            )));

            return [
                'id' => $row->id,
                'name' => $label === '' ? $row->name : "{$row->name} ({$label})",
                'category' => $row->category,
                'stock_quantity' => $row->stock_quantity,
            ];
        });

        $recentOrders = Order::orderByDesc('created_at')
            ->limit(6)
            ->get(['id', 'customer_name', 'total_cents', 'status', 'tracking_stage', 'created_at']);

        $topSellers = DB::select(
            'SELECT p.id, p.name, SUM(oi.quantity)::int AS sold
             FROM order_items oi JOIN products p ON p.id = oi.product_id
             GROUP BY p.id, p.name ORDER BY sold DESC LIMIT 5'
        );

        $count = fn (string $table, string $where) => (int) DB::table($table)->whereRaw($where)->count();

        return [
            'orders' => [
                'not_started' => (int) ($byStatus['not_started'] ?? 0),
                'in_progress' => (int) ($byStatus['in_progress'] ?? 0),
                'done' => (int) ($byStatus['done'] ?? 0),
                'last_30' => (int) $revenue->orders_30,
            ],
            'revenue_cents' => [
                'all_time' => (int) $revenue->all_time,
                'last_30' => (int) $revenue->last_30,
            ],
            'products' => [
                'total' => (int) $products->total,
                'visible' => (int) $products->visible,
                'sold_out' => (int) $products->sold_out,
            ],
            'low_stock' => $lowStock,
            'pending' => [
                // New requests to quote, and approved quotes waiting to be started.
                'custom_orders' => $count('custom_order_requests', "status IN ('new', 'approved')"),
                'messages' => $count('contact_messages', 'is_read = false'),
            ],
            'recent_orders' => $recentOrders,
            'top_sellers' => $topSellers,
        ];
    }
}
