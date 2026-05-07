-- Gym packages — sellable bundles of credits
-- Version: 1.0.0  (Wave 12: industry-standard gym SaaS — packages)
--
-- Up until now, student_credits rows were created ad-hoc by gym admins
-- via the "Add Credits" dialog. That works but doesn't scale: every
-- gym wants a catalog of named packages they sell ("10-class pack",
-- "1-month unlimited"), and every student wants to see what they
-- bought. This migration adds the catalog table and links student_credits
-- back to its originating package so we can show "Anna · 10-class pack
-- (4/10 left, expires Mar 12)" on her profile.
--
-- We DON'T introduce a new student_packages table. The existing
-- student_credits row IS the instance — credit_count, expires_at,
-- credit_type, credits_remaining are already on student_credits. We
-- just add a foreign key from student_credits → gym_packages and a
-- "via_package" stamp on the credit_transactions row that recorded
-- the purchase.

CREATE TABLE IF NOT EXISTS gym_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Catalog identity
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,

  -- Pricing
  price_thb INTEGER NOT NULL,
  price_usd INTEGER,

  -- Bundle definition. credit_count = NULL means "unlimited within
  -- the duration window" (e.g. monthly unlimited). credit_count > 0
  -- means a fixed pack (e.g. 10-class pack).
  credit_type TEXT NOT NULL DEFAULT 'sessions',
  credit_count INTEGER,
  duration_days INTEGER,

  -- Lifecycle
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gym_packages_org_id_idx ON gym_packages (org_id);
CREATE INDEX IF NOT EXISTS gym_packages_active_idx ON gym_packages (org_id, is_active) WHERE is_active = TRUE;

-- Foreign-key from student_credits → the package they originated from.
-- Nullable for legacy ad-hoc credits that pre-date the catalog.
ALTER TABLE student_credits
  ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES gym_packages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS student_credits_package_id_idx
  ON student_credits (package_id) WHERE package_id IS NOT NULL;

ALTER TABLE gym_packages ENABLE ROW LEVEL SECURITY;

-- Public can read active packages (used by the gym's public page if we
-- ever want to show pricing publicly). Owners + admins of the gym can
-- write. Trainers cannot manage the catalog.
CREATE POLICY "Anyone can read active gym packages"
  ON gym_packages FOR SELECT
  USING (is_active = TRUE OR has_org_role(org_id, ARRAY['owner','admin']));

CREATE POLICY "Gym owners/admins manage their packages"
  ON gym_packages FOR ALL
  USING (has_org_role(org_id, ARRAY['owner','admin']))
  WITH CHECK (has_org_role(org_id, ARRAY['owner','admin']));

CREATE POLICY "Platform admins full access to gym packages"
  ON gym_packages FOR ALL
  USING (is_platform_admin());

CREATE TRIGGER gym_packages_updated_at
  BEFORE UPDATE ON gym_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE gym_packages IS
  'Catalog of credit bundles each gym sells (e.g. "10-class pack", "1-month unlimited"). Selling a package creates a student_credits row with package_id set.';
COMMENT ON COLUMN gym_packages.credit_count IS
  'Number of credits in the bundle. NULL = unlimited within duration_days window.';
COMMENT ON COLUMN gym_packages.duration_days IS
  'How long credits stay valid after purchase. NULL = no expiry.';
