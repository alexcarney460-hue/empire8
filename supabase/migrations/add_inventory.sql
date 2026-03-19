-- Add inventory tracking columns to the products table
-- Keeps it simple: stock count + low-stock threshold on the existing products table

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS quantity_on_hand integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 10;

-- Seed existing products with placeholder stock (999 = "effectively unlimited until real counts are entered")
UPDATE products SET quantity_on_hand = 999 WHERE quantity_on_hand = 0;

-- Helper function: atomically decrement stock and return the new quantity.
-- Returns -1 if the product_slug doesn't exist.
CREATE OR REPLACE FUNCTION decrement_stock(p_slug text, p_qty integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  new_qty integer;
BEGIN
  UPDATE products
     SET quantity_on_hand = quantity_on_hand - p_qty
   WHERE slug = p_slug
  RETURNING quantity_on_hand INTO new_qty;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  RETURN new_qty;
END;
$$;
