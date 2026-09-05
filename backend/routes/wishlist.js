import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireCustomer } from "../middleware/requireCustomer.js";

const router = Router();

// GET /api/wishlist - the current customer's wishlisted products
router.get("/", requireCustomer, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.* FROM wishlists w
       JOIN products p ON p.id = w.product_id
       WHERE w.customer_id = $1
       ORDER BY w.created_at DESC`,
      [req.customerId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
});

// POST /api/wishlist - add a product { product_id }
router.post("/", requireCustomer, async (req, res) => {
  const productId = Number(req.body.product_id);

  if (!Number.isInteger(productId)) {
    return res.status(400).json({ error: "product_id is required" });
  }

  try {
    await pool.query(
      `INSERT INTO wishlists (customer_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (customer_id, product_id) DO NOTHING`,
      [req.customerId, productId]
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(400).json({ error: "Product not found" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to add to wishlist" });
  }
});

// DELETE /api/wishlist/:productId
router.delete("/:productId", requireCustomer, async (req, res) => {
  const productId = Number(req.params.productId);

  if (!Number.isInteger(productId)) {
    return res.status(400).json({ error: "Invalid product id" });
  }

  try {
    await pool.query(
      "DELETE FROM wishlists WHERE customer_id = $1 AND product_id = $2",
      [req.customerId, productId]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove from wishlist" });
  }
});

export default router;
