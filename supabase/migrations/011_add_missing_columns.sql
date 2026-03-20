-- Add missing columns discovered by schema audit
-- 2026-03-19

ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS brand_name TEXT;
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS brand_logo_url TEXT;
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS unit_type TEXT NOT NULL DEFAULT 'unit';
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS item_count INTEGER DEFAULT 0;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS category TEXT;
