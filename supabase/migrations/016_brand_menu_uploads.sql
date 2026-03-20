-- Brand menu upload tracking table
-- Records each CSV or API menu upload with processing statistics

CREATE TABLE IF NOT EXISTS brand_menu_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  rows_processed INTEGER NOT NULL DEFAULT 0,
  rows_added INTEGER NOT NULL DEFAULT 0,
  rows_updated INTEGER NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0,
  error_details JSONB DEFAULT NULL,
  method TEXT NOT NULL DEFAULT 'csv' CHECK (method IN ('csv', 'api')),
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'partial', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for listing recent uploads by brand
CREATE INDEX idx_brand_menu_uploads_brand_id ON brand_menu_uploads(brand_id);

-- Index for chronological listing
CREATE INDEX idx_brand_menu_uploads_created_at ON brand_menu_uploads(created_at DESC);

-- Enable RLS
ALTER TABLE brand_menu_uploads ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access on brand_menu_uploads"
  ON brand_menu_uploads
  FOR ALL
  USING (true)
  WITH CHECK (true);
