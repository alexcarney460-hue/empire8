-- 015_weedbay_marketplace.sql
-- Weedbay Marketplace: anonymous large-lot cannabis auction platform
-- Brand Menu Upload: daily CSV/API product menu ingestion
-- Created: 2026-03-19

-- ============================================================
-- Brand Menu Uploads (CSV or API)
-- ============================================================
CREATE TABLE IF NOT EXISTS brand_menu_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  filename TEXT,
  upload_method TEXT NOT NULL DEFAULT 'csv',
  row_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing',
  errors JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_menu_uploads_brand
  ON brand_menu_uploads(brand_id);

-- ============================================================
-- Weedbay Marketplace Lots
-- ============================================================
CREATE TABLE IF NOT EXISTS weedbay_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  seller_type TEXT NOT NULL DEFAULT 'brand',
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  quantity TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'lbs',
  starting_price_cents INTEGER NOT NULL,
  reserve_price_cents INTEGER,
  buy_now_price_cents INTEGER,
  current_bid_cents INTEGER DEFAULT 0,
  bid_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  ends_at TIMESTAMPTZ NOT NULL,
  images JSONB DEFAULT '[]',
  lab_results_url TEXT,
  thc_percentage DECIMAL(5,2),
  cbd_percentage DECIMAL(5,2),
  strain_name TEXT,
  grow_method TEXT,
  platform_fee_pct DECIMAL(4,2) NOT NULL DEFAULT 5.00,
  winner_id UUID,
  winner_bid_cents INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weedbay_lots_status
  ON weedbay_lots(status);
CREATE INDEX IF NOT EXISTS idx_weedbay_lots_category
  ON weedbay_lots(category);
CREATE INDEX IF NOT EXISTS idx_weedbay_lots_ends
  ON weedbay_lots(ends_at);
CREATE INDEX IF NOT EXISTS idx_weedbay_lots_seller
  ON weedbay_lots(seller_id);

-- ============================================================
-- Weedbay Bids
-- ============================================================
CREATE TABLE IF NOT EXISTS weedbay_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES weedbay_lots(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL,
  bidder_type TEXT NOT NULL DEFAULT 'dispensary',
  amount_cents INTEGER NOT NULL,
  is_winning BOOLEAN NOT NULL DEFAULT false,
  is_auto_bid BOOLEAN NOT NULL DEFAULT false,
  max_auto_bid_cents INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weedbay_bids_lot
  ON weedbay_bids(lot_id);
CREATE INDEX IF NOT EXISTS idx_weedbay_bids_bidder
  ON weedbay_bids(bidder_id);

-- ============================================================
-- Weedbay Watchlist
-- ============================================================
CREATE TABLE IF NOT EXISTS weedbay_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES weedbay_lots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lot_id, user_id)
);

-- ============================================================
-- RLS Policies (tables accessible via service role for now)
-- ============================================================
ALTER TABLE brand_menu_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE weedbay_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE weedbay_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE weedbay_watchlist ENABLE ROW LEVEL SECURITY;
