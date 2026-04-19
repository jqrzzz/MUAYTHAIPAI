-- Student subscriptions for online course content access
-- Modeled after gym_subscriptions but for individual students
CREATE TABLE IF NOT EXISTS student_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'cancelled', 'paused')),

  price_thb INTEGER NOT NULL DEFAULT 299,
  billing_cycle TEXT DEFAULT 'monthly',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,

  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,

  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE student_subscriptions ENABLE ROW LEVEL SECURITY;

-- Students can view and manage their own subscription
CREATE POLICY "Students can view own subscription"
  ON student_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Students can update own subscription"
  ON student_subscriptions FOR UPDATE
  USING (user_id = auth.uid());

-- Platform admins can manage all
CREATE POLICY "Platform admins manage student subscriptions"
  ON student_subscriptions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = true)
  );

-- Service role (webhooks) needs insert
CREATE POLICY "Service role inserts student subscriptions"
  ON student_subscriptions FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_student_subs_user ON student_subscriptions(user_id);
CREATE INDEX idx_student_subs_status ON student_subscriptions(status);
CREATE INDEX idx_student_subs_stripe ON student_subscriptions(stripe_subscription_id);

-- Update courses: certification courses are now subscription-gated, not individually priced
-- Content is included in the monthly subscription, certificates are separate fees
UPDATE courses
SET price_thb = 0, is_free = false
WHERE certificate_level IS NOT NULL;
