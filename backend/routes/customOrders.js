import { Router } from "express";
import multer from "multer";
import path from "path";
import { pool } from "../db/pool.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(process.cwd(), "uploads"),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).slice(0, 10);
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, /^image\//.test(file.mimetype));
  },
});

// POST /api/custom-orders - submit a custom order request
// PUBLIC
router.post("/", upload.single("inspiration_image"), async (req, res) => {
  const {
    name,
    email,
    phone,
    product_type,
    description,
    preferred_colors,
    preferred_size,
    quantity,
    deadline,
    budget_range,
    additional_notes,
  } = req.body;

  if (!name?.trim() || !email?.trim() || !description?.trim()) {
    return res.status(400).json({
      error: "Name, email, and a description of the idea are required",
    });
  }

  const inspirationImageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const result = await pool.query(
      `INSERT INTO custom_order_requests
        (name, email, phone, product_type, description, preferred_colors, preferred_size,
         quantity, deadline, budget_range, inspiration_image_url, additional_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        name,
        email,
        phone || null,
        product_type || null,
        description,
        preferred_colors || null,
        preferred_size || null,
        quantity ? Number(quantity) : 1,
        deadline || null,
        budget_range || null,
        inspirationImageUrl,
        additional_notes || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit custom order request" });
  }
});

// GET /api/custom-orders - list submissions
// ADMIN ONLY
router.get("/", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM custom_order_requests ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch custom order requests" });
  }
});

export default router;
