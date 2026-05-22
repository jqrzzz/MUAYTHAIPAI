-- ============================================
-- 070: Payment collection audit
--
-- Records WHO collected a booking's payment and WHEN, so cash can be
-- reconciled. The amount itself stays in the existing payment_amount_thb
-- column (now editable at collection time for discounts), so this only
-- adds the audit trail.
--
-- Both columns are nullable and written best-effort by the booking PATCH
-- endpoint, so the app keeps working whether or not this migration has
-- been applied yet.
-- ============================================

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_collected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_collected_by UUID REFERENCES users(id);

COMMENT ON COLUMN bookings.payment_collected_at IS
  'When a staff member recorded payment as collected (cash/transfer). NULL = not collected, or paid online.';
COMMENT ON COLUMN bookings.payment_collected_by IS
  'Staff user who recorded the payment. NULL for online/auto payments.';
