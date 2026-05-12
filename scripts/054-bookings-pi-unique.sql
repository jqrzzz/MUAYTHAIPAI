-- ============================================
-- 054: Unique payment intent on bookings (webhook idempotency)
-- Version: 1.0.0
--
-- The Stripe webhook today does a naked `INSERT INTO bookings` on
-- both `payment_intent.succeeded` AND `checkout.session.completed` —
-- two events that fire for the SAME successful checkout. Stripe also
-- retries failed deliveries aggressively (up to 3 days). Either path
-- creates duplicate rows + duplicate emails.
--
-- This partial unique index makes the data layer enforce
-- "one booking per Stripe payment intent". The webhook is refactored
-- in the same commit to upsert with ON CONFLICT DO NOTHING and skip
-- the email send when the row already existed.
--
-- Partial (WHERE NOT NULL) so guest/cash bookings — the majority —
-- don't get squeezed through a single-value uniqueness scope.
--
-- A pre-check confirmed no existing duplicates in production, so
-- creating the index is safe without a cleanup pass.
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS bookings_stripe_payment_intent_unique
  ON bookings (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
