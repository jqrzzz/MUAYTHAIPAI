-- Index foreign keys on the core transactional tables.
--
-- From the live performance advisors (2026-06-10): these FK columns had no
-- covering index. Two costs of that, both of which bite as the network grows:
--   1. Cascade deletes / FK checks do a sequential scan of the child table.
--      Deleting an org cascades into bookings, certificates, skill_signoffs,
--      etc. — each unindexed FK turns that into a full scan.
--   2. Joins and "find by parent" lookups (the app does many: a trainer's
--      payouts, a booking's transactions, a conversation's ticket) scan
--      instead of seeking.
--
-- Scope: only the core, growth-bound tables (transactions, certs, payouts,
-- bookings, support). The advisor flagged ~135 unindexed FKs across the whole
-- (multi-app) database; the rest are on empty/peripheral tables where the
-- write-cost of an index isn't yet justified — deferred to docs/PERFORMANCE.md.
--
-- All idempotent. Plain CREATE INDEX (not CONCURRENTLY) is fine at current
-- table sizes; if any of these grows to millions of rows before this runs,
-- switch that one to CONCURRENTLY (outside a txn).

-- bookings
create index if not exists idx_bookings_trainer_id on public.bookings (trainer_id);
create index if not exists idx_bookings_payment_collected_by on public.bookings (payment_collected_by);

-- certificates & enrollments
create index if not exists idx_certificates_issued_by on public.certificates (issued_by);
create index if not exists idx_certification_enrollments_booking_id on public.certification_enrollments (booking_id);
create index if not exists idx_certification_enrollments_certificate_id on public.certification_enrollments (certificate_id);

-- skill sign-offs & submissions
create index if not exists idx_skill_signoffs_signed_off_by on public.skill_signoffs (signed_off_by);
create index if not exists idx_skill_submissions_reviewer_id on public.skill_submissions (reviewer_id);

-- credits & transactions
create index if not exists idx_credit_transactions_booking_id on public.credit_transactions (booking_id);
create index if not exists idx_credit_transactions_recorded_by on public.credit_transactions (recorded_by);
create index if not exists idx_credit_transactions_student_credit_id on public.credit_transactions (student_credit_id);

-- payouts & payments
create index if not exists idx_gym_payouts_paid_by on public.gym_payouts (paid_by);
create index if not exists idx_trainer_payouts_created_by on public.trainer_payouts (created_by);
create index if not exists idx_trainer_commission_rules_trainer_id on public.trainer_commission_rules (trainer_id);
create index if not exists idx_trainer_commission_rules_service_id on public.trainer_commission_rules (service_id);
create index if not exists idx_payments_user_id on public.payments (user_id);
create index if not exists idx_gym_subscription_invoices_gym_subscription_id on public.gym_subscription_invoices (gym_subscription_id);

-- courses
create index if not exists idx_lesson_progress_lesson_id on public.lesson_progress (lesson_id);

-- student notes
create index if not exists idx_student_notes_booking_id on public.student_notes (booking_id);
create index if not exists idx_student_notes_trainer_id on public.student_notes (trainer_id);

-- inbox / support
create index if not exists idx_mtp_conversations_assigned_to on public.mtp_conversations (assigned_to);
create index if not exists idx_mtp_conversations_group_id on public.mtp_conversations (group_id);
create index if not exists idx_support_tickets_conversation_id on public.support_tickets (conversation_id);
create index if not exists idx_support_tickets_resolved_by on public.support_tickets (resolved_by);
create index if not exists idx_support_tickets_user_id on public.support_tickets (user_id);

-- marketing / fights
create index if not exists idx_social_posts_created_by on public.social_posts (created_by);
create index if not exists idx_campaigns_created_by on public.campaigns (created_by);
create index if not exists idx_event_bouts_winner_id on public.event_bouts (winner_id);
create index if not exists idx_ticket_orders_scanned_by_user_id on public.ticket_orders (scanned_by_user_id);
