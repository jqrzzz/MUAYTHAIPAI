-- ============================================
-- 073: Rename gym display name to "Muay Thai Pai"
--
-- The org has been operating under its public brand "Muay Thai Pai"
-- while carrying the legacy internal name "Wisarut Family Gym."
-- Align the display name with the brand. Affects every place the org
-- name is rendered (admin headers, gym pages, trainer profiles,
-- certificates, emails) — all of which read from organizations.name.
--
-- The slug stays `wisarut-family-gym` because it's referenced as a stable
-- identifier in code (chat widget mount, trainers API, enroll defaults,
-- gym page links). Renaming the slug would have a large blast radius for
-- no functional gain — the slug is an internal identifier; the name is
-- what people see.
--
-- Fully reversible:
--   UPDATE organizations SET name = 'Wisarut Family Gym' WHERE slug = 'wisarut-family-gym';
-- ============================================

UPDATE organizations
SET name = 'Muay Thai Pai',
    updated_at = now()
WHERE slug = 'wisarut-family-gym';
