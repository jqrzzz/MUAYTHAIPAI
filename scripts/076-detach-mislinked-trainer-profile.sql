-- ============================================
-- 076: Detach mis-linked "Kru James" trainer_profile
--
-- Juan's user account (juanquirozjr@gmail.com — platform admin + owner of
-- Muay Thai Pai) was attached to a trainer_profile with display_name
-- "Kru James" as a test/setup artifact. That's wrong: Juan is the gym
-- owner, not a trainer named Kru James. The mis-link surfaces him as a
-- trainer on any UI that joins users.id → trainer_profiles.user_id.
--
-- Conservative fix: detach (set user_id = NULL) the mis-linked profile
-- rather than delete it. Two reasons:
--   1. The profile may carry real Kru James content (photo, bio,
--      specialties) we don't want to lose.
--   2. When the real Kru James (jameskokha@gmail.com) accepts a fresh
--      invite, the accept endpoint will create a NEW trainer_profile
--      tied to HIS user_id. We can reconcile the two profiles (delete
--      the orphan, merge fields into the new row) at that point in a
--      follow-up cleanup — not now, while we'd be guessing.
--
-- Reversible: re-link with one UPDATE setting user_id back to Juan's.
-- ============================================

UPDATE trainer_profiles
SET user_id = NULL,
    updated_at = now()
WHERE user_id = (SELECT id FROM users WHERE email = 'juanquirozjr@gmail.com')
  AND display_name = 'Kru James';
