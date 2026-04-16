-- Chat Group Channels — routing table
-- Version: 1.0.0  (Wave 9b: auto-bind first-contact visitors to the right gym)
--
-- Maps (channel, the gym's own account id) → chat_group. On first-contact
-- inbound from an unrecognized sender, the engine looks up the group here
-- and auto-creates a visitor member. Without this table, every unknown
-- sender was dropped.
--
-- external_account_id is the identifier of the gym's receiving account on
-- each channel:
--   line      → LINE OA's userId (webhook payload's top-level `destination`)
--   telegram  → bot user id (numeric, stringified — read from token or env)
--   whatsapp  → phone_number_id from Cloud API value.metadata
--   ig        → Instagram Business account id
--   fb        → Facebook page id
--   test      → arbitrary identifier used by the test adapter
--
-- The UNIQUE (channel, external_account_id) constraint prevents two gyms
-- from accidentally claiming the same inbound account — the DB enforces
-- multi-tenant isolation.

CREATE TABLE mtp_chat_group_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES mtp_chat_groups(id) ON DELETE CASCADE,

  channel TEXT NOT NULL CHECK (channel IN ('line','telegram','whatsapp','ig','fb','web','test')),
  external_account_id TEXT NOT NULL,

  display_label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_inbound_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (channel, external_account_id)
);

CREATE INDEX mtp_chat_group_channels_group_id_idx ON mtp_chat_group_channels (group_id);

ALTER TABLE mtp_chat_group_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org staff can view MTP chat group channels"
  ON mtp_chat_group_channels FOR SELECT
  USING (EXISTS (SELECT 1 FROM mtp_chat_groups cg
                 WHERE cg.id = mtp_chat_group_channels.group_id
                 AND has_org_role(cg.org_id, ARRAY['owner','admin','trainer'])));

CREATE POLICY "Owners and admins can manage MTP chat group channels"
  ON mtp_chat_group_channels FOR ALL
  USING (EXISTS (SELECT 1 FROM mtp_chat_groups cg
                 WHERE cg.id = mtp_chat_group_channels.group_id
                 AND has_org_role(cg.org_id, ARRAY['owner','admin'])));

CREATE POLICY "Platform admins full access to MTP chat group channels"
  ON mtp_chat_group_channels FOR ALL
  USING (is_platform_admin());
