-- Subscriptions table for Subscribe & Save (autoship) feature
-- Stores customer subscription preferences; a cron job creates renewal checkout links.

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  contact_id INTEGER REFERENCES contacts(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  items JSONB NOT NULL,  -- [{slug, name, quantity, purchaseUnit}]
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'biweekly', 'quarterly')),
  discount_pct NUMERIC NOT NULL DEFAULT 10,
  next_renewal_at TIMESTAMPTZ NOT NULL,
  last_renewed_at TIMESTAMPTZ,
  square_order_id TEXT,  -- most recent Square order from a renewal
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Partial index for the cron query: active subscriptions due for renewal
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_renewal
  ON subscriptions (next_renewal_at)
  WHERE status = 'active';

-- Fast lookup by customer email
CREATE INDEX IF NOT EXISTS idx_subscriptions_email
  ON subscriptions (email);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();
