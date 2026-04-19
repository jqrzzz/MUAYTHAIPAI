-- Chat / Communication / AI Orchestration Tables
-- Version: 1.0.0  (Wave 8: multi-channel concierge + owner AI foundation)
--
-- Creates new tables only — does NOT ALTER any existing tables.
-- All tables are org-scoped and reuse is_org_member() / has_org_role() /
-- is_platform_admin() helper functions defined in 002-enable-rls.sql.
--
-- All INSERTs on these tables happen server-side via the service role
-- (webhook handlers, chat engine, AI tool calls). No client-side INSERT
-- policies are defined — this is intentional.
--
-- NAMING: All tables are prefixed `mtp_` because this migration targets
-- a shared Supabase project currently co-hosting ScootScoot, ShadowBot,
-- and other Nomadex-AI bootstrapping workloads. The unprefixed names
-- (`chat_groups`, `conversations`, `messages`, `chat_messages`) are
-- already in use by those projects with incompatible schemas. When MTP
-- earns revenue and is moved to its own dedicated project, the `mtp_`
-- prefix can be dropped via a rename migration — at that point there
-- are no collisions to worry about.

-- ============================================
-- 1. MTP_CHAT_GROUPS
-- One identity per gym per messaging surface. An org can have multiple
-- groups (public LINE OA, owner group chat, staff channel, etc.). Every
-- conversation belongs to exactly one group.
-- ============================================
CREATE TABLE IF NOT EXISTS mtp_chat_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('public_inbox', 'owner_assist', 'staff')),
  description TEXT,

  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mtp_chat_groups_org_id_idx ON mtp_chat_groups (org_id);

-- ============================================
-- 2. MTP_CHAT_GROUP_MEMBERS
-- A messaging identity participating in a chat group. Can be anonymous
-- (user_id NULL = random inbound visitor) or bound to a platform user
-- (user_id set = the gym owner, staff, or a returning student).
-- ============================================
CREATE TABLE IF NOT EXISTS mtp_chat_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES mtp_chat_groups(id) ON DELETE CASCADE,

  channel TEXT NOT NULL CHECK (channel IN ('line', 'telegram', 'whatsapp', 'ig', 'fb', 'web', 'test')),
  channel_user_id TEXT NOT NULL,
  channel_chat_id TEXT,

  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'visitor' CHECK (role IN ('owner', 'staff', 'bot', 'visitor')),
  display_name TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (channel, channel_user_id, channel_chat_id)
);

CREATE INDEX IF NOT EXISTS mtp_chat_group_members_group_id_idx ON mtp_chat_group_members (group_id);
CREATE INDEX IF NOT EXISTS mtp_chat_group_members_user_id_idx ON mtp_chat_group_members (user_id) WHERE user_id IS NOT NULL;

-- ============================================
-- 3. MTP_CONVERSATIONS
-- A thread between the gym and one external participant on one channel.
-- First-class row so we don't reconstruct threads from tuples — a known
-- regret from the ScootScoot reference implementation.
-- ============================================
CREATE TABLE IF NOT EXISTS mtp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES mtp_chat_groups(id) ON DELETE CASCADE,

  channel TEXT NOT NULL,
  external_thread_id TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'awaiting_human', 'closed')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  language TEXT,

  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (channel, external_thread_id)
);

CREATE INDEX IF NOT EXISTS mtp_conversations_org_id_idx ON mtp_conversations (org_id);
CREATE INDEX IF NOT EXISTS mtp_conversations_org_status_idx ON mtp_conversations (org_id, status);
CREATE INDEX IF NOT EXISTS mtp_conversations_last_message_at_idx ON mtp_conversations (org_id, last_message_at DESC NULLS LAST);

