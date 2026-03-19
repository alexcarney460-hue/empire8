-- Webhook events table for resilient webhook processing
-- Stores every incoming webhook event so we never lose data even if processing fails

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Index for quick lookups by event_id (already unique, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events (event_id);

-- Index for finding failed/pending events that need retry
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events (status) WHERE status IN ('pending', 'failed');

-- Index for listing recent events in admin
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events (created_at DESC);
