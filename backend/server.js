import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from 'url';
import productsRouter from "./routes/products.js";
import ordersRouter from "./routes/orders.js";
import categoriesRouter from "./routes/categories.js";
import authRouter from "./routes/auth.js";
import customOrdersRouter from "./routes/customOrders.js";
import contactRouter from "./routes/contact.js";
import reviewsRouter from './routes/reviews.js';
import journalRouter from './routes/journal.js';
import storyBlocksRouter from './routes/storyBlocks.js';
import processStepsRouter from './routes/processSteps.js';
import faqsRouter from './routes/faqs.js';
import collectionsRouter from './routes/collections.js';
import uploadRouter from './routes/upload.js';
import settingsRouter from './routes/settings.js';
import adminStatsRouter from './routes/adminStats.js';
import { optionalAdmin } from './middleware/optionalAdmin.js';

const app = express();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
if (!process.env.FRONTEND_URL) {
  console.warn(
    "FRONTEND_URL is not set - falling back to http://localhost:5173. Set it explicitly in production."
  );
}

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(optionalAdmin);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/auth", authRouter);
app.use("/api/custom-orders", customOrdersRouter);
app.use("/api/contact", contactRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/journal', journalRouter);
app.use('/api/story-blocks', storyBlocksRouter);
app.use('/api/process-steps', processStepsRouter);
app.use('/api/faqs', faqsRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/admin', adminStatsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
