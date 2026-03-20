-- 017_brand_accounts.sql
-- Brand account system: manufacturers/processors create accounts, get approved, manage products
-- Created: 2026-03-20

CREATE TABLE IF NOT EXISTS brand_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  brand_id UUID REFERENCES brands(id),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  license_number TEXT,
  license_type TEXT,
  website TEXT,
  description TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMPTZ,
  account_type TEXT NOT NULL DEFAULT 'brand',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_accounts_user ON brand_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_accounts_brand ON brand_accounts(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_accounts_email ON brand_accounts(email);
CREATE INDEX IF NOT EXISTS idx_brand_accounts_approved ON brand_accounts(is_approved) WHERE is_approved = true;
