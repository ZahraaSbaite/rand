import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import "dotenv/config";
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
import { ensureSchema } from './db/ensureSchema.js';
import { serveUpload } from './lib/fileStore.js';

const app = express();
// Netlify and other hosts sit behind a proxy; trust it so rate limiting sees real client IPs.
app.set("trust proxy", 1);

// On Netlify, /api/* is rewritten to the function; drop the function prefix
// if it shows up so the routes below match either way.
app.use((req, res, next) => {
  req.url = req.url.replace(/^\/\.netlify\/functions\/api(?=\/|\?|$)/, "") || "/";
  next();
});

// Netlify sets URL to the site's address; same-origin requests don't need CORS anyway.
const frontendUrl = process.env.FRONTEND_URL || process.env.URL || "http://localhost:5173";

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(optionalAdmin);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.get("/uploads/:name", serveUpload);

// Creates the tables on first use of an empty database.
app.use("/api", (req, res, next) => {
  ensureSchema().then(() => next(), next);
});

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

export default app;
