-- 013: Fighters Marketplace Updates
-- Makes fighters table suitable for public-facing ONE Championship-style marketplace

-- Make user_id nullable (fighters can exist as public records without accounts)
ALTER TABLE fighters ALTER COLUMN user_id DROP NOT NULL;

-- Add display_name for fighters without user accounts
ALTER TABLE fighters ADD COLUMN IF NOT EXISTS display_name text;

-- Add nationality and physical stats for marketplace display
ALTER TABLE fighters ADD COLUMN IF NOT EXISTS nationality text;
ALTER TABLE fighters ADD COLUMN IF NOT EXISTS height_cm integer;
ALTER TABLE fighters ADD COLUMN IF NOT EXISTS weight_kg numeric(5,1);
ALTER TABLE fighters ADD COLUMN IF NOT EXISTS date_of_birth date;

-- Add knockout stats
ALTER TABLE fighters ADD COLUMN IF NOT EXISTS ko_wins integer DEFAULT 0;

-- Update RLS: allow public read access to all fighters (marketplace is public)
DROP POLICY IF EXISTS "Anyone can view active fighters" ON fighters;
CREATE POLICY "Anyone can view fighters" ON fighters
  FOR SELECT USING (true);

-- Seed with existing gym fighters (Wisarut Family Gym)
INSERT INTO fighters (display_name, ring_name, gym_id, wins, losses, draws, status, bio, photo_url, user_id, nationality)
VALUES
  ('Noa', 'Chai Thai', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 14, 3, 0, 'active',
   'Follow Noa ''Chai Thai'', witness their rigorous preparations, and be part of the team''s journey.',
   '/images/noah-profile.png', NULL, 'Thai'),

  ('Fom', 'I don''t clean I win', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 12, 0, 8, 'active',
   'Dedicated trainer and active fighter on the team with an impressive undefeated record.',
   '/images/fom-profile.png', NULL, 'Thai'),

  ('Firest', NULL, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 0, 0, 0, 'retired',
   'Retired fighter and dedicated trainer, continuing to pass on knowledge to the next generation.',
   '/images/firest-profile.png', NULL, 'Thai'),

  ('Daoden', NULL, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 0, 0, 0, 'retired',
   'Former fighter who competed at the highest levels, now retired from active competition.',
   NULL, NULL, 'Thai'),

  ('Champ', NULL, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 0, 0, 0, 'retired',
   'A true champion who has hung up the gloves but remains part of the Muay Thai Pai family.',
   NULL, NULL, 'Thai'),

  ('James', NULL, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 0, 0, 0, 'retired',
   'Experienced trainer and retired fighter who continues to share knowledge with students.',
   '/images/james-profile.png', 'ae9e79cf-f5b0-46a6-927f-17188aa9e2ef', 'Thai'),

  ('Film', NULL, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 0, 0, 0, 'retired',
   'Son of KRU WISARUT and lead trainer, carrying on the family tradition of Muay Thai excellence.',
   '/images/film-profile.png', '33255e21-bc92-41f0-8210-ce9ea4c21ff0', 'Thai');
