-- ============================================================================
-- 010_dispensary_platform.sql
-- Cannabis wholesale platform: dispensary accounts, brands, products, orders
-- ============================================================================

-- Dispensary accounts (linked to Supabase auth)
CREATE TABLE IF NOT EXISTS dispensary_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  license_number TEXT NOT NULL,
  license_type TEXT NOT NULL DEFAULT 'adult_use_retail',
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address_street TEXT,
  address_city TEXT,
  address_state TEXT DEFAULT 'NY',
  address_zip TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Brands (manufacturers/processors Empire 8 carries)
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  contact_email TEXT NOT NULL,
  contact_name TEXT,
  website TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products in each brand's catalog
CREATE TABLE IF NOT EXISTS brand_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  image_url TEXT,
  unit_price_cents INTEGER NOT NULL,
  unit_type TEXT NOT NULL DEFAULT 'unit',
  min_order_qty INTEGER NOT NULL DEFAULT 1,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(brand_id, slug)
);

-- Sales orders (generated when dispensary checks out)
CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  dispensary_id UUID NOT NULL REFERENCES dispensary_accounts(id),
  status TEXT NOT NULL DEFAULT 'submitted',
  total_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Line items per sales order (grouped by brand for email splitting)
CREATE TABLE IF NOT EXISTS sales_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id),
  product_id UUID NOT NULL REFERENCES brand_products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  line_total_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_dispensary_accounts_user ON dispensary_accounts(user_id);
CREATE INDEX idx_dispensary_accounts_approved ON dispensary_accounts(is_approved);

CREATE INDEX idx_brands_slug ON brands(slug) WHERE is_active = true;

CREATE INDEX idx_brand_products_brand ON brand_products(brand_id);
CREATE INDEX idx_brand_products_category ON brand_products(category);
CREATE INDEX idx_brand_products_available ON brand_products(brand_id) WHERE is_available = true;

CREATE INDEX idx_sales_orders_dispensary ON sales_orders(dispensary_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_sales_orders_created ON sales_orders(created_at DESC);

CREATE INDEX idx_sales_order_items_order ON sales_order_items(order_id);
CREATE INDEX idx_sales_order_items_brand ON sales_order_items(brand_id);

-- ── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE dispensary_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;

-- Dispensary accounts: users can read their own row
CREATE POLICY dispensary_accounts_select_own ON dispensary_accounts
  FOR SELECT USING (auth.uid() = user_id);

-- Dispensary accounts: service role can do everything (signup, admin)
CREATE POLICY dispensary_accounts_service ON dispensary_accounts
  FOR ALL USING (auth.role() = 'service_role');

-- Brands: any authenticated user can read active brands
CREATE POLICY brands_select_active ON brands
  FOR SELECT USING (is_active = true);

-- Brands: service role can manage
CREATE POLICY brands_service ON brands
  FOR ALL USING (auth.role() = 'service_role');

-- Brand products: any authenticated user can read available products
CREATE POLICY brand_products_select_available ON brand_products
  FOR SELECT USING (is_available = true);

-- Brand products: service role can manage
CREATE POLICY brand_products_service ON brand_products
  FOR ALL USING (auth.role() = 'service_role');

-- Sales orders: dispensary can read their own orders
CREATE POLICY sales_orders_select_own ON sales_orders
  FOR SELECT USING (
    dispensary_id IN (
      SELECT id FROM dispensary_accounts WHERE user_id = auth.uid()
    )
  );

-- Sales orders: dispensary can insert their own orders
CREATE POLICY sales_orders_insert_own ON sales_orders
  FOR INSERT WITH CHECK (
    dispensary_id IN (
      SELECT id FROM dispensary_accounts WHERE user_id = auth.uid()
    )
  );

-- Sales orders: service role can manage
CREATE POLICY sales_orders_service ON sales_orders
  FOR ALL USING (auth.role() = 'service_role');

-- Sales order items: dispensary can read items from their orders
CREATE POLICY sales_order_items_select_own ON sales_order_items
  FOR SELECT USING (
    order_id IN (
      SELECT so.id FROM sales_orders so
      JOIN dispensary_accounts da ON da.id = so.dispensary_id
      WHERE da.user_id = auth.uid()
    )
  );

-- Sales order items: dispensary can insert items into their orders
CREATE POLICY sales_order_items_insert_own ON sales_order_items
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT so.id FROM sales_orders so
      JOIN dispensary_accounts da ON da.id = so.dispensary_id
      WHERE da.user_id = auth.uid()
    )
  );

-- Sales order items: service role can manage
CREATE POLICY sales_order_items_service ON sales_order_items
  FOR ALL USING (auth.role() = 'service_role');
