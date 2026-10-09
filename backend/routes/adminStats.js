import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

const LOW_STOCK = 2;

// GET /api/admin/stats - numbers for the dashboard overview
// ADMIN ONLY
router.get("/stats", requireAdmin, async (req, res) => {
    try {
        const [orders, revenue, products, lowStock, custom, messages, reviews, recent, topSellers] =
            await Promise.all([
                pool.query(
                    `SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status`
                ),
                pool.query(
                    `SELECT
                       COALESCE(SUM(total_cents), 0)::bigint AS all_time,
                       COALESCE(SUM(total_cents) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'), 0)::bigint AS last_30,
                       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS orders_30
                     FROM orders`
                ),
                pool.query(
                    `SELECT COUNT(*)::int AS total,
                            COUNT(*) FILTER (WHERE is_visible)::int AS visible,
                            COUNT(*) FILTER (WHERE stock_quantity <= 0)::int AS sold_out
                     FROM products`
                ),
                pool.query(
                    `SELECT id, name, stock_quantity, category FROM products
                     WHERE stock_quantity <= $1 ORDER BY stock_quantity ASC, name ASC LIMIT 8`,
                    [LOW_STOCK]
                ),
                pool.query(
                    `SELECT COUNT(*)::int AS count FROM custom_order_requests WHERE status = 'new'`
                ),
                pool.query(
                    `SELECT COUNT(*)::int AS count FROM contact_messages WHERE is_read = false`
                ),
                pool.query(`SELECT COUNT(*)::int AS count FROM reviews WHERE approved = false`),
                pool.query(
                    `SELECT id, customer_name, total_cents, status, tracking_stage, created_at
                     FROM orders ORDER BY created_at DESC LIMIT 6`
                ),
                pool.query(
                    `SELECT p.id, p.name, SUM(oi.quantity)::int AS sold
                     FROM order_items oi JOIN products p ON p.id = oi.product_id
                     GROUP BY p.id, p.name ORDER BY sold DESC LIMIT 5`
                ),
            ]);

        const byStatus = Object.fromEntries(orders.rows.map((r) => [r.status, r.count]));

        res.json({
            orders: {
                not_started: byStatus.not_started || 0,
                in_progress: byStatus.in_progress || 0,
                done: byStatus.done || 0,
                last_30: revenue.rows[0].orders_30,
            },
            revenue_cents: {
                all_time: Number(revenue.rows[0].all_time),
                last_30: Number(revenue.rows[0].last_30),
            },
            products: products.rows[0],
            low_stock: lowStock.rows,
            pending: {
                custom_orders: custom.rows[0].count,
                messages: messages.rows[0].count,
                reviews: reviews.rows[0].count,
            },
            recent_orders: recent.rows,
            top_sellers: topSellers.rows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load stats" });
    }
});

export default router;
