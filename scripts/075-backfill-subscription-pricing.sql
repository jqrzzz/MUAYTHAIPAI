-- ============================================
-- 075: Backfill subscription pricing on existing rows
--
-- The signup endpoint historically inserted gym_subscriptions with
-- price_thb=0, and monthly_price_usd_cents had no DB default — so
-- every existing trial subscription was missing both pricing fields.
-- Downstream code (trial countdown, MRR reports, Stripe checkout) has
-- to special-case the null/zero values.
--
-- The signup + platform-admin/gyms code paths now set both pricing
-- fields explicitly from lib/ockock/product.ts. This migration
-- backfills the existing rows so the codebase + DB are consistent.
--
-- Scope: only "standard"-plan trial subs missing pricing. Custom plans
-- or paid subscriptions with their own pricing are untouched.
--
-- Reversible: UPDATE gym_subscriptions SET price_thb = 0,
--   monthly_price_usd_cents = NULL WHERE plan = 'standard';
-- ============================================

UPDATE gym_subscriptions
SET
  price_thb = 999,
  monthly_price_usd_cents = 2900,
  updated_at = now()
WHERE
  plan = 'standard'
  AND (
    price_thb IS NULL OR price_thb = 0
    OR monthly_price_usd_cents IS NULL
  );
