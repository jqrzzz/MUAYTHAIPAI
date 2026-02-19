-- Seed data for Wisarut Family Gym
-- Run this after creating tables and RLS policies

-- ============================================
-- 1. CREATE WISARUT FAMILY GYM ORGANIZATION
-- ============================================
INSERT INTO organizations (
  id,
  name,
  slug,
  description,
  country,
  province,
  city,
  address,
  google_maps_url,
  timezone,
  email,
  phone,
  whatsapp,
  instagram,
  facebook,
  website,
  status,
  verified
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Wisarut Family Gym',
  'wisarut-family-gym',
  'Authentic Muay Thai training in the mountains of Pai, Thailand. Train with the Wisarut family and experience traditional Thai boxing in a welcoming environment.',
  'Thailand',
  'Mae Hong Son',
  'Pai',
  '236 Moo 3 Wiang Tai Pai District, Mae Hong Son, Thailand 58130',
  'https://maps.app.goo.gl/a3beanCSTPSnUKaUA',
  'Asia/Bangkok',
  'info@paimuaythai.com',
  '+66 93 228 8026',
  '+66 93 228 8026',
  'muaythaipai',
  'wisarut.muaythaipai.3',
  'https://www.paimuaythai.com',
  'active',
  TRUE
);

-- ============================================
-- 2. CREATE ORGANIZATION SETTINGS
-- ============================================
INSERT INTO org_settings (
  org_id,
  booking_advance_days,
  booking_max_days_ahead,
  allow_guest_bookings,
  require_payment_upfront,
  notify_on_booking_email,
  notification_email,
  show_prices,
  show_trainer_selection,
  operating_hours
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  1,
  60,
  TRUE,
  FALSE,
  TRUE,
  'info@paimuaythai.com',
  TRUE,
  TRUE,
  '{
    "monday": {"open": "07:00", "close": "18:00"},
    "tuesday": {"open": "07:00", "close": "18:00"},
    "wednesday": {"open": "07:00", "close": "18:00"},
    "thursday": {"open": "07:00", "close": "18:00"},
    "friday": {"open": "07:00", "close": "18:00"},
    "saturday": {"open": "08:00", "close": "17:00"},
    "sunday": {"open": "08:00", "close": "12:00"}
  }'::jsonb
);

-- ============================================
-- 3. CREATE TRAINING SERVICES
-- ============================================
INSERT INTO services (org_id, name, description, category, price_thb, duration_minutes, requires_time_slot, display_order, is_active, is_featured, metadata) VALUES
-- Training Services
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Group Session', 'Join a dynamic group training session with other students of all levels.', 'training', 330, 90, TRUE, 1, TRUE, TRUE, '{"time_slots": ["08:00", "15:00"]}'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Private Lesson - Beginner', 'Personalized coaching focused on fundamentals and technique.', 'training', 600, 60, TRUE, 2, TRUE, FALSE, '{"time_slots": ["07:00", "10:00", "11:00", "12:00", "13:00", "14:00", "17:00", "18:00"]}'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Private Lesson - Advanced', 'Intense training for experienced practitioners.', 'training', 900, 60, TRUE, 3, TRUE, FALSE, '{"time_slots": ["07:00", "10:00", "11:00", "12:00", "13:00", "14:00", "17:00", "18:00"]}'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Gym Membership', 'Monthly access to training facilities.', 'membership', 7700, NULL, FALSE, 4, TRUE, FALSE, '{"duration_days": 30}'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Muay Thai For Kids', 'Fun and disciplined training for young martial artists.', 'training', 500, 60, TRUE, 5, TRUE, FALSE, '{"time_slots": ["07:00", "10:00", "11:00", "12:00", "13:00", "14:00", "17:00", "18:00"]}'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Online Training', 'Train from anywhere with our virtual coaching sessions.', 'membership', 330, NULL, FALSE, 6, TRUE, FALSE, '{"duration_days": 30}'),

-- Certificate Programs
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Naga Certificate', 'Level 1 - Introductory level focusing on essential techniques, stance, and footwork.', 'certificate', 7000, NULL, FALSE, 10, TRUE, FALSE, '{"level": 1, "duration_days": 3}'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Phayra Nak Certificate', 'Level 2 - Intermediate training with advanced combinations and clinching.', 'certificate', 10000, NULL, FALSE, 11, TRUE, FALSE, '{"level": 2, "duration_days": 5}'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Ratchasi Certificate', 'Level 3 - Advanced training focusing on fight strategy and conditioning.', 'certificate', 18000, NULL, FALSE, 12, TRUE, FALSE, '{"level": 3, "duration_days": 10}'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Hanuman Certificate', 'Level 4 - Technical excellence combined with mental discipline.', 'certificate', 25000, NULL, FALSE, 13, TRUE, FALSE, '{"level": 4, "duration_days": 30}'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Garuda Certificate', 'Level 5 - The pinnacle of our program for true champions.', 'certificate', 42000, NULL, FALSE, 14, TRUE, FALSE, '{"level": 5, "duration_days": 60}');

-- ============================================
-- 4. CREATE DEFAULT TIME SLOTS
-- ============================================
-- Group Session time slots (08:00, 15:00)
INSERT INTO time_slots (org_id, start_time, end_time, max_bookings, is_active) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '08:00', '09:30', 10, TRUE),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '15:00', '16:30', 10, TRUE);

-- Private lesson time slots
INSERT INTO time_slots (org_id, start_time, end_time, max_bookings, is_active) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '07:00', '08:00', 1, TRUE),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '10:00', '11:00', 1, TRUE),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11:00', '12:00', 1, TRUE),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '12:00', '13:00', 1, TRUE),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '13:00', '14:00', 1, TRUE),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '14:00', '15:00', 1, TRUE),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '17:00', '18:00', 1, TRUE),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '18:00', '19:00', 1, TRUE);
