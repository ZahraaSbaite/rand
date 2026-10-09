import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

// GET /api/settings - all site settings as { key: value }
// PUBLIC
router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT key, value FROM site_settings");
        res.json(Object.fromEntries(result.rows.map((r) => [r.key, r.value])));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch settings" });
    }
});

// PUT /api/settings - upsert any number of { key: value } pairs
// ADMIN ONLY
router.put("/", requireAdmin, async (req, res) => {
    const entries = Object.entries(req.body || {}).filter(
        ([key, value]) => /^[a-z0-9_]{1,64}$/.test(key) && typeof value === "string"
    );

    if (entries.length === 0) {
        return res.status(400).json({ error: "No valid settings provided" });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        for (const [key, value] of entries) {
            await client.query(
                `INSERT INTO site_settings (key, value) VALUES ($1, $2)
                 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
                [key, value]
            );
        }
        await client.query("COMMIT");

        const result = await pool.query("SELECT key, value FROM site_settings");
        res.json(Object.fromEntries(result.rows.map((r) => [r.key, r.value])));
    } catch (err) {
        await client.query("ROLLBACK");
        console.error(err);
        res.status(500).json({ error: "Failed to save settings" });
    } finally {
        client.release();
    }
});

export default router;
