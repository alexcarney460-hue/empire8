-- ============================================================================
-- 013_crowdtest.sql
-- CrowdTest: AI-powered synthetic focus group system
-- ============================================================================

-- CrowdTest API keys
CREATE TABLE IF NOT EXISTS crowdtest_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CrowdTest tests
CREATE TABLE IF NOT EXISTS crowdtest_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  stimulus_type TEXT NOT NULL DEFAULT 'text',
  stimulus_content TEXT NOT NULL,
  audience_description TEXT,
  persona_count INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'pending',
  progress_phase TEXT,
  progress_current INTEGER DEFAULT 0,
  progress_total INTEGER DEFAULT 0,
  results JSONB,
  api_key_id UUID REFERENCES crowdtest_api_keys(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Saved audience profiles for reuse
CREATE TABLE IF NOT EXISTS crowdtest_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  persona_templates JSONB,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crowdtest_tests_status ON crowdtest_tests(status);
CREATE INDEX IF NOT EXISTS idx_crowdtest_tests_created ON crowdtest_tests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crowdtest_api_keys_key ON crowdtest_api_keys(api_key);

-- Row Level Security
ALTER TABLE crowdtest_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE crowdtest_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE crowdtest_audiences ENABLE ROW LEVEL SECURITY;

-- Service role can manage all crowdtest tables
CREATE POLICY crowdtest_api_keys_service ON crowdtest_api_keys
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY crowdtest_tests_service ON crowdtest_tests
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY crowdtest_audiences_service ON crowdtest_audiences
  FOR ALL USING (auth.role() = 'service_role');
