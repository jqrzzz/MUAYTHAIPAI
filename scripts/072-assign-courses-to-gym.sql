-- ============================================
-- 072: Assign Naga-Garuda courses to Muay Thai Pai
--
-- These 5 courses were created as platform-owned templates (org_id=NULL).
-- With one real gym today, the simpler model is: the gym owns the
-- curriculum and edits it from /admin -> Gym courses. The schema already
-- supports gym-scoped courses cleanly, so if a second gym ever joins,
-- OckOck can grow a "copy curriculum from another gym" feature without
-- needing to restructure anything.
--
-- Targets by slug (stable identifier), and looks up org_id via slug so
-- there's no hardcoded UUID. Touches only the 5 known courses; any other
-- platform-owned courses (none today) are left alone.
--
-- Fully reversible:
--   UPDATE courses SET org_id = NULL WHERE slug IN (...);
-- ============================================

UPDATE courses
SET org_id = (SELECT id FROM organizations WHERE slug = 'wisarut-family-gym'),
    updated_at = now()
WHERE slug IN (
  'naga-certification',
  'phayra-nak-certification',
  'singha-certification',
  'hanuman-certification',
  'garuda-certification'
);
