import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login attempts. Try again later." },
});

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_MAX_AGE_MS,
    path: "/",
};

router.post("/login", loginLimiter, async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: "Password is required" });
        }

        if (!process.env.ADMIN_PASSWORD_HASH || !process.env.JWT_SECRET) {
            console.error("ADMIN_PASSWORD_HASH or JWT_SECRET is not configured");
            return res.status(500).json({ error: "Server is not configured for login" });
        }

        const match = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
        if (!match) {
            return res.status(401).json({ error: "Incorrect password" });
        }

        const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
            expiresIn: "12h",
        });

        res.cookie("admin_token", token, cookieOptions);
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Login failed" });
    }
});

router.post("/logout", (req, res) => {
    res.clearCookie("admin_token", { ...cookieOptions, maxAge: undefined });
    res.json({ ok: true });
});

router.get("/me", requireAdmin, (req, res) => {
    res.json({ ok: true });
});

export default router;
