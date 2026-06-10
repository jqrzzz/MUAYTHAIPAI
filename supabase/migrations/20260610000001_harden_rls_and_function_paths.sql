-- Hardening pass driven by the live Supabase security advisors (2026-06-10).
--
-- PART 1 — drop four "always true" INSERT policies.
--
-- Each was named as if it scoped the service role, but was actually created
-- for roles={public}/{anon,authenticated} with WITH CHECK (true) — i.e. it
-- let ANY anonymous REST client insert rows directly, bypassing the API
-- routes' rate limits and validation. The service role does not need a
-- policy at all (it bypasses RLS), and every legitimate writer of these
-- tables was verified to use the service client:
--   gym_notifications     → lib/notifications.ts (service)         [spam into a gym's admin inbox]
--   student_subscriptions → no app writer at all                   [forge a subscription for any user]
--   activity_logs         → no app writer at all                   [forge audit rows]
--   ticket_interest       → public notify route (service client,   [skip its rate limit + honeypot]
--                           rate-limited, honeypot, email-validated)
-- The remaining scoped SELECT/UPDATE/DELETE policies on these tables are
-- untouched, so admin/student/promoter reads keep working.

drop policy if exists "Service role can insert notifications" on public.gym_notifications;
drop policy if exists "Service role inserts student subscriptions" on public.student_subscriptions;
drop policy if exists "Insert activity logs" on public.activity_logs;
drop policy if exists "ticket_interest_public_insert" on public.ticket_interest;

-- PART 2 — pin search_path on the functions this repo owns.
--
-- Advisor: function_search_path_mutable. A role-mutable search_path lets a
-- caller's session influence name resolution inside SECURITY DEFINER
-- functions (classic privilege-escalation vector). Pinning to `public`
-- preserves today's exact resolution while closing the vector. Only the
-- functions created by this repo's scripts/ are touched — the database is
-- shared with other apps whose functions are theirs to fix.

alter function public.is_org_member(uuid) set search_path = public;
alter function public.has_org_role(uuid, text[]) set search_path = public;
alter function public.is_platform_admin() set search_path = public;
alter function public.handle_new_user() set search_path = public;
alter function public.update_updated_at_column() set search_path = public;
alter function public.update_course_updated_at() set search_path = public;
alter function public.bout_invitations_set_updated_at() set search_path = public;
alter function public.set_skill_submissions_updated_at() set search_path = public;
alter function public.ticket_interest_set_email_lower() set search_path = public;
