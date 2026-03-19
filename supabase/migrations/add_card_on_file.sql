-- Add card-on-file columns for auto-charging subscriptions on renewal
-- instead of sending payment links.

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS square_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS square_card_id TEXT,
  ADD COLUMN IF NOT EXISTS card_last4 TEXT,
  ADD COLUMN IF NOT EXISTS payment_failed_at TIMESTAMPTZ;

-- Index for looking up subscriptions by Square customer ID
CREATE INDEX IF NOT EXISTS idx_subscriptions_square_customer_id
  ON subscriptions (square_customer_id)
  WHERE square_customer_id IS NOT NULL;
