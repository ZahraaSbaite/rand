import jwt from "jsonwebtoken";

export function requireCustomer(req, res, next) {
    const token = req.cookies?.customer_token;

    if (!token) {
        return res.status(401).json({ error: "Not authenticated" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "customer") {
            return res.status(401).json({ error: "Invalid or expired session" });
        }
        req.customerId = decoded.customerId;
        next();
    } catch {
        return res.status(401).json({ error: "Invalid or expired session" });
    }
}
