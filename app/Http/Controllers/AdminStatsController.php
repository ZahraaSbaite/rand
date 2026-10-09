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
        $byStatus = DB::table('orders')
            ->selectRaw('status, COUNT(*)::int AS count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $revenue = DB::selectOne(
            "SELECT
               COALESCE(SUM(total_cents), 0)::bigint AS all_time,
               COALESCE(SUM(total_cents) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'), 0)::bigint AS last_30,
               COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS orders_30
             FROM orders"
        );

        $products = DB::selectOne(
            'SELECT COUNT(*)::int AS total,
                    COUNT(*) FILTER (WHERE is_visible)::int AS visible,
                    COUNT(*) FILTER (WHERE stock_quantity <= 0)::int AS sold_out
             FROM products'
        );

        $lowStock = DB::table('products')
            ->where('stock_quantity', '<=', self::LOW_STOCK)
            ->orderBy('stock_quantity')
            ->orderBy('name')
            ->limit(8)
            ->get(['id', 'name', 'stock_quantity', 'category']);

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
                'custom_orders' => $count('custom_order_requests', "status = 'new'"),
                'messages' => $count('contact_messages', 'is_read = false'),
                'reviews' => $count('reviews', 'approved = false'),
            ],
            'recent_orders' => $recentOrders,
            'top_sellers' => $topSellers,
        ];
    }
}
