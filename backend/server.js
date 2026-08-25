import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import "dotenv/config";
import path from "path";
import productsRouter from "./routes/products.js";
import ordersRouter from "./routes/orders.js";
import categoriesRouter from "./routes/categories.js";
import authRouter from "./routes/auth.js";
import customOrdersRouter from "./routes/customOrders.js";
import contactRouter from "./routes/contact.js";

const app = express();

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
if (!process.env.FRONTEND_URL) {
  console.warn(
    "FRONTEND_URL is not set - falling back to http://localhost:5173. Set it explicitly in production."
  );
}

app.use(helmet());
app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/auth", authRouter);
app.use("/api/custom-orders", customOrdersRouter);
app.use("/api/contact", contactRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
