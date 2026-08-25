import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

const TRACKING_STAGES = [
  "received",
  "preparing",
  "crocheting",
  "quality_check",
  "ready",
  "shipped",
  "delivered",
];

// GET /api/orders - list all orders with their line items
// ADMIN ONLY
router.get("/", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*,
        COALESCE(
          json_agg(
            json_build_object(
              'product_id', oi.product_id,
              'product_name', p.name,
              'quantity', oi.quantity,
              'price_cents', oi.price_cents
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch orders",
    });
  }
});

// GET /api/orders/track?order_id=&email= - public order lookup for the tracking page
// PUBLIC, but requires the order id + matching email so customers can't browse others' orders
router.get("/track", async (req, res) => {
  const { order_id, email } = req.query;
  const orderId = Number(order_id);

  if (!Number.isInteger(orderId) || !email?.trim()) {
    return res.status(400).json({
      error: "order_id and email are required",
    });
  }

  try {
    const result = await pool.query(
      `
      SELECT o.id, o.customer_name, o.status, o.tracking_stage, o.total_cents, o.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'product_id', oi.product_id,
              'product_name', p.name,
              'quantity', oi.quantity,
              'price_cents', oi.price_cents
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.id = $1 AND lower(o.customer_email) = lower($2)
      GROUP BY o.id
      `,
      [orderId, email.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "No order found with that ID and email",
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to look up order",
    });
  }
});

// PATCH /api/orders/:id/status - update order status (admin kanban)
// ADMIN ONLY
router.patch("/:id/status", requireAdmin, async (req, res) => {
  const { status } = req.body;
  const allowed = ["not_started", "in_progress", "done"];

  if (!allowed.includes(status)) {
    return res.status(400).json({
      error: "Invalid status",
    });
  }

  try {
    const result = await pool.query(
      "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to update order status",
    });
  }
});

// PATCH /api/orders/:id/tracking - update the customer-facing fulfillment stage
// ADMIN ONLY
router.patch("/:id/tracking", requireAdmin, async (req, res) => {
  const { tracking_stage } = req.body;

  if (!TRACKING_STAGES.includes(tracking_stage)) {
    return res.status(400).json({
      error: "Invalid tracking_stage",
    });
  }

  try {
    const result = await pool.query(
      "UPDATE orders SET tracking_stage = $1 WHERE id = $2 RETURNING *",
      [tracking_stage, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to update tracking stage",
    });
  }
});

// POST /api/orders - create a COD order with its line items
// PUBLIC - customers need this for checkout
router.post("/", async (req, res) => {
  const {
    customer_name,
    customer_email,
    customer_phone,
    customer_address,
    items,
  } = req.body;

  if (
    !customer_name?.trim() ||
    !customer_phone?.trim() ||
    !customer_address?.trim() ||
    !customer_email?.trim()
  ) {
    return res.status(400).json({
      error: "Name, email, phone, and address are required",
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: "Cart is empty",
    });
  }

  for (const item of items) {
    const quantity = Number(item?.quantity);
    if (
      !Number.isInteger(item?.product_id) ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        error: "Each item needs a valid product_id and a positive integer quantity",
      });
    }
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const productIds = items.map((item) => item.product_id);
    const productsResult = await client.query(
      "SELECT id, price_cents, stock_quantity, name FROM products WHERE id = ANY($1::int[]) FOR UPDATE",
      [productIds]
    );

    const productById = new Map(productsResult.rows.map((p) => [p.id, p]));

    for (const item of items) {
      const product = productById.get(item.product_id);

      if (!product) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: `Product ${item.product_id} does not exist`,
        });
      }

      if (product.stock_quantity < item.quantity) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          error: `Not enough stock for "${product.name}" — only ${product.stock_quantity} left`,
        });
      }
    }

    const totalCents = items.reduce(
      (sum, item) => sum + productById.get(item.product_id).price_cents * item.quantity,
      0
    );

    const orderResult = await client.query(
      `INSERT INTO orders
        (customer_name, customer_email, customer_phone, customer_address, status, tracking_stage, total_cents)
       VALUES ($1, $2, $3, $4, 'not_started', 'received', $5)
       RETURNING *`,
      [customer_name, customer_email, customer_phone, customer_address, totalCents]
    );

    const order = orderResult.rows[0];

    for (const item of items) {
      const product = productById.get(item.product_id);

      await client.query(
        `INSERT INTO order_items
          (order_id, product_id, quantity, price_cents)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.product_id, item.quantity, product.price_cents]
      );

      await client.query(
        "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
        [item.quantity, item.product_id]
      );
    }

    await client.query("COMMIT");

    res.status(201).json(order);
  } catch (err) {
    await client.query("ROLLBACK");

    console.error(err);

    res.status(500).json({
      error: "Failed to create order",
    });
  } finally {
    client.release();
  }
});

export default router;
