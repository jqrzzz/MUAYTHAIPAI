-- Content Studio: social posts and connected accounts
-- Supports both platform-level and gym-level marketing

-- Social accounts (ready for Pebbler / API connections)
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'youtube', 'x', 'line')),
  account_name TEXT NOT NULL,
  account_id TEXT,
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  connected_by UUID REFERENCES users(id),
  UNIQUE(org_id, platform, account_name)
);

-- Social posts (content calendar)
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  platform TEXT[] DEFAULT '{}',
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'story', 'reel', 'blog', 'email')),
  caption TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}',
  media_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'failed')),
  scheduled_for TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  campaign TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_prompt TEXT,
  engagement_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_social_posts_org ON social_posts(org_id);
CREATE INDEX idx_social_posts_status ON social_posts(status);
CREATE INDEX idx_social_posts_scheduled ON social_posts(scheduled_for) WHERE status = 'scheduled';

-- Platform-level posts (org_id is NULL) for MUAYTHAIPAI's own marketing
-- Gym-level posts have org_id set

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

-- Platform admins can manage all posts
CREATE POLICY "Platform admins manage all posts" ON social_posts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = true)
  );

-- Gym staff manage their own posts
CREATE POLICY "Gym staff manage own posts" ON social_posts
  FOR ALL USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active')
  );

-- Platform admins manage all accounts
CREATE POLICY "Platform admins manage all accounts" ON social_accounts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = true)
  );

-- Gym owners manage their own accounts
CREATE POLICY "Gym owners manage own accounts" ON social_accounts
  FOR ALL USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active')
  );

-- Service role bypass for API operations
CREATE POLICY "Service role bypass posts" ON social_posts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass accounts" ON social_accounts
  FOR ALL USING (auth.role() = 'service_role');
