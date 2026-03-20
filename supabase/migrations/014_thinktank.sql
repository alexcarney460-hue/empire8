-- ThinkTank: Expert panel debate simulator
-- Simulates domain experts arguing different perspectives on a question

CREATE TABLE IF NOT EXISTS thinktank_debates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  question TEXT NOT NULL,
  context TEXT,
  expert_count INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'pending',
  experts JSONB,
  rounds JSONB,
  synthesis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_thinktank_status ON thinktank_debates(status);
CREATE INDEX IF NOT EXISTS idx_thinktank_created ON thinktank_debates(created_at DESC);
