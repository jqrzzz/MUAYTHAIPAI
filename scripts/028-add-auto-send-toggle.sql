-- Auto-send toggle for concierge AI replies on DM channels.
-- Version: 1.0.0  (Wave 9d: graduated trust on DM channels)
--
-- The web concierge auto-sends replies — visitors expect immediate
-- responses on a website chat widget. DM channels (LINE, WhatsApp, IG,
-- FB, Telegram) need more caution by default: a wrong reply on the
-- gym's official LINE OA carries weight.
--
-- This column lets an owner opt INTO auto-replies on each DM channel
-- once they trust OckOck. Default FALSE. UI surfaces a toggle per
-- channel; the engine routes the AI's reply to draft_status='pending'
-- when false (showing in the inbox for owner approval) and sends
-- immediately when true.

ALTER TABLE mtp_channel_credentials
  ADD COLUMN IF NOT EXISTS auto_send_enabled BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN mtp_channel_credentials.auto_send_enabled IS
  'When TRUE, OckOck sends concierge AI replies on this channel without owner approval. When FALSE (default for DM channels), AI replies are saved as pending drafts for the owner to approve via the inbox.';
