-- ============================================
-- 041: Support tickets — operator <→ gym communication
-- Version: 1.0.0  (Wave 20: customer service surface)
--
-- Today gym admins have NO way to reach the platform operator. They
-- email and it disappears. This adds a structured ticketing layer:
--   - "Contact support" button in /admin opens a quick form
--   - Submission creates a support_tickets row + a conversation thread
--   - AI auto-categorizes (billing/setup/feature/bug/urgent/other) and
--     auto-drafts a first reply using platform context
--   - Platform admin sees the ticket queue in /platform-admin → Support
--     sorted by SLA risk, approves/edits the AI draft
--
-- Why a separate support_tickets table on top of mtp_communication_log?
--   - Tickets need workflow metadata (status, priority, SLA, resolved_by)
--     that doesn't belong on individual messages
--   - mtp_communication_log already handles the messaging — no duplication
--   - One ticket → one conversation, but conversation can have many messages
--
-- Priority drives SLA:
--   urgent  → 1h  (bookings broken, payment failing, data loss)
--   high    → 6h  (something not working but not blocking revenue)
--   normal  → 24h (default — most setup questions, feature asks)
--   low     → 72h (nice-to-have, no rush)
-- ============================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  -- Link to the conversation in mtp_conversations that holds the
  -- back-and-forth messages (NULL allowed because we create the
  -- conversation in the same transaction and may roll back).
  conversation_id UUID REFERENCES mtp_conversations(id) ON DELETE SET NULL,

  -- What the gym admin typed in the form
  subject TEXT NOT NULL,
  initial_body TEXT NOT NULL,
  -- Where in the app they were when they hit the button (for context)
  source_url TEXT,

  -- AI-set on creation. Operator can override.
  category TEXT CHECK (category IN ('billing','setup','feature','bug','urgent','other')) DEFAULT 'other',
  priority TEXT CHECK (priority IN ('low','normal','high','urgent')) DEFAULT 'normal',
  ai_summary TEXT,

  -- Workflow
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_progress','waiting_customer','resolved','closed')),
  -- SLA target — computed from priority at creation, but stored so we
  -- can render "X hours overdue" without recomputing per render.
  sla_due_at TIMESTAMPTZ,

  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_summary TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS support_tickets_status_sla_idx
  ON support_tickets (status, sla_due_at)
  WHERE status IN ('open','in_progress','waiting_customer');
CREATE INDEX IF NOT EXISTS support_tickets_org_idx
  ON support_tickets (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_priority_idx
  ON support_tickets (priority, status)
  WHERE priority IN ('urgent','high');

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Owners + admins create + read their own tickets
CREATE POLICY "Org admins create + read their tickets"
  ON support_tickets FOR ALL
  USING (has_org_role(org_id, ARRAY['owner','admin']))
  WITH CHECK (has_org_role(org_id, ARRAY['owner','admin']));

-- Platform admins see + manage everything
CREATE POLICY "Platform admins full access tickets"
  ON support_tickets FOR ALL
  USING (is_platform_admin());

CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE support_tickets IS
  'Gym admin → platform operator support requests. Workflow metadata; messages live in mtp_communication_log via conversation_id.';
