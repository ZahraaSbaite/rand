import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

const SORTS = {
  newest: "created_at DESC",
  price_asc: "price_cents ASC",
  price_desc: "price_cents DESC",
  featured: "featured DESC, rating DESC",
  bestselling: "bestseller DESC, review_count DESC",
};

// GET /api/products - list products with optional filtering/sorting
// PUBLIC
// Query params: category, minPrice, maxPrice, inStock, featured, bestseller, sort
router.get("/", async (req, res) => {
  try {
    const { category, minPrice, maxPrice, inStock, featured, bestseller, sort } = req.query;

    const conditions = [];
    const values = [];

    if (category) {
      values.push(category);
      conditions.push(`category = $${values.length}`);
    }

    if (minPrice !== undefined) {
      values.push(Number(minPrice));
      conditions.push(`price_cents >= $${values.length}`);
    }

    if (maxPrice !== undefined) {
      values.push(Number(maxPrice));
      conditions.push(`price_cents <= $${values.length}`);
    }

    if (inStock === "true") {
      conditions.push("stock_quantity > 0");
    }

    if (featured === "true") {
      conditions.push("featured = true");
    }

    if (bestseller === "true") {
      conditions.push("bestseller = true");
    }

    // Hidden products are only listed for a signed-in admin asking for them.
    if (!(req.isAdmin && req.query.all === "true")) {
      conditions.push("is_visible = true");
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderBy = SORTS[sort] || SORTS.newest;

    const result = await pool.query(
      `SELECT * FROM products ${where} ORDER BY ${orderBy}`,
      values
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET /api/products/:id - single product
// PUBLIC
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM products WHERE id = $1 ${req.isAdmin ? "" : "AND is_visible = true"}`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// POST /api/products - create a product
// ADMIN ONLY
router.post("/", requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      price_cents,
      image_url,
      images,
      yarn_color,
      colors,
      category,
      stock_quantity,
      materials,
      dimensions,
      care_instructions,
      production_time,
      featured,
      bestseller,
      is_visible,
    } = req.body;

    if (!name || price_cents === undefined) {
      return res.status(400).json({
        error: "name and price_cents are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO products
        (name, description, price_cents, image_url, images, yarn_color, colors, category,
         stock_quantity, materials, dimensions, care_instructions, production_time, featured, bestseller, is_visible)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        name,
        description ?? null,
        price_cents,
        image_url ?? null,
        images ?? [],
        yarn_color ?? null,
        colors ?? [],
        category ?? null,
        stock_quantity ?? 0,
        materials ?? null,
        dimensions ?? null,
        care_instructions ?? null,
        production_time ?? null,
        featured ?? false,
        bestseller ?? false,
        is_visible ?? true,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "A product with that name already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// PUT /api/products/:id - edit a product
// ADMIN ONLY
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      price_cents,
      image_url,
      images,
      yarn_color,
      colors,
      category,
      stock_quantity,
      materials,
      dimensions,
      care_instructions,
      production_time,
      featured,
      bestseller,
      is_visible,
    } = req.body;

    const result = await pool.query(
      `UPDATE products SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price_cents = COALESCE($3, price_cents),
        image_url = COALESCE($4, image_url),
        images = COALESCE($5, images),
        yarn_color = COALESCE($6, yarn_color),
        colors = COALESCE($7, colors),
        category = COALESCE($8, category),
        stock_quantity = COALESCE($9, stock_quantity),
        materials = COALESCE($10, materials),
        dimensions = COALESCE($11, dimensions),
        care_instructions = COALESCE($12, care_instructions),
        production_time = COALESCE($13, production_time),
        featured = COALESCE($14, featured),
        bestseller = COALESCE($15, bestseller),
        is_visible = COALESCE($16, is_visible)
       WHERE id = $17
       RETURNING *`,
      [
        name,
        description,
        price_cents,
        image_url,
        images,
        yarn_color,
        colors,
        category,
        stock_quantity,
        materials,
        dimensions,
        care_instructions,
        production_time,
        featured,
        bestseller,
        is_visible,
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "A product with that name already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// DELETE /api/products/:id - remove a product
// ADMIN ONLY
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({
      message: "Product deleted",
      product: result.rows[0],
    });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(409).json({
        error: "This product is part of past orders, so it can't be deleted. Hide it instead.",
      });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
