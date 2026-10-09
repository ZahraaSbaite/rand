import jwt from "jsonwebtoken";

// Marks req.isAdmin when a valid admin session cookie is present, without
// blocking public requests. Lets public routes return extra data to admins.
export function optionalAdmin(req, res, next) {
    req.isAdmin = false;
    const token = req.cookies?.admin_token;
    if (token && process.env.JWT_SECRET) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            req.isAdmin = true;
        } catch {
            // ignore: treated as a public request
        }
    }
    next();
}
