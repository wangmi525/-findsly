-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  category TEXT DEFAULT 'custom',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own templates" ON email_templates FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_templates_user ON email_templates(user_id);

-- Add tracking columns to interactions
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ;
