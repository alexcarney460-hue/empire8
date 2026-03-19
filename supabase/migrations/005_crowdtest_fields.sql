-- Add CrowdTest scoring to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS crowdtest_score float;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS crowdtest_verdict text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS crowdtest_data jsonb;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS crowdtest_tested_at timestamptz;

-- Add CrowdTest fields to form_submissions for tracking which submissions were tested
ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS crowdtest_result jsonb;
