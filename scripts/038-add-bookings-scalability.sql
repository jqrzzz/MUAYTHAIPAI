-- ============================================
-- 038: Bookings — scalability + Stripe traceability
-- Version: 1.0.0  (Wave 17: platform-admin bookings dashboard)
--
-- Three small adds, no breaking changes:
--   1. (org_id, booking_date) index so the bookings dashboard period
--      queries stay fast as we grow from 1 gym to 50+ gyms.
--   2. stripe_charge_id — separate from payment_intent_id, helps when
--      reconciling against the Stripe Dashboard (Charges page).
--   3. stripe_application_fee_amount + stripe_account_id — Stripe
--      Connect "direct charge" mode where money lands in the gym's
--      Stripe account and we take an application fee. Today everything
--      routes through the platform account, but having the columns
--      ready means switching modes is a flip, not a migration.
--
-- No data backfill needed. Existing bookings stay valid.
-- ============================================

CREATE INDEX IF NOT EXISTS bookings_org_date_idx
  ON bookings (org_id, booking_date DESC);

CREATE INDEX IF NOT EXISTS bookings_payment_status_idx
  ON bookings (org_id, payment_status)
  WHERE payment_status IN ('paid', 'pending');

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_application_fee_amount INTEGER,
  ADD COLUMN IF NOT EXISTS stripe_destination_account_id TEXT;

CREATE INDEX IF NOT EXISTS bookings_stripe_charge_idx
  ON bookings (stripe_charge_id) WHERE stripe_charge_id IS NOT NULL;

COMMENT ON COLUMN bookings.stripe_charge_id IS
  'Stripe Charge ID (ch_...). Separate from payment_intent for Dashboard cross-reference.';
COMMENT ON COLUMN bookings.stripe_application_fee_amount IS
  'Cents. Set when using Stripe Connect direct charges — what the platform takes.';
COMMENT ON COLUMN bookings.stripe_destination_account_id IS
  'Stripe Connect destination (acct_...). NULL = money landed in the platform account.';
