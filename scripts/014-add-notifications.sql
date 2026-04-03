-- 014: Add gym notifications system
-- In-app notification alerts for gym staff + expanded notification preferences

-- Notifications table for in-app alerts
CREATE TABLE IF NOT EXISTS gym_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'new_booking', 'cancellation', 'payment_received', 'contact_form'
  title text NOT NULL,
  body text NOT NULL,
  metadata jsonb DEFAULT '{}', -- booking_id, customer name, amount, etc.
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_org_unread ON gym_notifications(org_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_org_recent ON gym_notifications(org_id, created_at DESC);

-- Add new notification preference columns to org_settings
-- (notify_on_booking_email and notification_email already exist)
ALTER TABLE org_settings
  ADD COLUMN IF NOT EXISTS notify_on_cancellation boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_on_payment boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_emails text[] DEFAULT '{}';

-- notification_emails stores multiple recipient emails as an array
-- The existing notification_email (singular) becomes the primary,
-- notification_emails stores additional recipients

-- Enable RLS
ALTER TABLE gym_notifications ENABLE ROW LEVEL SECURITY;

-- RLS: org members can read their org's notifications
CREATE POLICY "Org members can view notifications"
  ON gym_notifications FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS: org admins/owners can update (mark read) and delete
CREATE POLICY "Org admins can update notifications"
  ON gym_notifications FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can delete notifications"
  ON gym_notifications FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
    )
  );

-- Service role can insert (API routes use service role)
CREATE POLICY "Service role can insert notifications"
  ON gym_notifications FOR INSERT
  WITH CHECK (true);
