-- =====================================================
-- 060-ticket-scanning
-- =====================================================
-- Adds the columns the door-scanning endpoint needs to mark a ticket
-- as redeemed and surface duplicate-scan attempts. Doesn't gate any
-- existing flow — the scan page degrades to a no-op pre-migration.

ALTER TABLE ticket_orders
  ADD COLUMN IF NOT EXISTS scanned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scanned_by_user_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS scan_count INTEGER NOT NULL DEFAULT 0;

-- Door staff can scan the same QR multiple times by accident — we
-- record every attempt count but only `scanned_at` (the first hit) is
-- the canonical "this ticket was redeemed at this time" timestamp.

-- Fast lookup by order reference when scanning at the door.
CREATE INDEX IF NOT EXISTS ticket_orders_reference_idx
  ON ticket_orders (order_reference)
  WHERE order_reference IS NOT NULL;

COMMENT ON COLUMN ticket_orders.scanned_at IS
  'When the ticket was first scanned at the door. NULL = not yet redeemed.';
COMMENT ON COLUMN ticket_orders.scan_count IS
  'Total scan attempts. >1 means the same ticket was presented multiple times.';
