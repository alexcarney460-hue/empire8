-- 019_bid_constraints.sql
-- Database-level safety nets for the Weedbay auction system.

-- Ensure current_bid_cents is always >= starting_price_cents
ALTER TABLE weedbay_lots ADD CONSTRAINT check_bid_gte_start
  CHECK (current_bid_cents IS NULL OR current_bid_cents >= starting_price_cents);

-- Ensure bids are always positive
ALTER TABLE weedbay_bids ADD CONSTRAINT check_bid_positive
  CHECK (amount_cents > 0);

-- Add updated_at trigger for lots
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON weedbay_lots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
