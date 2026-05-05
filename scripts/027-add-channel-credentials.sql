-- Per-gym channel credentials
-- Version: 1.0.0  (Wave 9c: multi-tenant DM channels)
--
-- Stores the API tokens / secrets each gym needs to send replies
-- through their own LINE OA, WhatsApp Business number, IG Business
-- account, etc. Without this, every gym would share one set of env-var
-- credentials — fine for the demo gym (Wisarut), unworkable for a
-- network of gyms.
--
-- Design notes:
--   - credentials is JSONB so we can store the per-channel shape (LINE
--     uses access token + channel secret; WhatsApp uses access token +
--     phone_number_id + verify token; etc.) without one column per key.
--   - is_verified flips to true the first time we successfully send a
--     test message through the credentials. Until then the UI shows
--     "needs test."
--   - Secrets are NEVER returned by the API to the client — the API
--     surfaces an existence boolean + masked preview only. Only the
--     server-side adapters (using the service role) read raw values.
--   - RLS: only owner/admin of the org can write; nobody can SELECT
--     raw credentials via PostgREST (the service role bypasses RLS for
--     adapter reads).

CREATE TABLE IF NOT EXISTS mtp_channel_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  channel TEXT NOT NULL CHECK (channel IN ('line','telegram','whatsapp','ig','fb','test')),

  -- Per-channel credential bag. Examples:
  --   line:     { "channel_secret": "...", "channel_access_token": "..." }
  --   telegram: { "bot_token": "...", "webhook_secret": "...", "bot_id": "..." }
  --   whatsapp: { "app_secret": "...", "verify_token": "...", "access_token": "...", "phone_number_id": "..." }
  --   ig/fb:    { "page_access_token": "...", "page_id": "..." }
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Toggleable without deleting (lets owners pause a channel mid-debug)
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Has an outbound test ever succeeded with these creds?
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  last_verified_at TIMESTAMPTZ,
  last_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One credential bag per gym per channel. If the gym has two LINE OAs
  -- they can either pick one canonical one or we extend the model later.
  UNIQUE (org_id, channel)
);

CREATE INDEX IF NOT EXISTS mtp_channel_credentials_org_id_idx
  ON mtp_channel_credentials (org_id);

ALTER TABLE mtp_channel_credentials ENABLE ROW LEVEL SECURITY;

-- IMPORTANT: no broad SELECT policy. Even owners cannot SELECT raw
-- credentials via PostgREST — the API masks them server-side. Adapters
-- that need raw values use the service role.
CREATE POLICY "Owners can manage their own gym's channel credentials (no select)"
  ON mtp_channel_credentials FOR INSERT
  WITH CHECK (has_org_role(org_id, ARRAY['owner','admin']));

CREATE POLICY "Owners can update their own gym's channel credentials"
  ON mtp_channel_credentials FOR UPDATE
  USING (has_org_role(org_id, ARRAY['owner','admin']))
  WITH CHECK (has_org_role(org_id, ARRAY['owner','admin']));

CREATE POLICY "Owners can delete their own gym's channel credentials"
  ON mtp_channel_credentials FOR DELETE
  USING (has_org_role(org_id, ARRAY['owner','admin']));

CREATE POLICY "Platform admins full access to channel credentials"
  ON mtp_channel_credentials FOR ALL
  USING (is_platform_admin());

CREATE TRIGGER mtp_channel_credentials_updated_at
  BEFORE UPDATE ON mtp_channel_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
