-- ============================================
-- 035: Social posts (AI social suite Phase 1)
-- Version: 1.0.0  (Wave 14: AI social media management)
--
-- One row per "post idea" — could span Instagram + Facebook + TikTok +
-- LINE OA. Per-platform content is stored as JSONB so each platform
-- can have its native fields (caption, hashtags, body, etc.) without
-- relational complexity.
--
-- Why one row per idea (not per-platform-per-row)?
--   - Operator thinks in "I want to post about X" — that's one idea
--   - Cross-platform performance comparison is easier
--   - AI generates all variants together so they share context
--
-- Posting integration (actually publishing to IG/FB/TikTok) is Phase 2.
-- For v1, "scheduled" posts are reminders the operator publishes
-- manually OR forwards to a third-party scheduler (Buffer/Postiz). The
-- AI composition + management layer is the value this commit ships.
-- ============================================

CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Lifecycle:
  --   draft      → still being edited, not committed to a time
  --   scheduled  → has a scheduled_for date, sitting in queue
  --   published  → went out (manually or via integration)
  --   archived   → operator dismissed it
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','archived')),

  -- Platforms this post targets. Subset of: instagram, facebook,
  -- tiktok, line_oa, threads, twitter. Used for UI filtering.
  platforms TEXT[] NOT NULL DEFAULT '{}'::text[],

  -- Per-platform content. Shape:
  --   {
  --     instagram: { caption, hashtags: ["#tag", ...], image_urls: [], reel: bool },
  --     facebook:  { body, image_urls: [] },
  --     tiktok:    { caption, hashtags: [] },
  --     line_oa:   { body },
  --     threads:   { body, image_urls: [] }
  --   }
  -- Each platform key is optional — only present if user composed for that one.
  content JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,

  -- Provenance — used to attribute AI usage + show source in UI
  --   manual      → operator typed everything
  --   ai_compose  → operator gave a single intent, AI generated variants
  --   ai_batch    → part of "generate this week's posts" output
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','ai_compose','ai_batch')),
  -- The original natural-language prompt if AI-generated. Operator can
  -- regenerate from this later if they want different output.
  source_intent TEXT,

  -- Audit
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS social_posts_org_id_status_idx
  ON social_posts (org_id, status, scheduled_for);
CREATE INDEX IF NOT EXISTS social_posts_org_id_created_at_idx
  ON social_posts (org_id, created_at DESC);

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners + admins manage their org's social posts"
  ON social_posts FOR ALL
  USING (has_org_role(org_id, ARRAY['owner','admin']))
  WITH CHECK (has_org_role(org_id, ARRAY['owner','admin']));

CREATE POLICY "Platform admins full access social posts"
  ON social_posts FOR ALL
  USING (is_platform_admin());

CREATE TRIGGER social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE social_posts IS
  'AI-driven social media posts for a gym. One row per idea, multiple platform variants in content JSONB.';
