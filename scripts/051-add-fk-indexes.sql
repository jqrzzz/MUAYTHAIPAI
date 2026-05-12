-- ============================================
-- 051: Foreign-key indexes (perf advisor pass)
-- Version: 1.0.0
--
-- Postgres does NOT auto-create an index on the referencing column of
-- a foreign key. Without one, joins against the parent and cascading
-- deletes do sequential scans — fine on a 10-row dev table, painful at
-- scale. `supabase__get_advisors performance` flagged 98 unindexed FKs
-- in this database; this migration covers the ~50 that belong to
-- MUAYTHAIPAI's tables.
--
-- Skipped (belong to a separate product sharing the database):
--   northcrest_*, ride_*, ota_message_drafts, shadow_*,
--   chat_passport_drafts, chat_ota_drafts, chat_messages,
--   property_link_tokens.
--
-- Each index uses IF NOT EXISTS — re-runs are safe; if anyone has
-- manually added one of these the migration just skips it.
-- ============================================

-- ─── Audit + activity logs ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);

-- ─── Blacklist + community safety ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_blacklist_added_by_org_id ON blacklist(added_by_org_id);
CREATE INDEX IF NOT EXISTS idx_blacklist_added_by_user_id ON blacklist(added_by_user_id);
CREATE INDEX IF NOT EXISTS idx_blacklist_comments_org_id ON blacklist_comments(org_id);
CREATE INDEX IF NOT EXISTS idx_blacklist_comments_user_id ON blacklist_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_blacklist_reports_created_by ON blacklist_reports(created_by);

-- ─── Booking-side ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_trainer_id ON bookings(trainer_id);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_booking_id ON magic_link_tokens(booking_id);
CREATE INDEX IF NOT EXISTS idx_checkins_checked_in_by ON checkins(checked_in_by);

-- ─── Marketing / outreach ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);

-- ─── Certification ladder ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_certificates_issued_by ON certificates(issued_by);
CREATE INDEX IF NOT EXISTS idx_cert_enrollments_booking_id ON certification_enrollments(booking_id);
CREATE INDEX IF NOT EXISTS idx_cert_enrollments_certificate_id ON certification_enrollments(certificate_id);
CREATE INDEX IF NOT EXISTS idx_skill_signoffs_signed_off_by ON skill_signoffs(signed_off_by);
CREATE INDEX IF NOT EXISTS idx_skill_submissions_reviewer_id ON skill_submissions(reviewer_id);

-- ─── Money flow ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_credit_transactions_booking_id ON credit_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_recorded_by ON credit_transactions(recorded_by);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_student_credit_id ON credit_transactions(student_credit_id);
CREATE INDEX IF NOT EXISTS idx_gym_payouts_paid_by ON gym_payouts(paid_by);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_trainer_payouts_created_by ON trainer_payouts(created_by);
CREATE INDEX IF NOT EXISTS idx_transactions_processed_by ON transactions(processed_by);

-- ─── Discovery / verification ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_discovered_gyms_duplicate_of ON discovered_gyms(duplicate_of);
CREATE INDEX IF NOT EXISTS idx_discovered_gyms_linked_org_id ON discovered_gyms(linked_org_id);
CREATE INDEX IF NOT EXISTS idx_verification_history_verified_by ON verification_history(verified_by);

-- ─── Events + fighters ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_event_bouts_winner_id ON event_bouts(winner_id);
CREATE INDEX IF NOT EXISTS idx_fighters_trainer_profile_id ON fighters(trainer_profile_id);

-- ─── Gym ops ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_gym_faqs_created_by ON gym_faqs(created_by);
CREATE INDEX IF NOT EXISTS idx_gym_website_ai_messages_user_id ON gym_website_ai_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_by ON inventory_logs(created_by);
CREATE INDEX IF NOT EXISTS idx_invites_invited_by ON invites(invited_by);

-- ─── Courses / lessons ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);

-- ─── Messaging / notifications ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_notification_events_sender_id ON notification_events(sender_id);

-- ─── MTP-internal (support tickets, action tokens) ─────────────────
CREATE INDEX IF NOT EXISTS idx_mtp_action_tokens_org_id ON mtp_action_tokens(org_id);
CREATE INDEX IF NOT EXISTS idx_mtp_action_tokens_proposed_by_conversation ON mtp_action_tokens(proposed_by_conversation);
CREATE INDEX IF NOT EXISTS idx_mtp_conversations_assigned_to ON mtp_conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_mtp_conversations_group_id ON mtp_conversations(group_id);

-- ─── Social / OckOck ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_social_accounts_connected_by ON social_accounts(connected_by);
CREATE INDEX IF NOT EXISTS idx_social_posts_created_by ON social_posts(created_by);

-- ─── Student notes + waivers ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_student_notes_booking_id ON student_notes(booking_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_trainer_id ON student_notes(trainer_id);
CREATE INDEX IF NOT EXISTS idx_student_waiver_signatures_waiver_id ON student_waiver_signatures(waiver_id);

-- ─── Trainer roster / commissions ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_trainer_commission_rules_service_id ON trainer_commission_rules(service_id);
CREATE INDEX IF NOT EXISTS idx_trainer_commission_rules_trainer_id ON trainer_commission_rules(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_user_id ON trainer_profiles(user_id);
