-- ============================================
-- 036: Trainer commissions + payouts
-- Version: 1.0.0  (Wave 15: industry-standard gym ops — trainer pay)
--
-- Every Muay Thai gym pays trainers a cut of every session they teach.
-- Today: spreadsheets, errors, awkward conversations. This makes it
-- automatic.
--
-- Two tables:
--   trainer_commission_rules — owner sets per-trainer + (optional)
--     per-service rules. "Pong gets 50% of any private session he
--     teaches" or "Khun Joe gets ฿500 flat per group class."
--   trainer_payouts — period-based settlement records. Owner runs a
--     report for a period, clicks "Settle", a row is recorded.
--
-- Computation: on the fly from bookings × rules. We don't snapshot
-- per-booking because rules can be back-applied (effective_from /
-- effective_to). Simpler model, less drift.
-- ============================================

CREATE TABLE IF NOT EXISTS trainer_commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES trainer_profiles(id) ON DELETE CASCADE,

  -- NULL = rule applies to ALL services this trainer teaches.
  -- Specific service_id = rule overrides the default for that service.
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,

  -- 'percent' or 'flat' — which formula to use
  rule_type TEXT NOT NULL CHECK (rule_type IN ('percent', 'flat')),

  -- For rule_type='percent': share of payment_amount_thb (e.g. 50.00 for 50%)
  percent_of_revenue NUMERIC(5,2),
  -- For rule_type='flat': fixed THB per session
  flat_amount_thb INTEGER,

  -- Whether to count only bookings with status='completed'. Most gyms
  -- want this true (trainer didn't earn it if they didn't teach).
  only_completed BOOLEAN NOT NULL DEFAULT TRUE,
  -- Whether to count no-shows (trainer was there waiting; some gyms pay).
  pay_for_no_show BOOLEAN NOT NULL DEFAULT FALSE,

  -- Effective range. effective_to NULL means open-ended.
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,

  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One rule per (trainer, service) pair at any time. service_id NULL
  -- is the trainer's "default" rule.
  UNIQUE (org_id, trainer_id, service_id, effective_from)
);

CREATE INDEX IF NOT EXISTS trainer_commission_rules_org_trainer_idx
  ON trainer_commission_rules (org_id, trainer_id) WHERE is_active = TRUE;

ALTER TABLE trainer_commission_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners + admins manage commission rules"
  ON trainer_commission_rules FOR ALL
  USING (has_org_role(org_id, ARRAY['owner','admin']))
  WITH CHECK (has_org_role(org_id, ARRAY['owner','admin']));

CREATE POLICY "Trainers read their own commission rules"
  ON trainer_commission_rules FOR SELECT
  USING (
    has_org_role(org_id, ARRAY['trainer'])
    AND trainer_id IN (
      SELECT id FROM trainer_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Platform admins full access commission rules"
  ON trainer_commission_rules FOR ALL
  USING (is_platform_admin());

CREATE TRIGGER trainer_commission_rules_updated_at
  BEFORE UPDATE ON trainer_commission_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── payouts: period-based settlement records ───

CREATE TABLE IF NOT EXISTS trainer_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES trainer_profiles(id) ON DELETE CASCADE,

  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Snapshot of what we computed at settle time
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_amount_thb INTEGER NOT NULL DEFAULT 0,

  -- Optional breakdown — JSON array of {booking_id, service, amount}
  -- so trainers can verify what they got paid for.
  breakdown JSONB,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled')),
  paid_at TIMESTAMPTZ,
  payment_method TEXT CHECK (payment_method IN ('cash','bank_transfer','other')),
  notes TEXT,

  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trainer_payouts_org_idx ON trainer_payouts (org_id, period_end DESC);
CREATE INDEX IF NOT EXISTS trainer_payouts_trainer_idx ON trainer_payouts (trainer_id, period_end DESC);

ALTER TABLE trainer_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners + admins manage payouts"
  ON trainer_payouts FOR ALL
  USING (has_org_role(org_id, ARRAY['owner','admin']))
  WITH CHECK (has_org_role(org_id, ARRAY['owner','admin']));

CREATE POLICY "Trainers read their own payouts"
  ON trainer_payouts FOR SELECT
  USING (
    has_org_role(org_id, ARRAY['trainer'])
    AND trainer_id IN (
      SELECT id FROM trainer_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Platform admins full access payouts"
  ON trainer_payouts FOR ALL
  USING (is_platform_admin());

CREATE TRIGGER trainer_payouts_updated_at
  BEFORE UPDATE ON trainer_payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE trainer_commission_rules IS
  'Per-trainer commission rules. service_id NULL = applies to all the trainer''s sessions.';
COMMENT ON TABLE trainer_payouts IS
  'Period-based payout settlements. Snapshot of computed commission at settle time.';
