-- Changes made after launch. Runs after schema.sql on a new database, and on
-- existing databases whenever this file changes (see EnsureSchema), so every
-- statement must be safe to run again.

-- ---------------------------------------------------------------------------
-- Products: status, made-to-order, and options with their own stock
-- ---------------------------------------------------------------------------

-- draft, published, sold_out, unavailable, discontinued.
-- Replaces the old visible/hidden switch (is_visible is no longer read).
ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT;
UPDATE products SET status = CASE WHEN is_visible THEN 'published' ELSE 'draft' END WHERE status IS NULL;
ALTER TABLE products ALTER COLUMN status SET DEFAULT 'published';
ALTER TABLE products ALTER COLUMN status SET NOT NULL;

-- ready (finished and in stock) or made_to_order (crocheted after it's ordered, no stock count)
ALTER TABLE products ADD COLUMN IF NOT EXISTS fulfillment TEXT NOT NULL DEFAULT 'ready';

-- The choices a customer makes, in display order,
-- e.g. [{"name": "Color", "values": ["Oat", "Plum"]}, {"name": "Size", "values": ["S", "M"]}]
ALTER TABLE products ADD COLUMN IF NOT EXISTS option_groups JSONB NOT NULL DEFAULT '[]';

-- One row per combination that can be ordered. A product without options has
-- a single variant with options {}. products.stock_quantity is kept as the sum
-- of its available variants' stock.
CREATE TABLE IF NOT EXISTS product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  options JSONB NOT NULL DEFAULT '{}',
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (product_id, options)
);

-- Products from before variants: their colors become a Color option, with the
-- stock shared out evenly (the first colors get any remainder).
UPDATE products p
SET option_groups = jsonb_build_array(jsonb_build_object('name', 'Color', 'values', to_jsonb(p.colors)))
WHERE cardinality(p.colors) > 0
  AND p.option_groups = '[]'::jsonb
  AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id);

INSERT INTO product_variants (product_id, options, stock_quantity, sort_order)
SELECT p.id,
       jsonb_build_object('Color', c.color),
       GREATEST(p.stock_quantity, 0) / cardinality(p.colors)
         + CASE WHEN c.ord <= GREATEST(p.stock_quantity, 0) % cardinality(p.colors) THEN 1 ELSE 0 END,
       c.ord
FROM products p
CROSS JOIN LATERAL unnest(p.colors) WITH ORDINALITY AS c(color, ord)
WHERE cardinality(p.colors) > 0
  AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id)
ON CONFLICT DO NOTHING;

INSERT INTO product_variants (product_id, options, stock_quantity)
SELECT p.id, '{}', GREATEST(p.stock_quantity, 0)
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id);

-- What the customer picked. The label is kept as text so the order still
-- reads right after the product's options are edited, e.g. "Oat / Small".
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_label TEXT;

-- ---------------------------------------------------------------------------
-- Custom orders: quotes, customer approval, production tracking
-- ---------------------------------------------------------------------------

-- new, quoted, approved, in_progress, ready, shipped, completed,
-- quote_declined (the customer said no), declined (the studio turned it down)
ALTER TABLE custom_order_requests ADD COLUMN IF NOT EXISTS yarn_type TEXT;

-- Secret link for the customer's status page, where they approve or decline the quote.
ALTER TABLE custom_order_requests ADD COLUMN IF NOT EXISTS access_token TEXT;
UPDATE custom_order_requests SET access_token = replace(gen_random_uuid()::text, '-', '') WHERE access_token IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS custom_order_requests_access_token ON custom_order_requests (access_token);

ALTER TABLE custom_order_requests ADD COLUMN IF NOT EXISTS quote_cents INTEGER;
ALTER TABLE custom_order_requests ADD COLUMN IF NOT EXISTS quote_ready_by DATE;
-- The studio's estimate of hands-on time, used to work out capacity.
ALTER TABLE custom_order_requests ADD COLUMN IF NOT EXISTS quote_hours NUMERIC(6,1);
ALTER TABLE custom_order_requests ADD COLUMN IF NOT EXISTS quote_message TEXT;
ALTER TABLE custom_order_requests ADD COLUMN IF NOT EXISTS quoted_at TIMESTAMP;
ALTER TABLE custom_order_requests ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP;
ALTER TABLE custom_order_requests ADD COLUMN IF NOT EXISTS decline_reason TEXT;
ALTER TABLE custom_order_requests ADD COLUMN IF NOT EXISTS shipping_address TEXT;

-- Capacity: an empty weekly-hours value means custom orders are never limited.
INSERT INTO site_settings (key, value) VALUES
  ('custom_hours_per_week', ''),
  ('custom_booking_weeks', '6'),
  ('custom_default_hours', '6')
ON CONFLICT (key) DO NOTHING;
