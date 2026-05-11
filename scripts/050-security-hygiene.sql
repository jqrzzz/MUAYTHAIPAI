-- ============================================
-- 050: Security hygiene
-- Version: 1.0.0  (post-launch lints from supabase advisors)
--
-- Two fixes, both surfaced by `supabase__get_advisors security`:
--
-- 1. function_search_path_mutable
--    Twelve of our SQL functions don't pin search_path. Without it, a
--    function called from a session with a shadow schema on the path
--    can resolve to attacker-controlled tables/functions. Industry
--    practice is `SET search_path = public, pg_temp` on every function.
--
--    The other functions in `public` (sc_*, northcrest_*, expire_*,
--    nearby_rider_ids) belong to a separate product sharing this
--    database — intentionally left for that team to handle.
--
-- 2. public_bucket_allows_listing on `skill-submissions`
--    The SELECT policy I shipped in 049 allowed any client to call the
--    Storage `list()` API and enumerate every file in the bucket. We
--    only need direct URL access (which a `public=TRUE` bucket gives
--    for free without any SELECT policy). Dropping the policy removes
--    the listing path while keeping the URL-based playback that the
--    verify/passport/admin-review surfaces depend on.
-- ============================================

-- ─── 1. Pin search_path on our functions ─────────────────────────────
ALTER FUNCTION public.handle_new_user()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.has_org_role(UUID, TEXT[])
  SET search_path = public, pg_temp;
ALTER FUNCTION public.is_org_member(UUID)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.is_platform_admin()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.make_wisarut_owner()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.generate_booking_number()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.set_booking_number()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_transaction_number()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.set_transaction_number()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.set_skill_submissions_updated_at()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.update_course_updated_at()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at_column()
  SET search_path = public, pg_temp;

-- ─── 2. Drop the listing-permissive SELECT policy ────────────────────
-- The bucket is still public=TRUE, so direct object URLs continue to
-- work. We just remove the ability to enumerate the bucket via list().
DROP POLICY IF EXISTS "skill submissions public read" ON storage.objects;
