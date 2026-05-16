-- =====================================================
-- 063-ticket-reminder-tracking
-- =====================================================
-- Adds per-order tracking for the event-reminder email so the
-- /api/cron/event-reminders job can be idempotent — if Vercel
-- retries the cron or runs it twice in a 30h window we don't
-- double-email the buyer.
--
-- Reminder lands ~24h before the event. The cron finds events
-- with event_date = (today + 1) and queries ticket_orders where
--   payment_status = 'paid'
--   AND status = 'confirmed'
--   AND reminder_sent_at IS NULL
-- Sends + stamps reminder_sent_at on success. Failures stay NULL
-- so the next run retries.

ALTER TABLE public.ticket_orders
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.ticket_orders.reminder_sent_at IS
  'When the 24h-before reminder email was sent for this order. NULL = not yet sent. Used by the event-reminders cron for idempotency.';

-- Index supports the cron's WHERE clause without a full scan as
-- ticket_orders grows.
CREATE INDEX IF NOT EXISTS ticket_orders_reminder_pending_idx
  ON public.ticket_orders (event_id)
  WHERE reminder_sent_at IS NULL
    AND payment_status = 'paid'
    AND status = 'confirmed';
