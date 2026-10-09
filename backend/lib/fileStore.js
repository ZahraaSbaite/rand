import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getStore } from "@netlify/blobs";

// Uploaded images live in Netlify Blobs in production and in backend/uploads
// locally. Either way they're served at /uploads/<name>.
const uploadsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "uploads");

const useBlobs = () => process.env.UPLOAD_STORAGE === "blobs";
// Strong consistency makes a fresh upload readable right away, but it needs
// an environment setting Netlify doesn't always provide; fall back if so.
async function withBlobs(fn) {
  try {
    return await fn(getStore({ name: "uploads", consistency: "strong" }));
  } catch (err) {
    if (err?.name !== "BlobsConsistencyError") throw err;
    return fn(getStore("uploads"));
  }
}

const NAME_PATTERN = /^[A-Za-z0-9._-]+$/;

/** Stores a multer memory-storage file and returns its public URL. */
export async function saveUpload(file) {
  const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, "").slice(0, 10);
  const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  if (useBlobs()) {
    await withBlobs((store) => store.set(name, file.buffer, { metadata: { contentType: file.mimetype } }));
  } else {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(path.join(uploadsDir, name), file.buffer);
  }
  return `/uploads/${name}`;
}

/** Express handler for GET /uploads/:name */
export async function serveUpload(req, res, next) {
  const { name } = req.params;
  if (!NAME_PATTERN.test(name)) return res.sendStatus(404);

  try {
    if (!useBlobs()) {
      return res.sendFile(path.join(uploadsDir, name), (err) => {
        if (err) res.sendStatus(404);
      });
    }
    const entry = await withBlobs((store) => store.getWithMetadata(name, { type: "arrayBuffer" }));
    if (!entry) return res.sendStatus(404);
    res.set("Content-Type", entry.metadata?.contentType || "application/octet-stream");
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    res.send(Buffer.from(entry.data));
  } catch (err) {
    next(err);
  }
}