-- ============================================
-- 4. MTP_COMMUNICATION_LOG
-- Every inbound + outbound message + AI draft across every channel.
-- Single source of truth for the inbox, audit trail, and replay.
-- Drafts live in the same table as real messages, distinguished by
-- draft_status — avoids diverging a separate ai_drafts table from the
-- message log.
-- ============================================
CREATE TABLE IF NOT EXISTS mtp_communication_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES mtp_conversations(id) ON DELETE CASCADE,

  channel TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),

  sender TEXT,
  recipient TEXT,

  body TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,

  handled_by TEXT CHECK (handled_by IN ('ai', 'human') OR handled_by IS NULL),
  needs_review BOOLEAN NOT NULL DEFAULT FALSE,

  draft_status TEXT CHECK (draft_status IN ('pending', 'approved', 'rejected') OR draft_status IS NULL),

  external_message_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mtp_communication_log_conversation_idx ON mtp_communication_log (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS mtp_communication_log_org_review_idx ON mtp_communication_log (org_id) WHERE needs_review = TRUE;
CREATE INDEX IF NOT EXISTS mtp_communication_log_drafts_idx ON mtp_communication_log (org_id, draft_status) WHERE draft_status = 'pending';

-- ============================================
-- 5. MTP_ACTION_TOKENS
-- Signed, time-limited, single-use tokens authorizing a specific action.
-- Used by the owner AI to propose write actions (send-drafted-reply,
-- refund, publish, etc.) that require human confirmation via deeplink
-- into the web console. Never execute from the GET of the deeplink —
-- only from an authenticated POST on the confirm page.
-- ============================================
CREATE TABLE IF NOT EXISTS mtp_action_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  action_type TEXT NOT NULL,
  params JSONB NOT NULL,
  preview TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  consumed_result JSONB,

  proposed_by_conversation UUID REFERENCES mtp_conversations(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS mtp_action_tokens_user_unconsumed_idx ON mtp_action_tokens (user_id, expires_at) WHERE consumed_at IS NULL;

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE mtp_chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE mtp_chat_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE mtp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mtp_communication_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE mtp_action_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================
-- MTP_CHAT_GROUPS POLICIES
-- ============================================
CREATE POLICY "Org staff can view MTP chat groups"
  ON mtp_chat_groups FOR SELECT
  USING (has_org_role(org_id, ARRAY['owner', 'admin', 'trainer']));

CREATE POLICY "Owners and admins can manage MTP chat groups"
  ON mtp_chat_groups FOR ALL
  USING (has_org_role(org_id, ARRAY['owner', 'admin']));

CREATE POLICY "Platform admins full access to MTP chat groups"
  ON mtp_chat_groups FOR ALL
  USING (is_platform_admin());

-- ============================================
-- MTP_CHAT_GROUP_MEMBERS POLICIES
-- ============================================
CREATE POLICY "Org staff can view MTP chat group members"
  ON mtp_chat_group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mtp_chat_groups cg
      WHERE cg.id = mtp_chat_group_members.group_id
      AND has_org_role(cg.org_id, ARRAY['owner', 'admin', 'trainer'])
    )
  );

CREATE POLICY "Owners and admins can manage MTP chat group members"
  ON mtp_chat_group_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM mtp_chat_groups cg
      WHERE cg.id = mtp_chat_group_members.group_id
      AND has_org_role(cg.org_id, ARRAY['owner', 'admin'])
    )
  );

CREATE POLICY "Platform admins full access to MTP chat group members"
  ON mtp_chat_group_members FOR ALL
  USING (is_platform_admin());

-- ============================================
-- MTP_CONVERSATIONS POLICIES
-- ============================================
CREATE POLICY "Org staff can view MTP conversations"
  ON mtp_conversations FOR SELECT
  USING (has_org_role(org_id, ARRAY['owner', 'admin', 'trainer']));

CREATE POLICY "Staff can update MTP conversations"
  ON mtp_conversations FOR UPDATE
  USING (
    has_org_role(org_id, ARRAY['owner', 'admin'])
    OR (has_org_role(org_id, ARRAY['trainer']) AND assigned_to = auth.uid())
  );

CREATE POLICY "Platform admins full access to MTP conversations"
  ON mtp_conversations FOR ALL
  USING (is_platform_admin());

-- ============================================
-- MTP_COMMUNICATION_LOG POLICIES
-- ============================================
CREATE POLICY "Org staff can view MTP communication log"
  ON mtp_communication_log FOR SELECT
  USING (has_org_role(org_id, ARRAY['owner', 'admin', 'trainer']));

CREATE POLICY "Owners and admins can update MTP communication log"
  ON mtp_communication_log FOR UPDATE
  USING (has_org_role(org_id, ARRAY['owner', 'admin']));

CREATE POLICY "Platform admins full access to MTP communication log"
  ON mtp_communication_log FOR ALL
  USING (is_platform_admin());

-- ============================================
-- MTP_ACTION_TOKENS POLICIES
-- The user who the token was issued to can read and update (consume) it.
-- Server-side service role writes all inserts (AI proposes actions).
-- ============================================
CREATE POLICY "Authorized user can view own MTP action tokens"
  ON mtp_action_tokens FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authorized user can consume own MTP action tokens"
  ON mtp_action_tokens FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Platform admins full access to MTP action tokens"
  ON mtp_action_tokens FOR ALL
  USING (is_platform_admin());
