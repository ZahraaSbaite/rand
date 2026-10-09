import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

// GET /api/categories
// PUBLIC
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM categories ORDER BY sort_order ASC, name ASC"
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
});

// POST /api/categories
// ADMIN ONLY
router.post("/", requireAdmin, async (req, res) => {
    const { name, sort_order, description } = req.body;

    if (!name?.trim()) {
        return res.status(400).json({
            error: "Category name is required",
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO categories (name, sort_order, description)
             VALUES ($1, COALESCE($2, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories)), $3)
             RETURNING *`,
            [name.trim(), sort_order ?? null, description ?? null]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === "23505") {
            return res.status(409).json({
                error: "That category already exists",
            });
        }

        console.error(err);
        res.status(500).json({
            error: "Failed to create category",
        });
    }
});

// PUT /api/categories/:id
// ADMIN ONLY
router.put("/:id", requireAdmin, async (req, res) => {
    const { name, sort_order, description } = req.body;

    if (!name?.trim()) {
        return res.status(400).json({
            error: "Category name is required",
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const oldResult = await client.query(
            "SELECT name FROM categories WHERE id = $1",
            [req.params.id]
        );

        if (oldResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                error: "Category not found",
            });
        }

        const oldName = oldResult.rows[0].name;

        const updated = await client.query(
            `UPDATE categories SET
               name = $1,
               sort_order = COALESCE($2, sort_order),
               description = COALESCE($3, description)
             WHERE id = $4 RETURNING *`,
            [name.trim(), sort_order ?? null, description ?? null, req.params.id]
        );

        // Keep existing products' category text in sync with the rename
        await client.query(
            "UPDATE products SET category = $1 WHERE category = $2",
            [name.trim(), oldName]
        );

        await client.query("COMMIT");

        res.json(updated.rows[0]);
    } catch (err) {
        await client.query("ROLLBACK");

        if (err.code === "23505") {
            return res.status(409).json({
                error: "That category already exists",
            });
        }

        console.error(err);
        res.status(500).json({
            error: "Failed to update category",
        });
    } finally {
        client.release();
    }
});

// DELETE /api/categories/:id
// ADMIN ONLY
router.delete("/:id", requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            "DELETE FROM categories WHERE id = $1 RETURNING *",
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Category not found",
            });
        }

        res.json({
            message: "Category deleted",
            category: result.rows[0],
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Failed to delete category",
        });
    }
});

export default router;
