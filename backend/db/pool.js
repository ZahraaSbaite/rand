import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

// NETLIFY_DATABASE_URL is set automatically when Netlify DB is added to the site.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL,
  // Each Netlify function instance gets its own pool; keep it small.
  max: 3,
});
