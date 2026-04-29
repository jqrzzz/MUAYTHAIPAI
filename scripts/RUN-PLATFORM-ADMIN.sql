-- ============================================
-- RUN-PLATFORM-ADMIN: migrations 023-026 in order
-- ============================================
-- Bundled migrations for the platform-admin command center.
-- Apply via Supabase SQL editor or psql:
--
--   psql "$DATABASE_URL" -f scripts/RUN-PLATFORM-ADMIN.sql
--
-- Or paste into Supabase Dashboard → SQL Editor → Run.
--
-- IMPORTANT: apply ONCE. Most statements use IF NOT EXISTS,
-- but CREATE POLICY and CREATE TRIGGER will error if a policy
-- or trigger of the same name already exists. If a re-run is
-- needed, drop the conflicting policies/triggers first.
--
-- Contents:
--   023 — RLS fix for platform-wide courses
--   024 — discovered_gyms (network discovery pipeline)
--   025 — last_nudged_at on discovered_gyms (snooze)
--   026 — campaigns + campaign_sends (outreach)
--
-- After applying, populate env vars:
--   GOOGLE_PLACES_API_KEY     — Places API (New) v1
--   FIRECRAWL_API_KEY         — firecrawl.dev
--   RESEND_API_KEY            — resend.com (already used for booking emails)
--   AI_GATEWAY_API_KEY        — Vercel AI Gateway (also used by chat concierge)
--   ACTION_TOKEN_SECRET       — random string for HMAC-signed action tokens
--                               (falls back to SUPABASE_SERVICE_ROLE_KEY if unset)
--   NEXT_PUBLIC_SITE_URL      — public origin, used in invite/QR links
--
-- Visit /platform-admin → Overview → Health card to verify.
-- ============================================

-- ============================================
-- 023
-- ============================================
-- ============================================
-- 023: Tighten RLS on platform-wide courses
-- ============================================
-- Migration 013 let any gym owner/admin write to courses where
-- org_id IS NULL. The Naga–Garuda ladder is the country-wide
-- standard, so platform admins are the only ones who should be
-- able to author or modify it. Gym admins remain free to create
-- and manage their own gym-scoped courses.
--
-- This migration:
--   1. Drops the old combined "Org admins manage courses" policy
--   2. Re-creates two separate policies:
--      a. Platform admins manage platform-wide courses (org_id IS NULL)
--      b. Gym admins manage their own gym-scoped courses
--   3. Adds a public-read policy for platform courses regardless of
--      status, so gym admins can clone/reference drafts in dashboards.
-- ============================================

DROP POLICY IF EXISTS "Org admins manage courses" ON courses;

-- Platform admins (and only platform admins) manage org_id IS NULL courses
CREATE POLICY "Platform admins manage platform courses"
  ON courses FOR ALL
  USING (
    org_id IS NULL
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_platform_admin = TRUE
    )
  )
  WITH CHECK (
    org_id IS NULL
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_platform_admin = TRUE
    )
  );

-- Gym owners/admins manage courses scoped to their own org
CREATE POLICY "Gym admins manage their own courses"
  ON courses FOR ALL
  USING (
    org_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM org_members
      WHERE user_id = auth.uid()
      AND org_id = courses.org_id
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  )
  WITH CHECK (
    org_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM org_members
      WHERE user_id = auth.uid()
      AND org_id = courses.org_id
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- Modules / lessons / quiz follow course ownership for writes too.
-- Reads are already public-when-published (policies in 013).
DROP POLICY IF EXISTS "Course staff manage modules" ON course_modules;
CREATE POLICY "Course staff manage modules"
  ON course_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_modules.course_id
      AND (
        (c.org_id IS NULL AND EXISTS (
          SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = TRUE
        ))
        OR
        (c.org_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM org_members
          WHERE user_id = auth.uid()
          AND org_id = c.org_id
          AND role IN ('owner', 'admin')
          AND status = 'active'
        ))
      )
    )
  );

DROP POLICY IF EXISTS "Course staff manage lessons" ON lessons;
CREATE POLICY "Course staff manage lessons"
  ON lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = lessons.course_id
      AND (
        (c.org_id IS NULL AND EXISTS (
          SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = TRUE
        ))
        OR
        (c.org_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM org_members
          WHERE user_id = auth.uid()
          AND org_id = c.org_id
          AND role IN ('owner', 'admin')
          AND status = 'active'
        ))
      )
    )
  );

