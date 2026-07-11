-- Messaging / conversation migration
-- Adds columns needed for inbound replies and cross-channel threads.

-- Track which collection a contact belongs to (used by outreach filters).
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES collections(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_collection ON contacts(collection_id);

-- Store channel-specific routing data (Resend id, WhatsApp id, Telegram id, from/to addresses, etc.)
ALTER TABLE interactions
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_interactions_metadata ON interactions USING GIN (metadata);
