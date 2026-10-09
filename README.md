# strand

A handmade crochet shop: React (frontend) + Laravel (API) + PostgreSQL, deployed on Vercel.

## Folder structure

```
crochet-main/
├── api/index.php            # Vercel function entry point; hands requests to Laravel
├── app/
│   ├── Http/Controllers/    # One controller per resource (products, orders, reviews, ...)
│   ├── Http/Middleware/     # RequireAdmin, EnsureSchema, SecurityHeaders
│   ├── Models/              # Eloquent models, one per table
│   ├── Casts/PgTextArray.php
│   └── Support/             # AdminSession (JWT cookie), FileStore (image uploads)
├── bootstrap/app.php        # Middleware and JSON error handling
├── config/                  # database.php, cors.php, shop.php (admin + upload settings)
├── database/
│   ├── schema.sql           # Tables + sample content, created automatically
│   └── cache.sql            # Cache table used by login rate limiting
├── routes/
│   ├── api.php              # Every /api/* endpoint
│   └── web.php              # /uploads/* (local images) and /health
├── frontend/                # React app (Vite)
└── vercel.json              # Build, PHP runtime and rewrites
```

## Running locally

You need PHP 8.3+ with the `pdo_pgsql` extension enabled, Composer, Node 20+ and PostgreSQL.
(On WAMP, enable `pdo_pgsql` in the PHP extensions menu or uncomment `extension=pdo_pgsql` in `php.ini`.)

### 1. API

```bash
composer install
cp .env.example .env
php artisan key:generate
```

Then fill in `.env`:

- `DB_URL` — your local Postgres database, e.g. `postgresql://postgres:password@127.0.0.1:5432/crochet_shop`
- `ADMIN_PASSWORD_HASH` — `php -r "echo password_hash('your_admin_password', PASSWORD_BCRYPT), PHP_EOL;"`
- `JWT_SECRET` — `php -r "echo bin2hex(random_bytes(48)), PHP_EOL;"` (at least 32 characters)

The tables and sample content are created on the first API request against an empty database.

```bash
composer dev   # http://localhost:4000
```

### 2. Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173 — /api and /uploads are proxied to :4000
```

## Deploying to Vercel

The whole site is one Vercel project: the React build is served as static files and every
`/api/*` request runs Laravel through the community PHP runtime ([vercel-php](https://github.com/vercel-community/php)).

1. Import the repository in Vercel. Leave the framework preset as **Other** and the root
   directory as the repo root; `vercel.json` sets the build.
2. **Storage → Neon Postgres**: create (or connect) a database for the project. This sets `DATABASE_URL`.
3. **Storage → Blob**: create a store for the project. This sets `BLOB_READ_WRITE_TOKEN`;
   uploaded images are saved there.
4. **Settings → Environment Variables**: add
   - `APP_KEY` — output of `php artisan key:generate --show`
   - `ADMIN_PASSWORD_HASH`
   - `JWT_SECRET`
5. Deploy. The first API request creates the tables.

Production defaults (UTC, logs to stderr, caches in `/tmp`, database cache store) are set in
`api/index.php`; anything set in Vercel's environment variables overrides them.

## Features

- Product catalog with category filtering, sorting, live search and pagination
- Product pages with colorways, reviews (moderated) and "shop similar" suggestions
- Cart and wishlist (persisted in localStorage) with cash-on-delivery checkout
- Order tracking by order number + email
- Custom order requests (with an inspiration photo) and a contact form
- Admin panel (`/admin`, password-protected):
  - Dashboard with revenue, low stock, pending items and top sellers
  - Products (with image uploads, hide/show), categories, orders (kanban + tracking stage)
  - Reviews, custom requests and messages inboxes
  - Site content: collections, FAQs, lookbook, process steps, story, site text and links

## Admin access

Visit `/admin/login` and enter the password you hashed into `ADMIN_PASSWORD_HASH`. Sessions last
12 hours. Login is limited to 10 attempts per 15 minutes per IP.

## Known limitations / next steps

- Single shared admin password, not per-user accounts
- No order confirmation emails