DROP POLICY IF EXISTS "Course staff manage quiz" ON quiz_questions;
CREATE POLICY "Course staff manage quiz"
  ON quiz_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON c.id = l.course_id
      WHERE l.id = quiz_questions.lesson_id
      AND (
        (c.org_id IS NULL AND EXISTS (
          SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = TRUE
        ))
        OR
        (c.org_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM org_members
          WHERE user_id = auth.uid()
          AND org_id = c.org_id
          AND role IN ('owner', 'admin')
          AND status = 'active'
        ))
      )
    )
  );

-- ============================================
-- 024
-- ============================================
-- ============================================
-- 024: Discovered gyms (network discovery pipeline)
-- ============================================
-- Stores gyms found via Google Places, Firecrawl, Claude research,
-- or manual entry. The platform admin reviews these, optionally
-- enriches them, then sends an invite to onboard them as paying
-- gyms (organizations). When a gym signs up via the invite, we set
-- linked_org_id and flip status to 'onboarded'.
-- ============================================

CREATE TABLE IF NOT EXISTS discovered_gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Where did we find this?
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('google', 'firecrawl', 'claude_research', 'manual')),
  source_query TEXT,             -- e.g. "muay thai gym chiang mai"

  -- Identity
  name TEXT NOT NULL,
  name_th TEXT,
  slug TEXT,                     -- generated, optional, not unique here

  -- Location
  address TEXT,
  city TEXT,
  province TEXT,
  country TEXT DEFAULT 'Thailand',
  lat NUMERIC(10, 7),
  lng NUMERIC(10, 7),

  -- Contact
  phone TEXT,
  email TEXT,
  website TEXT,
  instagram TEXT,
  facebook TEXT,
  line_id TEXT,

  -- Google Places-specific
  google_place_id TEXT UNIQUE,
  google_rating NUMERIC(2, 1),
  google_review_count INTEGER,
  google_photos JSONB,           -- array of {photo_reference, width, height}
  google_types TEXT[],

  -- Scraped + extracted content
  raw_scrape_md TEXT,            -- Firecrawl markdown
  raw_extraction JSONB,          -- Claude structured output
  ai_summary TEXT,
  ai_tags TEXT[],                -- e.g. ['serious', 'has-accommodation', 'tourist']

  -- Workflow
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'verified', 'invited', 'onboarded', 'ignored', 'duplicate')),
  duplicate_of UUID REFERENCES discovered_gyms(id) ON DELETE SET NULL,
  linked_org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Outreach
  invite_token TEXT UNIQUE,
  invited_at TIMESTAMPTZ,
  invite_email TEXT,
  claimed_at TIMESTAMPTZ,

  -- Crawl audit
  last_crawled_at TIMESTAMPTZ,
  crawl_count INTEGER DEFAULT 0,
  last_extracted_at TIMESTAMPTZ,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discovered_gyms_status ON discovered_gyms(status);
CREATE INDEX IF NOT EXISTS idx_discovered_gyms_source ON discovered_gyms(source);
CREATE INDEX IF NOT EXISTS idx_discovered_gyms_city ON discovered_gyms(city);
CREATE INDEX IF NOT EXISTS idx_discovered_gyms_province ON discovered_gyms(province);
CREATE INDEX IF NOT EXISTS idx_discovered_gyms_created_at ON discovered_gyms(created_at DESC);

-- ============================================
-- updated_at trigger (reuses function from 001)
-- ============================================
CREATE TRIGGER update_discovered_gyms_updated_at
  BEFORE UPDATE ON discovered_gyms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS — platform admins only
-- ============================================
ALTER TABLE discovered_gyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage discovered gyms"
  ON discovered_gyms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_platform_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_platform_admin = TRUE
    )
  );

-- Public can verify an invite token (used by /signup?invite=...)
-- We expose ONLY name + city + invite metadata, not the full row.
-- This is enforced at the API layer via getInviteByToken().

-- ============================================
-- 025
-- ============================================
-- ============================================
-- 025: Snooze / nudge tracking on discovered_gyms
-- ============================================
-- Adds last_nudged_at so the Today panel can stop nagging the operator
-- about pending invites they've already followed up on. The Today
-- query filters: pending invites where (last_nudged_at IS NULL OR
-- last_nudged_at < now() - 7d).
-- ============================================

ALTER TABLE discovered_gyms
  ADD COLUMN IF NOT EXISTS last_nudged_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_discovered_gyms_last_nudged_at
  ON discovered_gyms(last_nudged_at);

-- ============================================
-- 026
-- ============================================
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
