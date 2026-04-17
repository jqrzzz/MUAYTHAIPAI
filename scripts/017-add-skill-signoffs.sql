-- Skill signoffs: trainers check off individual skills before a certificate can be issued.
-- Skills are defined in code (lib/certification-levels.ts) — this table records which
-- ones a trainer has verified for a student at a given level.

CREATE TABLE IF NOT EXISTS skill_signoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level TEXT NOT NULL,             -- e.g. 'naga', 'phayra-nak'
  skill_index INTEGER NOT NULL,    -- index into the skills array for this level
  signed_off_by UUID NOT NULL REFERENCES users(id),  -- trainer who verified
  notes TEXT,                      -- optional trainer comment
  signed_off_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(org_id, student_id, level, skill_index)
);

CREATE INDEX idx_skill_signoffs_student ON skill_signoffs(student_id, level);
CREATE INDEX idx_skill_signoffs_org ON skill_signoffs(org_id, level);

-- Enable RLS
ALTER TABLE skill_signoffs ENABLE ROW LEVEL SECURITY;

-- Staff can manage signoffs for their org
CREATE POLICY skill_signoffs_staff ON skill_signoffs
  USING (org_id IN (
    SELECT om.org_id FROM org_members om
    WHERE om.user_id = auth.uid() AND om.status = 'active'
  ));

-- Certification enrollments: tracks students who have enrolled in a certification program.
-- Links a student to a specific level at a specific gym, tracks their progress.

CREATE TABLE IF NOT EXISTS certification_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  certificate_id UUID REFERENCES certificates(id),  -- linked once cert is issued
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_amount_thb INTEGER,
  booking_id UUID REFERENCES bookings(id),  -- original booking that created this
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(org_id, user_id, level)
);

CREATE INDEX idx_cert_enrollments_user ON certification_enrollments(user_id, status);
CREATE INDEX idx_cert_enrollments_org ON certification_enrollments(org_id, status);

-- Enable RLS
ALTER TABLE certification_enrollments ENABLE ROW LEVEL SECURITY;

-- Staff can manage enrollments for their org
CREATE POLICY cert_enrollments_staff ON certification_enrollments
  USING (org_id IN (
    SELECT om.org_id FROM org_members om
    WHERE om.user_id = auth.uid() AND om.status = 'active'
  ));

-- Students can view their own enrollments
CREATE POLICY cert_enrollments_student ON certification_enrollments
  FOR SELECT USING (user_id = auth.uid());
