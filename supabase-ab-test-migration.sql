-- A/B tests table
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject_a TEXT NOT NULL DEFAULT '',
  body_a TEXT NOT NULL DEFAULT '',
  subject_b TEXT NOT NULL DEFAULT '',
  body_b TEXT NOT NULL DEFAULT '',
  split_percentage INTEGER DEFAULT 50,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed')),
  sent_a INTEGER DEFAULT 0,
  sent_b INTEGER DEFAULT 0,
  opened_a INTEGER DEFAULT 0,
  opened_b INTEGER DEFAULT 0,
  clicked_a INTEGER DEFAULT 0,
  clicked_b INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ab tests" ON ab_tests FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_user ON ab_tests(user_id);
