import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { pool } from "../db/pool.js";
import { requireCustomer } from "../middleware/requireCustomer.js";

const router = Router();

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many attempts. Try again later." },
});

const isProduction = process.env.NODE_ENV === "production";
const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    // Frontend and backend live on different domains in production, so the
    // cookie must be SameSite=None (requires Secure) to be sent cross-site.
    sameSite: isProduction ? "none" : "lax",
    maxAge: SESSION_MAX_AGE_MS,
    path: "/",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function issueSession(res, customer) {
    const token = jwt.sign(
        { role: "customer", customerId: customer.id },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
    );
    res.cookie("customer_token", token, cookieOptions);
}

// POST /api/customers/register
// PUBLIC
router.post("/register", authLimiter, async (req, res) => {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
        return res.status(400).json({ error: "Name, email, and password are required" });
    }
    if (!EMAIL_RE.test(email.trim())) {
        return res.status(400).json({ error: "Enter a valid email address" });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not configured");
        return res.status(500).json({ error: "Server is not configured for accounts" });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 12);
        const result = await pool.query(
            `INSERT INTO customers (name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, name, email`,
            [name.trim(), email.trim().toLowerCase(), passwordHash]
        );

        const customer = result.rows[0];
        issueSession(res, customer);
        res.status(201).json(customer);
    } catch (err) {
        if (err.code === "23505") {
            return res.status(409).json({ error: "An account with that email already exists" });
        }
        console.error(err);
        res.status(500).json({ error: "Failed to create account" });
    }
});

// POST /api/customers/login
// PUBLIC
router.post("/login", authLimiter, async (req, res) => {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }
    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not configured");
        return res.status(500).json({ error: "Server is not configured for accounts" });
    }

    try {
        const result = await pool.query(
            "SELECT id, name, email, password_hash FROM customers WHERE email = $1",
            [email.trim().toLowerCase()]
        );
        const customer = result.rows[0];

        if (!customer) {
            return res.status(401).json({ error: "Incorrect email or password" });
        }

        const match = await bcrypt.compare(password, customer.password_hash);
        if (!match) {
            return res.status(401).json({ error: "Incorrect email or password" });
        }

        issueSession(res, customer);
        res.json({ id: customer.id, name: customer.name, email: customer.email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Login failed" });
    }
});

// POST /api/customers/logout
router.post("/logout", (req, res) => {
    res.clearCookie("customer_token", { ...cookieOptions, maxAge: undefined });
    res.json({ ok: true });
});

// GET /api/customers/me
router.get("/me", requireCustomer, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, email FROM customers WHERE id = $1",
            [req.customerId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch account" });
    }
});

export default router;
