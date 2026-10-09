# strand

A handmade crochet shop: React (frontend) + Node/Express (backend) + PostgreSQL (database).

## Folder structure

crochet-shop/
├── backend/
│ ├── server.js # Express app entry point
│ ├── routes/
│ │ ├── products.js # GET/POST/PUT/DELETE /api/products
│ │ ├── categories.js # GET/POST/PUT/DELETE /api/categories
│ │ ├── orders.js # POST /api/orders (checkout), GET /api/orders, PATCH /api/orders/:id/status
│ │ └── auth.js # POST /api/auth/login (admin)
│ ├── middleware/
│ │ └── requireAdmin.js # JWT check for admin-only routes
│ ├── db/
│ │ ├── pool.js # PostgreSQL connection
│ │ └── schema.sql # Table definitions + sample data
│ ├── package.json
│ └── .env # Not committed — see setup below
│
└── frontend/
├── src/
│ ├── main.jsx
│ ├── App.jsx # Routes
│ ├── context/
│ │ └── CartContext.jsx # Cart state, persisted to localStorage
│ ├── components/
│ │ ├── Navbar.jsx # Search, nav icons
│ │ ├── Footer.jsx
│ │ ├── CategoryStrip.jsx # Scrollable category circles
│ │ ├── ProductCard.jsx
│ │ ├── ProductList.jsx
│ │ ├── Pagination.jsx
│ │ ├── ProtectedRoute.jsx # Guards /admin
│ │ ├── AdminProducts.jsx # Add/edit/delete products, search
│ │ ├── AdminCategories.jsx # Add/edit/delete categories
│ │ └── AdminOrders.jsx # Kanban board: not started / in progress / done
│ └── pages/
│ ├── Home.jsx # Hero, category strip, product grid
│ ├── ProductPage.jsx # Single product + similar items
│ ├── Cart.jsx # Cart + cash-on-delivery checkout
│ ├── Admin.jsx # Tabs: Products / Orders
│ └── AdminLogin.jsx
├── index.html
├── vite.config.js
└── package.json


## Getting started

### 1. Database

Create a PostgreSQL database, then run the schema:

```bash
psql -U postgres -d crochet_shop -f backend/db/schema.sql
```

### 2. Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` (not committed to git) with:

PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/crochet_shop
FRONTEND_URL=http://localhost:5173
JWT_SECRET=any_long_random_string
ADMIN_PASSWORD_HASH=generate_with_bcrypt_see_below


To generate `ADMIN_PASSWORD_HASH`:

```bash
node -e "const bcrypt=require('bcrypt'); bcrypt.hash('your_admin_password', 10).then(console.log)"
```

Then start the server:

```bash
npm run dev   # http://localhost:4000
```

### 3. Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

## Features

- Product catalog with category filtering, live search, and pagination
- Product detail pages with "shop similar" suggestions
- Cart (persisted in localStorage) with cash-on-delivery checkout
- Admin panel (`/admin`, password-protected):
  - Products — add, edit, delete, search, category dropdown
  - Categories — add, edit, rename (syncs existing products), delete
  - Orders — kanban board (Not started / In progress / Done), per-column search and date filtering

## Admin access

Visit `/admin/login` and enter the password you hashed into `ADMIN_PASSWORD_HASH`. Sessions last 12 hours.

## Known limitations / next steps

- Product images are external URLs (no upload/storage pipeline yet)
- Single shared admin password, not per-user accounts
- No order confirmation emails
- Client-side search/filtering only — fine at current catalog size, would need backend-side querying at scale