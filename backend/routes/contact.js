import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

// POST /api/contact - submit a contact message
// PUBLIC
router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({
      error: "Name, email, and message are required",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO contact_messages (name, email, subject, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, email, subject || null, message]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit message" });
  }
});

// GET /api/contact - list submitted messages
// ADMIN ONLY
router.get("/", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM contact_messages ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

export default router;
