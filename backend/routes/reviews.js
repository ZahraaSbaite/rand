import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

async function recomputeProductRating(client, productId) {
  await client.query(
    `UPDATE products SET
      review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1 AND approved = true),
      rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE product_id = $1 AND approved = true), 0)
     WHERE id = $1`,
    [productId]
  );
}

// GET /api/reviews?product_id= - list approved reviews, newest first
// PUBLIC
router.get("/", async (req, res) => {
  try {
    const { product_id } = req.query;
    const conditions = ["r.approved = true"];
    const values = [];

    if (product_id !== undefined) {
      values.push(Number(product_id));
      conditions.push(`r.product_id = $${values.length}`);
    }

    const result = await pool.query(
      `SELECT r.id, r.product_id, r.customer_name, r.rating, r.comment, r.created_at,
              p.name AS product_name
       FROM reviews r
       LEFT JOIN products p ON p.id = r.product_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY r.created_at DESC`,
      values
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// GET /api/reviews/admin - list every review, pending and approved
// ADMIN ONLY
router.get("/admin", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.product_id, r.customer_name, r.customer_email, r.rating, r.comment,
              r.approved, r.created_at, p.name AS product_name
       FROM reviews r
       LEFT JOIN products p ON p.id = r.product_id
       ORDER BY r.approved ASC, r.created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// POST /api/reviews - submit a review, held for approval
// PUBLIC
router.post("/", async (req, res) => {
  const { product_id, customer_name, customer_email, rating, comment } = req.body;

  const ratingNum = Number(rating);

  if (!customer_name?.trim() || !customer_email?.trim() || !comment?.trim()) {
    return res.status(400).json({
      error: "Name, email, and a comment are required",
    });
  }

  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({
      error: "Rating must be a whole number between 1 and 5",
    });
  }

  const productId = product_id !== undefined && product_id !== null && product_id !== ""
    ? Number(product_id)
    : null;

  if (productId !== null && !Number.isInteger(productId)) {
    return res.status(400).json({ error: "Invalid product_id" });
  }

  try {
    if (productId !== null) {
      const productCheck = await pool.query("SELECT id FROM products WHERE id = $1", [productId]);
      if (productCheck.rows.length === 0) {
        return res.status(400).json({ error: "Product not found" });
      }
    }

    const result = await pool.query(
      `INSERT INTO reviews (product_id, customer_name, customer_email, rating, comment, approved)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING *`,
      [productId, customer_name.trim(), customer_email.trim(), ratingNum, comment.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// PATCH /api/reviews/:id/approve - publish a pending review
// ADMIN ONLY
router.patch("/:id/approve", requireAdmin, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      "UPDATE reviews SET approved = true WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Review not found" });
    }

    const productId = result.rows[0].product_id;
    if (productId !== null) {
      await recomputeProductRating(client, productId);
    }

    await client.query("COMMIT");

    res.json(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to approve review" });
  } finally {
    client.release();
  }
});

// DELETE /api/reviews/:id - remove a review
// ADMIN ONLY
router.delete("/:id", requireAdmin, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      "DELETE FROM reviews WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Review not found" });
    }

    const productId = result.rows[0].product_id;

    if (productId !== null) {
      await recomputeProductRating(client, productId);
    }

    await client.query("COMMIT");

    res.json({ message: "Review deleted" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to delete review" });
  } finally {
    client.release();
  }
});

export default router;
