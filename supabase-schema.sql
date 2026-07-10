-- LeadFlow Database Schema
-- Run in Supabase SQL Editor

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT DEFAULT '',
  company TEXT DEFAULT '',
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'growth', 'scale', 'enterprise')),
  stripe_customer_id TEXT DEFAULT '',
  search_used INTEGER DEFAULT 0,
  search_limit INTEGER DEFAULT 50,
  email_sent INTEGER DEFAULT 0,
  email_limit INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT '',
  title TEXT DEFAULT '',
  company TEXT DEFAULT '',
  location TEXT DEFAULT '',
  email TEXT DEFAULT '',
  email_source TEXT DEFAULT '',
  email_verified BOOLEAN DEFAULT false,
  phone TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  telegram TEXT DEFAULT '',
  instagram TEXT DEFAULT '',
  facebook TEXT DEFAULT '',
  linkedin_url TEXT DEFAULT '',
  twitter_handle TEXT DEFAULT '',
  youtube_channel TEXT DEFAULT '',
  tiktok_handle TEXT DEFAULT '',
  discord_handle TEXT DEFAULT '',
  website TEXT DEFAULT '',
  source TEXT DEFAULT '',
  score INTEGER DEFAULT 50,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'replied', 'negotiating', 'won', 'lost', 'churned')),
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  last_contacted TIMESTAMPTZ,
  last_opened TIMESTAMPTZ,
  last_clicked TIMESTAMPTZ,
  data_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact interactions
CREATE TABLE IF NOT EXISTS interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'telegram', 'instagram', 'facebook', 'line', 'twitter', 'discord', 'phone', 'sms', 'form')),
  direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound')),
  subject TEXT DEFAULT '',
  body TEXT DEFAULT '',
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed')),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sequences
CREATE TABLE IF NOT EXISTS sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  steps JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'growth' CHECK (plan IN ('growth', 'scale', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search cache
CREATE TABLE IF NOT EXISTS search_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  source TEXT NOT NULL,
  result_count INTEGER DEFAULT 0,
  results JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Deals
CREATE TABLE IF NOT EXISTS deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  value NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  stage TEXT DEFAULT 'lead' CHECK (stage IN ('lead', 'contacted', 'replied', 'negotiating', 'won', 'lost')),
  probability INTEGER DEFAULT 20,
  expected_close DATE,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Revenue tracking
CREATE TABLE IF NOT EXISTS revenue_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  source TEXT DEFAULT '',
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI training data
CREATE TABLE IF NOT EXISTS ai_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  industry TEXT[] DEFAULT '{}',
  target_markets TEXT[] DEFAULT '{}',
  ideal_customer TEXT DEFAULT '',
  preferred_channels TEXT[] DEFAULT '{}',
  email_style TEXT DEFAULT 'professional',
  interaction_count INTEGER DEFAULT 0,
  accuracy INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_team_id ON contacts(team_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_score ON contacts(score DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_data_expires ON contacts(data_expires_at);
CREATE INDEX IF NOT EXISTS idx_interactions_contact ON interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_user ON deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_revenue_user ON revenue_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_search_cache_query ON search_cache(user_id, query);
CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON search_cache(expires_at);

-- RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile" ON user_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own contacts" ON contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own interactions" ON interactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own sequences" ON sequences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own teams" ON teams FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Users manage own memberships" ON team_members FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own search cache" ON search_cache FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own deals" ON deals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own revenue" ON revenue_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own ai preferences" ON ai_preferences FOR ALL USING (auth.uid() = user_id);
