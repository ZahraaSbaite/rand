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
-- Hidden products stay in the admin but disappear from the shop.
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;

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
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;

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
-- new, quoted, in_progress, completed, declined
ALTER TABLE custom_order_requests ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new';
ALTER TABLE custom_order_requests ADD COLUMN IF NOT EXISTS admin_notes TEXT;

CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collections (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  tagline TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS faqs (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Lookbook entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id SERIAL PRIMARY KEY,
  tag TEXT NOT NULL DEFAULT 'Inspiration',
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  story TEXT NOT NULL,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS process_steps (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS story_blocks (
  id SERIAL PRIMARY KEY,
  heading TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Editable site text and links, one row per key
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

-- ---------------------------------------------------------------------------
-- Seed data (safe to re-run; nothing is duplicated)
-- ---------------------------------------------------------------------------

INSERT INTO categories (name, sort_order, description) VALUES
  ('Bags', 1, 'Shoulder bags, bucket bags and minis, worked by hand.'),
  ('Tote Bags', 2, 'Roomy everyday totes for the market, the beach and the commute.'),
  ('Scarves', 3, 'Long, soft scarves in granny squares, ribs and waves.'),
  ('Cardigans', 4, 'Patchwork and granny-square cardigans, made in small batches.'),
  ('Gloves', 5, 'Fingerless gloves and mittens for cold hands.')
ON CONFLICT (name) DO NOTHING;

-- Sample pieces so the shop isn't empty; edit or delete them from the admin.
INSERT INTO products (
  name, description, price_cents, yarn_color, category, stock_quantity,
  colors, materials, dimensions, care_instructions, production_time, featured
)
VALUES
  ('Sunny Bucket Bag', 'A structured bucket bag with a drawstring top and a sturdy crochet strap.', 4200, 'Marigold', 'Bags', 4,
    ARRAY['Marigold', 'Cocoa'], '100% cotton yarn', '9in W x 10in H', 'Spot clean with a damp cloth.', '3-5 business days', true),
  ('Granny Square Shoulder Bag', 'Classic granny squares joined into a slouchy shoulder bag, lined in cotton.', 4800, 'Multicolor', 'Bags', 3,
    ARRAY['Multicolor', 'Earth tones'], '100% cotton yarn, cotton lining', '11in W x 9in H', 'Spot clean only.', '1 week', false),
  ('Woven Market Tote', 'Sturdy crocheted tote lined with cotton canvas, big enough for the weekly shop.', 3800, 'Oat', 'Tote Bags', 6,
    ARRAY['Oat', 'Avocado', 'Tomato'], '100% cotton yarn, canvas lining', '14in W x 12in H x 5in D', 'Spot clean with a damp cloth.', '3-5 business days', true),
  ('Striped Beach Tote', 'An open-mesh tote in bold stripes that dries fast and packs flat.', 3400, 'Tomato & Oat', 'Tote Bags', 5,
    ARRAY['Tomato & Oat', 'Sky & Oat'], '100% cotton yarn', '16in W x 13in H', 'Hand wash cold, lay flat to dry.', '3-5 business days', false),
  ('Granny Square Scarf', 'A long scarf of joined granny squares in warm, saturated colors.', 3600, 'Plum & Marigold', 'Scarves', 5,
    ARRAY['Plum & Marigold', 'Rose & Oat'], 'Wool blend yarn', '8in W x 70in L', 'Hand wash cold, lay flat to dry.', '1 week', true),
  ('Chunky Ribbed Scarf', 'A thick ribbed scarf with tasseled ends, soft against the neck.', 3200, 'Cocoa', 'Scarves', 7,
    ARRAY['Cocoa', 'Oat', 'Avocado'], 'Acrylic-wool blend yarn', '10in W x 64in L', 'Hand wash cold, lay flat to dry.', '3-5 business days', false),
  ('Patchwork Cardigan', 'A boxy patchwork cardigan in granny squares with wooden buttons.', 12500, 'Multicolor', 'Cardigans', 2,
    ARRAY['Multicolor'], 'Wool blend yarn', 'One size, relaxed fit', 'Hand wash cold, dry flat. Do not tumble dry.', '2-3 weeks', true),
  ('Daisy Cropped Cardigan', 'A cropped cardigan with daisy motifs around the hem and cuffs.', 11000, 'Oat & Marigold', 'Cardigans', 2,
    ARRAY['Oat & Marigold', 'Sky & Oat'], '100% cotton yarn', 'Sizes S-L', 'Hand wash cold, dry flat.', '2-3 weeks', false),
  ('Fingerless Gloves', 'Warm fingerless gloves with a ribbed cuff, so you can still text.', 2200, 'Avocado', 'Gloves', 10,
    ARRAY['Avocado', 'Cocoa', 'Rose'], 'Wool blend yarn', 'One size, stretchy', 'Hand wash cold, lay flat to dry.', '2-4 business days', false),
  ('Granny Square Mittens', 'Cozy mittens with a granny square back and a soft ribbed cuff.', 2600, 'Multicolor', 'Gloves', 8,
    ARRAY['Multicolor', 'Plum'], 'Wool blend yarn', 'Adult S/M and M/L', 'Hand wash cold, lay flat to dry.', '3-5 business days', false)
ON CONFLICT (name) DO NOTHING;

INSERT INTO collections (name, slug, tagline, sort_order)
SELECT * FROM (VALUES
  ('Carry It All', 'tote-bags', 'Totes and bags for every errand.', 1),
  ('Cold Weather', 'scarves', 'Scarves and gloves for chilly days.', 2),
  ('Layer Up', 'cardigans', 'Statement cardigans, made one at a time.', 3)
) AS v(name, slug, tagline, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM collections);

INSERT INTO process_steps (title, description, sort_order)
SELECT * FROM (VALUES
  ('Sourcing yarn', 'Every project starts with choosing fiber and colorway — quality yarn, sourced thoughtfully.', 1),
  ('Design & swatch', 'New pieces begin as a swatch, testing stitch patterns and proportions before committing.', 2),
  ('Hand crochet', 'Each piece is worked entirely by hand, stitch by stitch — no machines involved.', 3),
  ('Finishing & QC', 'Ends woven in, seams checked, and every piece inspected before it''s listed.', 4),
  ('Packaging & shipping', 'Wrapped with care and shipped out, ready for its new home.', 5)
) AS v(title, description, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM process_steps);

INSERT INTO story_blocks (heading, body, sort_order)
SELECT * FROM (VALUES
  ('How it began', 'What started as a way to unwind after long days turned into something bigger — friends asking where a bag or a scarf came from, then asking to buy one for themselves. Strand was born out of that word-of-mouth, one stitch at a time.', 1),
  ('Small-batch, on purpose', 'Every piece is made in limited quantities and sold as it''s finished — no mass production, no overseas factories. Just yarn, hooks, and time. That''s why some pieces sell out and don''t always come back the same way twice.', 2)
) AS v(heading, body, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM story_blocks);

INSERT INTO faqs (category, question, answer, sort_order)
SELECT * FROM (VALUES
  ('Orders', 'How do I place an order?', 'Add pieces to your cart from the Shop, then head to checkout — you''ll confirm your details and pay cash on delivery, no card needed.', 1),
  ('Orders', 'Can I modify my order?', 'Reach out on the Contact page as soon as possible with your order number. We can usually adjust an order before it enters production.', 2),
  ('Custom Orders', 'Do you accept custom requests?', 'Yes! Head to the Custom Orders page and tell us about the piece, colors, and size you have in mind.', 1),
  ('Custom Orders', 'How long do custom orders take?', 'Most custom pieces are worked within 2–4 weeks, depending on the design and current queue.', 2),
  ('Products', 'What materials do you use?', 'Mostly cotton and wool-blend yarns, chosen piece by piece for durability and softness. Each product page lists its exact materials.', 1),
  ('Products', 'Can I choose the colors?', 'Many pieces come in a few colorways shown on the product page — for anything outside that, a Custom Order is the way to go.', 2),
  ('Products', 'Are handmade pieces identical?', 'Not quite — small variations in tension, shape, and color are part of what makes each handmade piece one of a kind, not a defect.', 3),
  ('Shipping', 'Where do you ship?', 'Currently within the country only. Let us know on the Contact page if you''d like to be notified about international shipping.', 1),
  ('Shipping', 'How long does shipping take?', 'In-stock pieces ship within 3–5 business days after preparation. Custom pieces ship as soon as they''re finished.', 2),
  ('Shipping', 'How much is shipping?', 'A flat $5.00 rate applies to every order, calculated automatically at checkout.', 3),
  ('Care', 'How should I wash my crochet piece?', 'Hand wash in cold water and lay flat to dry. Avoid the dryer, which can cause shrinking or misshaping.', 1),
  ('Care', 'How should I store it?', 'Fold rather than hang — especially cardigans — and keep away from direct sunlight and humidity.', 2),
  ('Returns', 'Can I return an item?', 'Since most pieces are handmade to order or in very limited quantity, we only accept returns for items that arrive damaged or defective.', 1),
  ('Returns', 'What happens if my order arrives damaged?', 'Contact us within 7 days with a photo of the piece and we''ll arrange a replacement or refund.', 2)
) AS v(category, question, answer, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM faqs);

-- Empty policy texts mean "use the built-in page copy".
INSERT INTO site_settings (key, value) VALUES
  ('hero_tagline', 'A world of color + thread'),
  ('hero_text', 'Handmade bags, totes, scarves, cardigans and gloves, worked slowly by hand and sold as each piece is finished.'),
  ('ticker', 'Made by hand, one stitch at a time | Small batches, sold as they''re finished | Custom colorways on request'),
  ('instagram_url', ''),
  ('tiktok_url', ''),
  ('pinterest_url', ''),
  ('contact_email', ''),
  ('shipping_text', ''),
  ('returns_text', ''),
  ('privacy_text', ''),
  ('terms_text', '')
ON CONFLICT (key) DO NOTHING;
