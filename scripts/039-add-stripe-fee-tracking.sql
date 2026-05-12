-- ============================================
-- 039: Stripe fee + refund tracking on bookings
-- Version: 1.0.0  (Wave 18: clean accounting truth)
--
-- Today the dashboard records gross USD per booking, but the real money
-- that nets to the platform Stripe balance is gross MINUS Stripe's
-- processing fee (~2.9% + $0.30). At any meaningful scale this misleads
-- the operator by 30-60% on real take.
--
-- Two new pieces:
--   1. Per-booking fee/net snapshot captured by the webhook from
--      Stripe's BalanceTransaction. That's the ground truth — what
--      Stripe actually deducted and what landed in our balance.
--   2. Refund sync — when a refund happens (via dashboard OR API) we
--      record the refund timestamp + amount so the breakdown reflects
--      reality, not stale state.
--
-- All amounts in CENTS (matches the rest of the bookings table's USD
-- semantics). NULL = "not captured" — historical bookings will have
-- NULL until backfilled (separate one-off script, not in this commit).
-- ============================================

ALTER TABLE bookings
  -- What Stripe charged us in fees for this PaymentIntent's charge.
  -- Pulled from balance_transaction.fee on the charge.
  ADD COLUMN IF NOT EXISTS stripe_fee_cents INTEGER,
  -- What landed in our Stripe balance after fees (gross - fee).
  -- Pulled from balance_transaction.net. Stored separately so reports
  -- don't have to recompute and we can audit Stripe's math.
  ADD COLUMN IF NOT EXISTS stripe_net_cents INTEGER,
  -- BalanceTransaction ID (txn_...) for full audit + Stripe Dashboard
  -- cross-reference. Pairs with stripe_charge_id from migration 038.
  ADD COLUMN IF NOT EXISTS stripe_balance_transaction_id TEXT,
  -- Refund tracking. amount in cents (USD), nullable.
  ADD COLUMN IF NOT EXISTS refunded_amount_cents INTEGER,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS bookings_balance_tx_idx
  ON bookings (stripe_balance_transaction_id)
  WHERE stripe_balance_transaction_id IS NOT NULL;

COMMENT ON COLUMN bookings.stripe_fee_cents IS
  'Stripe processing fee in USD cents. NULL = not yet captured (pre-migration bookings).';
COMMENT ON COLUMN bookings.stripe_net_cents IS
  'Real amount that landed in our Stripe balance, in USD cents (gross minus fee).';
COMMENT ON COLUMN bookings.stripe_balance_transaction_id IS
  'Stripe BalanceTransaction ID (txn_...) — the canonical source for what Stripe actually moved.';
COMMENT ON COLUMN bookings.refunded_amount_cents IS
  'Amount refunded in USD cents. Set by the charge.refunded webhook.';
