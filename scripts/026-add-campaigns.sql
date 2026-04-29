-- ============================================
-- 026: AI-first sales/marketing campaigns
-- ============================================
-- Structured outreach to discovered_gyms — pick a target filter,
-- write a templated message with AI personalization, generate
-- per-gym drafts, approve in bulk, send via the chosen channel
-- (email v1; LINE/WhatsApp later).
--
-- Two tables:
--   campaigns       — name, filter, template (subject + body), channel
--   campaign_sends  — per-recipient row with rendered content + audit
-- ============================================

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  description TEXT,
  channel TEXT NOT NULL DEFAULT 'email'
    CHECK (channel IN ('email', 'line', 'whatsapp', 'test')),

  -- Targeting: a JSONB filter applied against discovered_gyms.
  --   Example: { "status": ["pending","verified"], "province": "Phuket",
  --              "has_website": true, "has_extraction": true }
  target_filter JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Template
  subject_template TEXT,                 -- email subject
  body_template TEXT NOT NULL,           -- raw template (markdown for email)
  personalize_prompt TEXT,               -- instructions for AI personalization
  personalize BOOLEAN DEFAULT TRUE,      -- run each draft through Claude

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'drafting', 'review', 'sending', 'sent', 'archived')),

  -- Sender identity (defaults to platform)
  from_name TEXT,
  from_email TEXT,

  -- Cached counts (refreshed by code on send)
  total_targets INTEGER DEFAULT 0,
  total_drafted INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_claimed INTEGER DEFAULT 0,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- One row per (campaign, target gym). Status flow:
--   draft  → approved → sent → opened?/claimed?
--          ↘ rejected
--          ↘ skipped (no channel address available)
--          ↘ failed  (delivery error)
CREATE TABLE IF NOT EXISTS campaign_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES discovered_gyms(id) ON DELETE CASCADE,

  -- Channel-resolved destination
  channel TEXT NOT NULL,                 -- email|line|whatsapp|test
  to_address TEXT,                       -- email address, line userId, etc.

  -- Rendered content (after AI personalization)
  subject TEXT,
  body TEXT,

  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'approved', 'rejected', 'skipped',
                      'sending', 'sent', 'failed', 'opened',
                      'clicked', 'claimed')),

  -- Audit
  drafted_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,

  -- Provider response
  provider_id TEXT,                      -- e.g. resend message id
  error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (campaign_id, gym_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_sends_campaign ON campaign_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_gym ON campaign_sends(gym_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_status ON campaign_sends(campaign_id, status);

CREATE TRIGGER update_campaign_sends_updated_at
  BEFORE UPDATE ON campaign_sends
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS — platform admins only
-- ============================================
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage campaigns"
  ON campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_platform_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_platform_admin = TRUE
    )
  );

CREATE POLICY "Platform admins manage campaign sends"
  ON campaign_sends FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_platform_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_platform_admin = TRUE
    )
  );
