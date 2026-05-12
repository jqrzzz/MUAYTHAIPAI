-- ============================================
-- 040: Subscription revenue tracking
-- Version: 1.0.0  (Wave 19: MRR dashboard)
--
-- Subscriptions are the primary revenue stream — the $29/mo per gym
-- that pays for everything else. Today we know whether a sub is
-- active/trial/past_due/cancelled, but NOT:
--   - what price they're on (gym_subscriptions.price_thb stays 0)
--   - when they activated (for cohort analysis)
--   - when they cancelled (for churn tracking)
--   - their invoice history (for real MRR over time)
--
-- This migration adds the columns we need on the existing gym_subscriptions
-- row, plus a new gym_subscription_invoices table that the webhook
-- writes to on every invoice.paid event. That gives us:
--   - Point-in-time MRR (sum of active × current price)
--   - Historical revenue (sum of paid invoices)
--   - Churn rate (cancellations in period / active at period start)
--   - Trial conversion rate (trials → active / trials started)
-- ============================================

-- ─── 1. New columns on gym_subscriptions ───────────────────────────
ALTER TABLE gym_subscriptions
  -- The monthly price in USD cents at activation. Lets us tier later
  -- (Starter $19, Growth $29, Pro $79) without breaking historical MRR.
  ADD COLUMN IF NOT EXISTS monthly_price_usd_cents INTEGER,
  -- When the subscription first went 'active'. Useful for cohort
  -- analysis (how many trials from May converted?).
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
  -- When the subscription was cancelled. NULL while active.
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  -- Plan name for future tiering (Starter/Growth/Pro). Default 'standard'
  -- so existing rows have a useful value.
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'standard';

CREATE INDEX IF NOT EXISTS gym_subscriptions_status_idx
  ON gym_subscriptions (status);
CREATE INDEX IF NOT EXISTS gym_subscriptions_activated_at_idx
  ON gym_subscriptions (activated_at DESC NULLS LAST)
  WHERE activated_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS gym_subscriptions_cancelled_at_idx
  ON gym_subscriptions (cancelled_at DESC NULLS LAST)
  WHERE cancelled_at IS NOT NULL;

COMMENT ON COLUMN gym_subscriptions.monthly_price_usd_cents IS
  'Monthly price in USD cents at activation. NULL = legacy/trial.';
COMMENT ON COLUMN gym_subscriptions.activated_at IS
  'When status first transitioned to active. Used for cohort + MRR-at-activation.';
COMMENT ON COLUMN gym_subscriptions.cancelled_at IS
  'When the subscription was cancelled. NULL = still active or trial.';

-- ─── 2. Invoice history ────────────────────────────────────────────
-- One row per successful subscription payment. Lets us answer "how
-- much subscription revenue did we collect in May?" without depending
-- on Stripe being online.
CREATE TABLE IF NOT EXISTS gym_subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  gym_subscription_id UUID REFERENCES gym_subscriptions(id) ON DELETE SET NULL,

  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_charge_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_balance_transaction_id TEXT,

  amount_paid_usd_cents INTEGER NOT NULL,
  amount_due_usd_cents INTEGER,
  fee_usd_cents INTEGER,
  net_usd_cents INTEGER,

  -- 'paid' is the only one we currently record, but having the column
  -- lets us track 'open', 'past_due', 'void' if we add more handlers.
  status TEXT NOT NULL DEFAULT 'paid',

  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,

  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gym_subscription_invoices_org_idx
  ON gym_subscription_invoices (org_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS gym_subscription_invoices_paid_at_idx
  ON gym_subscription_invoices (paid_at DESC);

ALTER TABLE gym_subscription_invoices ENABLE ROW LEVEL SECURITY;

-- Only platform admins read invoice history (sensitive financial data)
CREATE POLICY "Platform admins read subscription invoices"
  ON gym_subscription_invoices FOR ALL
  USING (is_platform_admin());

-- Owners can read their own gym's invoices (for self-serve billing later)
CREATE POLICY "Owners read their gym's invoices"
  ON gym_subscription_invoices FOR SELECT
  USING (has_org_role(org_id, ARRAY['owner']));

COMMENT ON TABLE gym_subscription_invoices IS
  'One row per successful gym subscription payment. Source of truth for historical MRR.';
