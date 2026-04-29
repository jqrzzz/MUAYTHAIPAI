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
