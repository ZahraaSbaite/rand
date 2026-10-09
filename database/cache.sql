-- Laravel's database cache store, used for login rate limiting.
CREATE TABLE IF NOT EXISTS cache (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  expiration INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS cache_expiration_index ON cache (expiration);

CREATE TABLE IF NOT EXISTS cache_locks (
  key VARCHAR(255) PRIMARY KEY,
  owner VARCHAR(255) NOT NULL,
  expiration INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS cache_locks_expiration_index ON cache_locks (expiration);
