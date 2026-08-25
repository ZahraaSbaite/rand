-- Run this once against your PostgreSQL database to create the tables.

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  image_url TEXT,
  yarn_color TEXT,
  category TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Extra product detail fields (safe to re-run)
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS materials TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS dimensions TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS care_instructions TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS production_time TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS review_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS bestseller BOOLEAN NOT NULL DEFAULT false;

-- Add duplicate protection on product name (safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_product_name'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT unique_product_name UNIQUE (name);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_email TEXT,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_phone TEXT NOT NULL DEFAULT '',
  customer_address TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'not_started', -- not_started, in_progress, done
  total_cents INTEGER NOT NULL,
  stripe_payment_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Customer-facing fulfillment stage, independent of the admin kanban `status` above.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_stage TEXT NOT NULL DEFAULT 'received';
-- received, preparing, crocheting, quality_check, ready, shipped, delivered

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price_cents INTEGER NOT NULL -- price at time of purchase
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS custom_order_requests (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  product_type TEXT,
  description TEXT NOT NULL,
  preferred_colors TEXT,
  preferred_size TEXT,
  quantity INTEGER DEFAULT 1,
  deadline DATE,
  budget_range TEXT,
  inspiration_image_url TEXT,
  additional_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- A couple of sample products to get started
INSERT INTO products (
  name, description, price_cents, yarn_color, category, stock_quantity,
  colors, materials, dimensions, care_instructions, production_time,
  rating, review_count, featured, bestseller, images
)
VALUES
  ('Woven Market Tote', 'Sturdy crocheted tote bag lined with cotton canvas.', 3200, 'Terracotta', 'Bags', 10,
    ARRAY['Terracotta', 'Oatmeal', 'Sage'], '100% cotton yarn, canvas lining', '14in W x 12in H x 5in D',
    'Spot clean with a damp cloth. Do not machine wash.', '3-5 business days', 4.8, 12, true, true,
    ARRAY[
      'https://placehold.co/700x700/e8c5a8/2a2420?text=RRAND',
      'https://placehold.co/700x700/d8b090/2a2420?text=RRAND',
      'https://placehold.co/700x700/c9a17e/2a2420?text=RRAND'
    ]),
  ('Crochet Daisy Bouquet', 'Everlasting daisy bunch, hand-stitched petal by petal.', 2200, 'Ivory & Butter', 'Flowers', 15,
    ARRAY['Ivory & Butter', 'Blush & Sage'], '100% acrylic yarn, wire stems', '12in tall bouquet of 5 stems',
    'Dust with a dry cloth. Keep away from direct heat.', '2-4 business days', 4.9, 20, true, false, '{}'),
  ('Amigurumi Fox', 'Small crocheted fox plushie, great gift.', 1800, 'Rust Orange', 'Plushies', 20,
    ARRAY['Rust Orange', 'Charcoal'], '100% acrylic yarn, polyester stuffing', '6in tall x 8in long',
    'Surface wipe only. Do not submerge.', '2-3 business days', 4.9, 34, true, true,
    ARRAY[
      'https://placehold.co/700x700/e8725c/2a2420?text=RRAND',
      'https://placehold.co/700x700/d4634e/2a2420?text=RRAND'
    ]),
  ('Scalloped Scrunchie Set', 'Set of three scalloped-edge hair scrunchies.', 1400, 'Pastel Mix', 'Accessories', 25,
    ARRAY['Pastel Mix', 'Neutral Mix'], '100% cotton yarn', 'One size, fits most',
    'Hand wash cold, lay flat to dry.', '1-2 business days', 4.6, 9, false, true, '{}'),
  ('Chunky Coaster Set', 'Set of four chunky knit coasters for the home.', 1900, 'Oatmeal', 'Home', 18,
    ARRAY['Oatmeal', 'Terracotta'], '100% wool blend yarn', '4in diameter each, set of 4',
    'Spot clean as needed.', '2-4 business days', 4.7, 6, false, false, '{}'),
  ('Granny Square Blanket', 'Cozy throw blanket, classic granny square pattern — a signature RRAND piece.', 8500, 'Multicolor', 'Collections', 5,
    ARRAY['Multicolor', 'Monochrome'], '100% cotton yarn', '50in x 60in throw',
    'Hand wash cold, lay flat to dry. Do not tumble dry.', '2-3 weeks', 5.0, 15, true, true,
    ARRAY[
      'https://placehold.co/700x700/9b8fd4/2a2420?text=RRAND',
      'https://placehold.co/700x700/7b6fbc/2a2420?text=RRAND'
    ])
ON CONFLICT (name) DO NOTHING;

-- Populate categories from whatever's already on products, deduplicated and title-cased
INSERT INTO categories (name)
SELECT DISTINCT INITCAP(TRIM(category))
FROM products
WHERE category IS NOT NULL AND TRIM(category) != ''
ON CONFLICT (name) DO NOTHING;