import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

// Builds a public GET / admin POST,PUT,DELETE router for a simple,
// flat content table (journal entries, FAQ items, story blocks, etc).
// `table` and `columns[].name` are fixed literals defined by the caller,
// never derived from request input, so building SQL from them is safe.
export function createSimpleContentRouter({ table, columns }) {
  const router = Router();
  const colNames = columns.map((c) => c.name);

  const missingRequired = (body) =>
    columns.filter((c) => c.required && !String(body[c.name] ?? "").trim());

  const valuesFromBody = (body) =>
    columns.map((c) => {
      const v = body[c.name];
      return v === undefined || v === "" ? c.default ?? null : v;
    });

  router.get("/", async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM ${table} ORDER BY sort_order ASC, id ASC`
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  router.post("/", requireAdmin, async (req, res) => {
    const missing = missingRequired(req.body);
    if (missing.length) {
      return res.status(400).json({
        error: `${missing.map((c) => c.name).join(", ")} required`,
      });
    }

    try {
      const values = valuesFromBody(req.body);
      const placeholders = colNames.map((_, i) => `$${i + 1}`).join(", ");
      const result = await pool.query(
        `INSERT INTO ${table} (${colNames.join(", ")}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create item" });
    }
  });

  router.put("/:id", requireAdmin, async (req, res) => {
    const missing = missingRequired(req.body);
    if (missing.length) {
      return res.status(400).json({
        error: `${missing.map((c) => c.name).join(", ")} required`,
      });
    }

    try {
      const values = valuesFromBody(req.body);
      const setClause = colNames.map((name, i) => `${name} = $${i + 1}`).join(", ");
      const result = await pool.query(
        `UPDATE ${table} SET ${setClause} WHERE id = $${colNames.length + 1} RETURNING *`,
        [...values, req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Not found" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  router.delete("/:id", requireAdmin, async (req, res) => {
    try {
      const result = await pool.query(
        `DELETE FROM ${table} WHERE id = $1 RETURNING *`,
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Not found" });
      }

      res.json({ message: "Deleted", item: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  return router;
}
