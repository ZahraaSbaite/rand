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
import reviewsRouter from "./routes/reviews.js";
import customersRouter from "./routes/customers.js";
import wishlistRouter from "./routes/wishlist.js";
import uploadRouter from "./routes/upload.js";
import { createSimpleContentRouter } from "./routes/simpleContent.js";

const journalRouter = createSimpleContentRouter({
  table: "journal_entries",
  columns: [
    { name: "tag", required: true },
    { name: "entry_date", required: true },
    { name: "title", required: true },
    { name: "story", required: true },
    { name: "image_url", required: false, default: null },
    { name: "sort_order", required: false, default: 0 },
  ],
});

const storyBlocksRouter = createSimpleContentRouter({
  table: "story_blocks",
  columns: [
    { name: "heading", required: true },
    { name: "body", required: true },
    { name: "image_url", required: false, default: null },
    { name: "sort_order", required: false, default: 0 },
  ],
});

const processStepsRouter = createSimpleContentRouter({
  table: "process_steps",
  columns: [
    { name: "title", required: true },
    { name: "description", required: true },
    { name: "sort_order", required: false, default: 0 },
  ],
});

const faqsRouter = createSimpleContentRouter({
  table: "faqs",
  columns: [
    { name: "category", required: true },
    { name: "question", required: true },
    { name: "answer", required: true },
    { name: "sort_order", required: false, default: 0 },
  ],
});

const collectionsRouter = createSimpleContentRouter({
  table: "collections",
  columns: [
    { name: "name", required: true },
    { name: "slug", required: true },
    { name: "tagline", required: false, default: null },
    { name: "image_url", required: false, default: null },
    { name: "sort_order", required: false, default: 0 },
  ],
});

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

const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
app.use(
  "/uploads",
  (req, res, next) => {
    // helmet's default same-origin CORP header blocks the frontend (a different port)
    // from rendering these images, so relax it for this static route only.
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(uploadsDir)
);

app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/auth", authRouter);
app.use("/api/custom-orders", customOrdersRouter);
app.use("/api/contact", contactRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/journal", journalRouter);
app.use("/api/story-blocks", storyBlocksRouter);
app.use("/api/process-steps", processStepsRouter);
app.use("/api/faqs", faqsRouter);
app.use("/api/collections", collectionsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
