import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./pool.js";

// When bundled into a Netlify function this module no longer sits next to
// schema.sql (it's shipped via included_files), so search upward for it.
async function readSchema() {
  const starts = [path.dirname(fileURLToPath(import.meta.url)), process.cwd()];
  for (const start of starts) {
    for (let dir = start; ; dir = path.dirname(dir)) {
      for (const candidate of ["schema.sql", "db/schema.sql", "backend/db/schema.sql"]) {
        try {
          return await fs.readFile(path.join(dir, candidate), "utf8");
        } catch {}
      }
      if (path.dirname(dir) === dir) break;
    }
  }
  throw new Error("schema.sql not found");
}

let ready = null;

// Runs schema.sql once if the database has no tables yet, so a fresh
// database works without a manual setup step. An existing database is left
// alone, so seed rows the admin deleted don't come back.
export function ensureSchema() {
  if (!ready) {
    ready = (async () => {
      const { rows } = await pool.query("SELECT to_regclass('public.site_settings') AS t");
      if (rows[0].t) return;
      await pool.query(await readSchema());
      console.log("Database schema created");
    })().catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
}
