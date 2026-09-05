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

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wishlists (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (customer_id, product_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT false;

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
  ('Scalloped Scrunchie Set', 'Set of three scalloped-edge hair scrunchies.', 1400, 'Pastel Mix', 'Collections', 25,
    ARRAY['Pastel Mix', 'Neutral Mix'], '100% cotton yarn', 'One size, fits most',
    'Hand wash cold, lay flat to dry.', '1-2 business days', 4.6, 9, false, true, '{}'),
  ('Chunky Coaster Set', 'Set of four chunky knit coasters for the home.', 1900, 'Oatmeal', 'Collections', 18,
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

-- Admin-manageable content: Journal, Our Story, The Process, FAQ, Collections
CREATE TABLE IF NOT EXISTS journal_entries (
  id SERIAL PRIMARY KEY,
  tag TEXT NOT NULL DEFAULT 'Inspiration',
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  story TEXT NOT NULL,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS story_blocks (
  id SERIAL PRIMARY KEY,
  heading TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS process_steps (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faqs (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collections (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  tagline TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed each table once (skipped if it already has rows, so this stays safe to re-run)
INSERT INTO journal_entries (tag, entry_date, title, story, image_url, sort_order)
SELECT * FROM (VALUES
  ('Inspiration', DATE '2026-05-02', 'Where the Granny Square Blanket began',
    'Every square in this blanket started as a single skein pulled from my grandmother''s stash — colors she never got the chance to use. I wanted the blanket to feel like it was stitched across two generations, so I mixed her vintage yarns with new cotton for structure. Six weeks and over two hundred squares later, it became one of our best-loved pieces.',
    '/hero-granny-square.jpg', 1),
  ('Behind the Scenes', DATE '2026-04-18', 'Hands at work: a Tuesday in the studio',
    'Most pieces are made in short bursts between other things — a few rows before coffee, a few more after dinner. This shot is from a slow afternoon spent testing a new stitch pattern for a custom order. It didn''t make it into the final piece, but don''t be surprised if it shows up somewhere soon.',
    '/hero-crochet-hands.jpg', 2),
  ('Process', DATE '2026-03-10', 'Four prototypes, one Woven Market Tote',
    'This one went through four versions before the strap length felt right — sturdy enough for a farmer''s market haul, but soft against your shoulder. The canvas lining was the fix. The terracotta colorway came from a stack of unglazed pottery I kept circling back to on a trip last spring; I couldn''t stop thinking about the color once I got home.',
    'https://placehold.co/700x700/e8c5a8/2a2420?text=RRAND', 3),
  ('Inspiration', DATE '2026-02-22', 'The daisy that wouldn''t leave me alone',
    'I saw a single dried daisy pressed in an old book at a flea market and couldn''t put it down — the way the petals had curled but kept their shape. The Daisy Bouquet is my attempt at capturing that: something that looks like it should have wilted by now, but hasn''t, and won''t.',
    'https://placehold.co/700x700/fff3b8/2a2420?text=RRAND', 4),
  ('Process', DATE '2026-01-14', 'Amigurumi Fox: getting the ears right',
    'The fox went through more revisions than any plushie we''ve made — mostly because of the ears. Too small and he looked like a puppy; too big and he tipped over. It took nine tries to land on the proportions in the final pattern, and I still have the six rejected prototypes sitting on a shelf as a reminder.',
    'https://placehold.co/700x700/e8725c/2a2420?text=RRAND', 5)
) AS seed(tag, entry_date, title, story, image_url, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM journal_entries);

INSERT INTO story_blocks (heading, body, image_url, sort_order)
SELECT * FROM (VALUES
  ('How it began',
    'What started as a way to unwind after long days turned into something bigger — friends asking where a beanie or a plushie came from, then asking to buy one for themselves. RRAND was born out of that word-of-mouth, one stitch at a time.',
    '/hero-crochet-hands.jpg', 1),
  ('Small-batch, on purpose',
    'Every piece is made in limited quantities and sold as it''s finished — no mass production, no overseas factories. Just yarn, hooks, and time. That''s why some pieces sell out and don''t always come back the same way twice.',
    '/hero-granny-square.jpg', 2)
) AS seed(heading, body, image_url, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM story_blocks);

INSERT INTO process_steps (title, description, sort_order)
SELECT * FROM (VALUES
  ('Sourcing yarn', 'Every project starts with choosing fiber and colorway — quality yarn, sourced thoughtfully.', 1),
  ('Design & swatch', 'New pieces begin as a swatch, testing stitch patterns and proportions before committing.', 2),
  ('Hand crochet', 'Each piece is worked entirely by hand, stitch by stitch — no machines involved.', 3),
  ('Finishing & QC', 'Ends woven in, seams checked, and every piece inspected before it''s listed.', 4),
  ('Packaging & shipping', 'Wrapped with care and shipped out, ready for its new home.', 5)
) AS seed(title, description, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM process_steps);

INSERT INTO faqs (category, question, answer, sort_order)
SELECT * FROM (VALUES
  ('Orders', 'How do I place an order?', 'Add pieces to your cart from the Shop, then head to checkout — you''ll confirm your details and pay cash on delivery, no card needed.', 1),
  ('Orders', 'Can I modify my order?', 'Reach out on the Contact page as soon as possible with your order number. We can usually adjust an order before it enters production.', 2),
  ('Custom Orders', 'Do you accept custom requests?', 'Yes! Head to the Custom Orders page and tell us about the piece, colors, and size you have in mind.', 3),
  ('Custom Orders', 'How long do custom orders take?', 'Most custom pieces are worked within 2–4 weeks, depending on the design and current queue.', 4),
  ('Products', 'What materials do you use?', 'Mostly 100% cotton and acrylic yarns, chosen piece by piece for durability and softness. Each product page lists its exact materials.', 5),
  ('Products', 'Can I choose the colors?', 'Many pieces come in a few colorways shown on the product page — for anything outside that, a Custom Order is the way to go.', 6),
  ('Products', 'Are handmade pieces identical?', 'Not quite — small variations in tension, shape, and color are part of what makes each handmade piece one of a kind, not a defect.', 7),
  ('Shipping', 'Where do you ship?', 'Currently within the country only. International shipping is on the roadmap — let us know on the Contact page if you''d like to be notified.', 8),
  ('Shipping', 'How long does shipping take?', 'In-stock pieces ship within 3–5 business days after preparation. Custom pieces ship as soon as they''re finished.', 9),
  ('Shipping', 'How much is shipping?', 'A flat $5.00 rate applies to every order, calculated automatically at checkout.', 10),
  ('Care', 'How should I wash my crochet piece?', 'Hand wash in cold water and lay flat to dry. Avoid the dryer, which can cause shrinking or misshaping.', 11),
  ('Care', 'How should I store it?', 'Fold rather than hang, and keep away from direct sunlight and humidity to preserve color and shape.', 12),
  ('Returns', 'Can I return an item?', 'Since most pieces are handmade to order or in very limited quantity, we only accept returns for items that arrive damaged or defective.', 13),
  ('Returns', 'What happens if my order arrives damaged?', 'Contact us within 7 days with a photo of the piece and we''ll arrange a replacement or refund.', 14)
) AS seed(category, question, answer, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM faqs);

INSERT INTO collections (name, slug, tagline, image_url, sort_order)
SELECT * FROM (VALUES
  ('Spring Garden', 'flowers', 'Flowers, floral accessories, and colorful crochet pieces.', 'https://placehold.co/900x1100/fad4cc/fad4cc', 1),
  ('Little Things', 'bags', 'Small gifts, bags, and mini crochet pieces.', 'https://placehold.co/900x1100/fff3b8/fff3b8', 2),
  ('Signature Collection', 'collections', 'The brand''s most recognizable pieces.', '/hero-granny-square.jpg', 3)
) AS seed(name, slug, tagline, image_url, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM collections);