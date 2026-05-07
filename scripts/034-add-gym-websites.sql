-- ============================================
-- 034: Gym websites
-- Version: 1.0.0  (Wave 13: gym website builder)
--
-- The "talk to OckOck and change your website" foundation. Each gym
-- gets a single website row with their content stored as a JSON blob
-- of named sections + a theme blob (colors, logo, hero image).
--
-- Why JSONB instead of a relational table per section type?
--   - We want flexibility to add new section types (testimonials,
--     pricing, blog, etc.) without DB migrations
--   - Sections are owned end-to-end by the gym — no cross-gym joins
--   - Order matters and is gym-controlled — JSONB array preserves it
--   - Performance: one fetch per page render, no N+1
--
-- Versioning: just keep updated_at. We can add a snapshots table later
-- if anyone asks for "revert to last week" — out of scope for v1.
--
-- Custom domains: not in this migration. Phase 2 will add a
-- gym_website_domains table mapping hostname → org_id with verification
-- status. v1 just serves at /gyms/[slug] via subdomain routing.
-- ============================================

CREATE TABLE IF NOT EXISTS gym_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Workflow:
  --   draft     → operator is editing, not yet visible publicly
  --   published → /gyms/[slug] renders this content
  --   archived  → site temporarily hidden (e.g. closed gym)
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),

  -- Content
  -- ───────
  -- sections: ordered array of {id, type, props}
  -- e.g. [
  --   { "id": "abc", "type": "hero", "props": { "title": "...", "subtitle": "...", "image_url": "..." } },
  --   { "id": "def", "type": "about", "props": { "body": "..." } },
  --   { "id": "ghi", "type": "hours", "props": { "monday": {...}, ... } }
  -- ]
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- theme: { primary_color, accent_color, font, logo_url, favicon_url, hero_image_url }
  theme JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- SEO / Open Graph
  seo_title TEXT,
  seo_description TEXT,
  seo_image_url TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,

  -- One website per gym
  UNIQUE (org_id)
);

CREATE INDEX IF NOT EXISTS gym_websites_org_id_idx ON gym_websites (org_id);
CREATE INDEX IF NOT EXISTS gym_websites_status_idx ON gym_websites (status) WHERE status = 'published';

ALTER TABLE gym_websites ENABLE ROW LEVEL SECURITY;

-- Anyone can SELECT published websites — they're public
CREATE POLICY "Anyone reads published websites"
  ON gym_websites FOR SELECT
  USING (status = 'published' OR has_org_role(org_id, ARRAY['owner','admin']));

CREATE POLICY "Owners + admins manage their website"
  ON gym_websites FOR ALL
  USING (has_org_role(org_id, ARRAY['owner','admin']))
  WITH CHECK (has_org_role(org_id, ARRAY['owner','admin']));

CREATE POLICY "Platform admins full access websites"
  ON gym_websites FOR ALL
  USING (is_platform_admin());

CREATE TRIGGER gym_websites_updated_at
  BEFORE UPDATE ON gym_websites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE gym_websites IS
  'Per-gym website content. One row per gym. Sections + theme as JSONB so new section types can be added without migrations.';

-- ─── AI conversation log ──────────────────────────────────────────────
-- Every "OckOck, change my website" exchange is logged so the operator
-- has a history and we can debug + improve prompts. Append-only, no RLS
-- write from clients (only the API route writes via service role).

CREATE TABLE IF NOT EXISTS gym_website_ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- 'user' = operator typed it, 'assistant' = OckOck replied
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,

  -- If assistant turn, what did it actually do? Audit + replay.
  actions JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gym_website_ai_messages_org_id_idx
  ON gym_website_ai_messages (org_id, created_at DESC);

ALTER TABLE gym_website_ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners + admins read their gym's AI chat"
  ON gym_website_ai_messages FOR SELECT
  USING (has_org_role(org_id, ARRAY['owner','admin']));

CREATE POLICY "Platform admins full access ai messages"
  ON gym_website_ai_messages FOR ALL
  USING (is_platform_admin());

COMMENT ON TABLE gym_website_ai_messages IS
  'Conversation log for the OckOck website editor. Append-only, used for context recall + audit.';
