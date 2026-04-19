-- ============================================
-- 013: Online Course System
-- Adds courses, modules, lessons, enrollments,
-- and progress tracking for the learning platform.
-- ============================================

-- ============================================
-- 1. COURSES (top-level programs)
-- ============================================
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  -- NULL org_id = platform-wide course (Naga-to-Garuda system)

  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  cover_image_url TEXT,

  -- Categorization
  difficulty TEXT DEFAULT 'beginner'
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert', 'master', 'all-levels')),
  category TEXT DEFAULT 'technique'
    CHECK (category IN ('technique', 'conditioning', 'culture', 'certification', 'sparring', 'clinch')),

  -- Certification link (if completing this course earns a cert level)
  certificate_level TEXT,
  -- e.g. 'naga', 'phayra-nak', etc.

  -- Pricing
  is_free BOOLEAN DEFAULT FALSE,
  price_thb INTEGER DEFAULT 0,

  -- Content stats (denormalized for fast display)
  total_modules INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  estimated_hours NUMERIC(4,1) DEFAULT 0,

  -- Publishing
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,

  -- Ordering on browse page
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_org ON courses(org_id);

-- ============================================
-- 2. MODULES (sections within a course)
-- ============================================
CREATE TABLE course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,

  module_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_modules_course ON course_modules(course_id);

-- ============================================
-- 3. LESSONS (individual learning units)
-- ============================================
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  -- course_id is denormalized for faster queries

  title TEXT NOT NULL,
  description TEXT,

  -- Content
  content_type TEXT DEFAULT 'video'
    CHECK (content_type IN ('video', 'text', 'quiz', 'drill')),
  video_url TEXT,
  -- Supports YouTube, Vimeo, Mux, Cloudflare Stream, or direct URL
  video_duration_seconds INTEGER,
  text_content TEXT,
  -- Rich text / markdown for text-type lessons

  -- For drill-type lessons
  drill_instructions TEXT,
  drill_duration_minutes INTEGER,

  -- Ordering
  lesson_order INTEGER NOT NULL DEFAULT 0,

  -- Access control
  is_preview BOOLEAN DEFAULT FALSE,
  -- Preview lessons are accessible without enrollment

  estimated_minutes INTEGER DEFAULT 10,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lessons_module ON lessons(module_id);
CREATE INDEX idx_lessons_course ON lessons(course_id);

-- ============================================
-- 4. ENROLLMENTS (student ↔ course)
-- ============================================
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- Progress summary (denormalized)
  completed_lessons INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  progress_pct NUMERIC(5,2) DEFAULT 0,

  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'paused')),

  -- Payment reference
  payment_method TEXT,
  payment_amount_thb INTEGER,

  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

-- ============================================
-- 5. LESSON PROGRESS (per-lesson tracking)
-- ============================================
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  status TEXT DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed')),

  -- Video progress
  video_position_seconds INTEGER DEFAULT 0,
  -- Resume playback position

  -- Quiz answers (JSONB for flexibility)
  quiz_answers JSONB,
  quiz_score NUMERIC(5,2),

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_progress_user_course ON lesson_progress(user_id, course_id);
CREATE INDEX idx_progress_course_status ON lesson_progress(course_id, status);
CREATE INDEX idx_enrollments_course_status ON enrollments(course_id, status);

-- ============================================
-- 6. QUIZ QUESTIONS (for quiz-type lessons)
-- ============================================
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,

  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice'
    CHECK (question_type IN ('multiple_choice', 'true_false', 'text')),

  -- Options as JSONB array: [{"id": "a", "text": "...", "is_correct": true}, ...]
  options JSONB,
  correct_answer TEXT,
  explanation TEXT,

  question_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_lesson ON quiz_questions(lesson_id);

-- ============================================
-- 7. RLS POLICIES
-- ============================================
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- Published courses are readable by everyone
CREATE POLICY "Published courses are public"
  ON courses FOR SELECT
  USING (status = 'published');

-- Org admins can manage their own courses
CREATE POLICY "Org admins manage courses"
  ON courses FOR ALL
  USING (
    org_id IS NULL AND EXISTS (
      SELECT 1 FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM org_members
      WHERE user_id = auth.uid()
      AND org_id = courses.org_id
      AND role IN ('owner', 'admin')
    )
  );

-- Modules/lessons follow course visibility
CREATE POLICY "Modules visible with course"
  ON course_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = course_modules.course_id
      AND status = 'published'
    )
  );

CREATE POLICY "Lessons visible with course"
  ON lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = lessons.course_id
      AND status = 'published'
    )
  );

-- Enrollments: users see their own
CREATE POLICY "Users see own enrollments"
  ON enrollments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can enroll"
  ON enrollments FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Progress: users manage their own
CREATE POLICY "Users manage own progress"
  ON lesson_progress FOR ALL
  USING (user_id = auth.uid());

-- Quiz questions: readable if lesson is visible
CREATE POLICY "Quiz questions visible with lesson"
  ON quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN courses ON courses.id = lessons.course_id
      WHERE lessons.id = quiz_questions.lesson_id
      AND courses.status = 'published'
    )
  );

-- ============================================
-- 8. UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_course_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_course_updated_at();

CREATE TRIGGER modules_updated_at
  BEFORE UPDATE ON course_modules
  FOR EACH ROW EXECUTE FUNCTION update_course_updated_at();

CREATE TRIGGER lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_course_updated_at();

-- ============================================
-- 018: Seed Naga Certification Course (Level 1)
-- Maps directly to the 7 Naga skills in
-- lib/certification-levels.ts
-- ============================================

-- Insert the course (platform-wide, no org_id)
INSERT INTO courses (
  id, org_id, title, slug, description, short_description,
  difficulty, category, certificate_level,
  is_free, price_thb, status, is_featured, display_order,
  total_modules, total_lessons, estimated_hours
) VALUES (
  '11111111-0000-0000-0000-000000000001',
  NULL,
  'Naga Certification — Level 1',
  'naga-certification',
  'The foundational level of Thailand''s national Muay Thai certification system. Master the essential stance, strikes, defense, culture, and history that every nak muay must know. Completing this course qualifies you for the Naga (Level 1) certification assessment.',
  'Master the fundamentals of Muay Thai — stance, strikes, defense, Wai Kru, and history.',
  'beginner',
  'certification',
  'naga',
  FALSE,
  7000,
  'published',
  TRUE,
  1,
  9, 26, 8.0
) ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- MODULES (9 total)
-- ============================================

INSERT INTO course_modules (id, course_id, title, description, module_order) VALUES
  ('22222222-0001-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Welcome & Course Overview',
   'What to expect from the Naga certification, how the program works, and what you will achieve.',
   0),
  ('22222222-0002-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Basic Muay Thai Stance',
   'The guard position is the foundation of everything. Learn proper weight distribution, hand position, and balance.',
   1),
  ('22222222-0003-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Jab & Cross (Mat Wiang)',
   'The two most important punches in Muay Thai. Learn proper form, hip rotation, and when to use each.',
   2),
  ('22222222-0004-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Front Kick (Teep)',
   'The teep is Muay Thai''s signature technique — a push kick used for distance, defense, and offense.',
   3),
  ('22222222-0005-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Basic Shin Block',
   'Learn to check kicks with proper shin-to-shin defense, the fundamental defensive technique.',
   4),
  ('22222222-0006-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Wai Kru & Muay Thai Culture',
   'Understanding the spiritual and cultural traditions of Muay Thai — the Wai Kru, respect, and gym etiquette.',
   5),
  ('22222222-0007-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Basic Pad Work Etiquette',
   'How to hold pads, how to hit pads, and the communication between pad holder and striker.',
   6),
  ('22222222-0008-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'History of Muay Thai',
   'From ancient Siam to the modern ring — understand the origins, evolution, and significance of the Art of Eight Limbs.',
   7),
  ('22222222-0009-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Final Assessment',
   'Test your knowledge across all modules. Pass to qualify for your Naga certification assessment.',
   8)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 1: Welcome & Course Overview
-- ============================================
INSERT INTO lessons (id, module_id, course_id, title, description, content_type, text_content, lesson_order, is_preview, estimated_minutes) VALUES
  ('33333333-0101-0000-0000-000000000001',
   '22222222-0001-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Welcome to the Naga Program',
   'An introduction to Thailand''s official Muay Thai certification system.',
   'text',
   '# Welcome to the Naga Certification Program

You are about to begin the foundational level of Thailand''s national Muay Thai certification system — the **Naga** (Level 1).

## What is the Naga?

In Thai mythology, the **Naga** (นาค) is a great serpent deity — a guardian of water and the threshold between worlds. In our system, the Naga represents your first step across the threshold into authentic Muay Thai.

## What You Will Learn

This course covers the **7 core skills** every nak muay (Muay Thai practitioner) must demonstrate:

1. **Basic Muay Thai Stance** — the guard position
2. **Jab & Cross** — mat wiang, the fundamental punches
3. **Front Kick (Teep)** — Muay Thai''s signature technique
4. **Basic Shin Block** — essential defense
5. **Wai Kru** — the pre-fight ritual and cultural respect
6. **Pad Work Etiquette** — working with a partner
7. **Muay Thai History** — understanding the art''s origins

## How It Works

- Complete all lessons and pass the quizzes in each module
- Each module corresponds to one of the 7 Naga skills
- After completing the course, you qualify for an **in-person assessment** at any certified gym
- A trainer will verify your skills and issue your Naga certificate

## Prerequisites

None. This program is designed for complete beginners. All you need is willingness to learn and respect for the art.

**Chok dee!** (Good luck!) 🐍',
   0, TRUE, 5),

  ('33333333-0102-0000-0000-000000000001',
   '22222222-0001-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'How Certification Works',
   'Understanding the 5-level system from Naga to Garuda.',
   'text',
   '# The 5-Level Certification System

Thailand''s Muay Thai certification follows a progression inspired by Thai mythology:

| Level | Creature | Focus |
|-------|----------|-------|
| **1 — Naga** 🐍 | Serpent Deity | Fundamentals |
| **2 — Phayra Nak** 🐉 | Serpent King | Combinations & clinch basics |
| **3 — Singha** 🦁 | Mythical Lion | Sparring & strategy |
| **4 — Hanuman** 🐒 | Divine Warrior | Competition readiness |
| **5 — Garuda** 🦅 | Divine Eagle | Mastery & teaching |

## Your Path

Each level requires:
- **Online coursework** — video lessons, reading, drills, and quizzes
- **In-person assessment** — a certified trainer verifies your skills
- **Minimum wait time** — you must train between levels (no shortcuts)

## Certification is Portable

Your certificate is recognized across all participating gyms in Thailand. Each certificate has a unique verification number and QR code that anyone can check online.

## Let''s Begin

The next module covers your first skill: the **Basic Muay Thai Stance**. This is where every nak muay starts.',
   1, TRUE, 5)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 2: Basic Muay Thai Stance
-- ============================================
INSERT INTO lessons (id, module_id, course_id, title, description, content_type, text_content, drill_instructions, drill_duration_minutes, lesson_order, is_preview, estimated_minutes) VALUES
  ('33333333-0201-0000-0000-000000000001',
   '22222222-0002-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'The Muay Thai Guard Position',
   'Feet, hands, chin, eyes — every detail of the fighting stance.',
   'text',
   '# The Muay Thai Guard Position

The stance is the single most important thing you will learn. Every strike, every defense, every movement starts and ends here.

## Foot Position

- Stand with feet **shoulder-width apart**
- Your **lead foot** points forward (left foot for orthodox, right for southpaw)
- Your **rear foot** is angled about 45 degrees outward
- Weight distribution: roughly **60% on the rear leg, 40% on the lead**
- Stay on the **balls of your feet** — never flat-footed
- Knees are **slightly bent**, never locked

## Hand Position

- Hands up, fists at **cheekbone height**
- Elbows tucked close to your ribs — protecting the body
- Lead hand slightly forward (for jabs and parries)
- Rear hand tight to the chin (your power hand, always ready)
- **Chin is tucked** — look through your eyebrows

## Common Mistakes

- **Hands too low** — leaves the head exposed
- **Feet too wide** — slow to move, easy to sweep
- **Feet too narrow** — no balance, easy to push over
- **Flat-footed** — cannot react quickly
- **Chin up** — invites a knockout

## The Golden Rule

After every strike, every block, every movement — **return to your stance**. This is your home base.',
   NULL, NULL, 0, FALSE, 10),

  ('33333333-0202-0000-0000-000000000001',
   '22222222-0002-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Stance Drill: Mirror Work',
   'Practice your guard position with this guided drill.',
   'drill',
   NULL,
   '# Stance Mirror Drill — 10 Minutes

Find a mirror or use your phone camera. You need to SEE your stance.

## Round 1: Static Hold (3 minutes)
- Set a timer for 3 minutes
- Get into your Muay Thai stance
- Check every detail: feet, knees, hands, elbows, chin
- Hold the position. Feel where your weight sits
- If you get tired, that tells you where you''re weak — good

## Round 2: Reset Drill (3 minutes)
- Drop your hands to your sides, relax completely
- On a count of 3 in your head, SNAP back into stance
- Check your position in the mirror — are your hands up? Chin tucked?
- Repeat 20 times. The stance must become automatic

## Round 3: Movement (4 minutes)
- From your stance, take a small step forward. Return to stance
- Step backward. Return to stance
- Step left. Return to stance
- Step right. Return to stance
- After each step, FREEZE and check: are you still in proper guard?
- Gradually increase speed

## Key Points
- Speed is not important yet — **correctness is**
- Your stance should feel natural by the end of this drill
- If your shoulders burn, your hands were in the right place',
   10, 1, FALSE, 10),

  ('33333333-0203-0000-0000-000000000001',
   '22222222-0002-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Stance Knowledge Check',
   'Test your understanding of the Muay Thai guard position.',
   'quiz',
   NULL, NULL, NULL, 2, FALSE, 5)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 3: Jab & Cross
-- ============================================
INSERT INTO lessons (id, module_id, course_id, title, description, content_type, text_content, drill_instructions, drill_duration_minutes, lesson_order, is_preview, estimated_minutes) VALUES
  ('33333333-0301-0000-0000-000000000001',
   '22222222-0003-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'The Jab (Mat Trong)',
   'Your fastest weapon — how to throw a proper Muay Thai jab.',
   'text',
   '# The Jab — Mat Trong (หมัดตรง)

The jab is your **rangefinder, your setup, and your first line of offense**. It''s the fastest punch you have.

## How to Throw the Jab

1. Start in your guard position
2. **Extend your lead hand straight forward** — do not loop or wind up
3. Rotate your fist so the palm faces **down** at full extension
4. Your rear hand stays glued to your chin — do not drop it
5. **Snap the hand back** to guard immediately — the retraction is as important as the extension
6. The power comes from a small **push off the lead foot** and a slight shoulder rotation

## What Makes a Good Jab

- **Speed over power** — the jab is not your knockout punch
- **Straight line** — shortest distance between your fist and the target
- **Snap** — hit and retract, don''t push
- **Eyes on target** — look where you''re hitting through your guard

## Common Mistakes

- **Dropping the rear hand** when jabbing (leaves chin open to counter)
- **Leaning forward** too much (breaks your balance)
- **Telegraphing** — pulling the hand back before throwing (opponent sees it coming)
- **Leaving the jab out** — extended arm = easy to grab in clinch

## When to Use It

- To measure distance
- To set up a cross or kick
- To disrupt your opponent''s rhythm
- To score points in competition
- To keep an aggressive opponent at range',
   NULL, NULL, 0, FALSE, 10),

  ('33333333-0302-0000-0000-000000000001',
   '22222222-0003-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'The Cross (Mat Wiang)',
   'Your power punch — the mechanics of the rear-hand cross.',
   'text',
   '# The Cross — Mat Wiang (หมัดเหวี่ยง)

The cross is your **power punch**. It travels further than the jab and carries the full rotation of your hips and shoulders.

## How to Throw the Cross

1. Start in your guard position
2. **Rotate your rear hip forward** — this is where the power comes from
3. Your rear shoulder drives forward as the hand extends
4. The fist travels in a **straight line** to the target
5. Your rear foot **pivots** on the ball of the foot (heel lifts)
6. Your lead hand stays up, guarding your chin
7. **Snap back** to guard — do not admire your work

## The Power Chain

The cross is a **whole-body technique**:
- Starts in the rear foot (push off the ground)
- Transfers through the **hip rotation**
- Moves through the **shoulder turn**
- Delivers through the **arm extension**
- Impact at the **first two knuckles**

If you only punch with your arm, you lose 70% of your power.

## The Jab-Cross Combination (1-2)

The most fundamental combination in all striking arts:
1. Throw the jab (sets range, blinds opponent briefly)
2. Immediately follow with the cross (the power shot)

The jab creates the opening. The cross does the damage.

## Common Mistakes

- **No hip rotation** — arm-punching with no power
- **Winding up** — pulling the hand back before throwing
- **Crossing over** — the punch should be straight, not looping
- **Not returning to guard** — you are exposed after the cross',
   NULL, NULL, 1, FALSE, 10),

  ('33333333-0303-0000-0000-000000000001',
   '22222222-0003-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Drill: Jab-Cross Shadow Boxing',
   'Shadow boxing drill focused on the 1-2 combination.',
   'drill',
   NULL,
   '# Jab-Cross Shadow Boxing — 15 Minutes

No equipment needed. Just you, space, and focus.

## Round 1: Single Jab (3 minutes)
- Stance. Jab. Return to stance
- Focus on: straight line, snap back, rear hand stays up
- Throw 50 jabs. Count them
- After 50, switch to moving — jab while stepping forward, jab while stepping back

## Round 2: Single Cross (3 minutes)
- Stance. Cross. Return to stance
- Focus on: hip rotation, foot pivot, full extension
- Throw 50 crosses. Feel the hip drive each one
- Check: is your lead hand still up when you throw the cross?

## Round 3: Jab-Cross Combination (3 minutes)
- Jab, then immediately cross. Return to stance
- Start slow — get the rhythm right
- The jab is fast and light, the cross is heavy and committed
- Throw 30 combinations

## Round 4: Moving 1-2 (3 minutes)
- Step forward, jab-cross. Return to stance
- Step left, jab-cross. Return to stance
- Step right, jab-cross. Return to stance
- Step backward, jab-cross. Return to stance
- Always return to guard between combinations

## Round 5: Free Shadow Boxing (3 minutes)
- Move around your space
- Mix jabs, crosses, and 1-2 combos
- Imagine an opponent — don''t just throw at air
- Practice slipping your head off the center line after combos

## Cool Down
- Shake out your arms
- Roll your shoulders
- Note how your form felt in round 5 vs round 1',
   15, 2, FALSE, 15),

  ('33333333-0304-0000-0000-000000000001',
   '22222222-0003-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Jab & Cross Knowledge Check',
   'Test your understanding of the jab and cross.',
   'quiz',
   NULL, NULL, NULL, 3, FALSE, 5)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 4: Front Kick (Teep)
-- ============================================
INSERT INTO lessons (id, module_id, course_id, title, description, content_type, text_content, drill_instructions, drill_duration_minutes, lesson_order, is_preview, estimated_minutes) VALUES
  ('33333333-0401-0000-0000-000000000001',
   '22222222-0004-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'The Teep — Muay Thai''s Signature Kick',
   'Learn the push kick that defines Muay Thai.',
   'text',
   '# The Teep (ถีบ) — The Push Kick

The teep is what separates Muay Thai from other striking arts. It is a **push kick** — not a snap kick — used to control distance, stop advances, and score.

## Front Teep (Teep Trong)

1. Start in your guard position
2. **Lift your lead knee** straight up toward your chest
3. **Push the ball of your foot forward** — extend the hip
4. Strike with the **ball of the foot** (not the toes)
5. Push through the target — this is not a flick
6. **Pull the leg back** and return to stance

## Rear Teep

Same mechanics but with the rear leg:
- More power (further to travel, more hip behind it)
- Slower (the rear leg has further to travel)
- Used more as an offensive weapon than the lead teep

## Targets

- **Solar plexus** — the main target, pushes opponent back and winds them
- **Hip** — disrupts their stance and balance
- **Thigh** — stops them from stepping forward
- **Face** — advanced technique, used for style points in competition

## Why the Teep Matters

- It is your **longest-range weapon** (your leg is longer than your arm)
- It **controls distance** — keep aggressive opponents away
- It **scores points** in competition
- It is a **safe technique** — low risk of counter if done correctly
- It is the most **Thai** technique in Muay Thai

## Common Mistakes

- **Leaning back too far** — you lose balance and power
- **Flicking instead of pushing** — no effect on the opponent
- **Kicking with the toes** — injuries guaranteed
- **Not returning the leg** — easy to catch and sweep',
   NULL, NULL, 0, FALSE, 10),

  ('33333333-0402-0000-0000-000000000001',
   '22222222-0004-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Drill: Teep Technique',
   'Build your teep with progressive rounds.',
   'drill',
   NULL,
   '# Teep Drill — 12 Minutes

Use a wall, heavy bag, or open space.

## Round 1: Knee Chamber (3 minutes)
- From stance, lift your lead knee to chest height. Hold 2 seconds. Return
- Repeat 20 times per leg
- Focus: balance, knee height, staying on the ball of your base foot

## Round 2: Slow Teep (3 minutes)
- Chamber the knee, then SLOWLY extend the foot forward
- Push through an imaginary target at hip height
- Pull back slowly. Return to stance
- 15 reps per leg. Feel every part of the motion

## Round 3: Full Speed Teep (3 minutes)
- Now put it together at full speed
- Chamber, push, retract, stance
- 20 reps lead leg, 10 reps rear leg

## Round 4: Teep After Jab (3 minutes)
- Jab to set range, then immediately teep with the lead leg
- The jab measures distance, the teep pushes them back
- 15 combinations',
   12, 1, FALSE, 12),

  ('33333333-0403-0000-0000-000000000001',
   '22222222-0004-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Teep Knowledge Check',
   'Test your understanding of the teep.',
   'quiz',
   NULL, NULL, NULL, 2, FALSE, 5)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 5: Basic Shin Block
-- ============================================
INSERT INTO lessons (id, module_id, course_id, title, description, content_type, text_content, drill_instructions, drill_duration_minutes, lesson_order, is_preview, estimated_minutes) VALUES
  ('33333333-0501-0000-0000-000000000001',
   '22222222-0005-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Checking Kicks — The Shin Block',
   'Why we block with the shin and how to do it properly.',
   'text',
   '# The Shin Block (Check)

In Muay Thai, you block kicks **with your shin, not your arms**. This is called "checking" a kick.

## Why the Shin?

Your shin bone is one of the hardest bones in your body. When an opponent kicks you and hits your raised shin, **they take damage too** — often more than you do.

## How to Check a Kick

1. Start in your guard position
2. **Lift your lead leg** — knee comes up, shin faces outward
3. Turn the shin **slightly outward** at about 45 degrees
4. Your shin should form a **wall** from knee to foot
5. Keep your **hands up** — do not reach down
6. Your base foot stays planted, slightly turned outward for balance
7. After the block, return to stance immediately

## Key Details

- **Lift, don''t swing** — you are raising a shield, not throwing a kick
- **Angle matters** — a straight-up shin catches the kick cleanly
- **Hands stay up** — dropping your guard to check is a common beginner mistake
- **Check early** — lift as soon as you see the kick coming

## Conditioning

- Shin conditioning happens naturally over months of training
- Hitting heavy bags, pads, and checking kicks builds bone density
- **Never use a rolling pin or bottle** on your shins — this is a myth that causes damage
- Patience. Your shins will toughen with consistent training

## Common Mistakes

- **Checking too late** — you eat the kick before your leg is up
- **Lifting too high** — exposes your base leg to low kicks
- **Dropping hands** — opponent follows the kick with a punch
- **Hopping backward** — you lose position; a good check holds ground',
   NULL, NULL, 0, FALSE, 10),

  ('33333333-0502-0000-0000-000000000001',
   '22222222-0005-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Drill: Check & Return',
   'Practice checking kicks and countering.',
   'drill',
   NULL,
   '# Check & Return Drill — 10 Minutes

## Round 1: Lead Check (3 minutes)
- Stance. Lift lead shin to check position. Hold 1 second. Return
- 30 reps. Focus: speed of the lift, hands staying up, balance

## Round 2: Rear Check (3 minutes)
- Same drill with the rear leg
- 20 reps. Focus: shifting weight forward slightly before lifting

## Round 3: Check + Counter (4 minutes)
- Lead check, then immediately throw a cross
- Logic: they kick, you check, they are off-balance, you punch
- 15 reps per side
- Then try: lead check then rear body kick',
   10, 1, FALSE, 10),

  ('33333333-0503-0000-0000-000000000001',
   '22222222-0005-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Shin Block Knowledge Check',
   'Test your understanding of checking kicks.',
   'quiz',
   NULL, NULL, NULL, 2, FALSE, 5)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 6: Wai Kru & Culture
-- ============================================
INSERT INTO lessons (id, module_id, course_id, title, description, content_type, text_content, lesson_order, is_preview, estimated_minutes) VALUES
  ('33333333-0601-0000-0000-000000000001',
   '22222222-0006-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'The Wai Kru Ram Muay',
   'Understanding the pre-fight ritual that honors teachers, family, and the art.',
   'text',
   '# The Wai Kru Ram Muay (ไหว้ครูรำมวย)

Before every Muay Thai bout, fighters perform the **Wai Kru Ram Muay** — a ritual dance that honors their teachers, their gym, and the art itself.

## What is the Wai Kru?

**Wai Kru** means "paying respect to the teacher."
**Ram Muay** means "boxing dance."

Together, the Wai Kru Ram Muay is a deeply personal ritual that:
- **Honors your kru (teacher)**
- **Honors your gym**
- **Honors your parents and family**
- **Seals the ring** — a spiritual act to protect the fighter
- **Focuses the mind**

## The Sequence

1. **Enter the ring** — walk along the top rope, sealing the ring
2. **Go to your corner** — face outward
3. **Begin the Wai Kru** — kneel, bow three times
4. **Perform the Ram Muay** — slow, deliberate movements unique to your gym
5. **Return to your corner**

## Why This Matters for Certification

At the Naga level, you must understand:
- What the Wai Kru represents
- Why fighters perform it
- The basic gesture of respect (the three bows)
- That every gym''s Ram Muay is different

## The Deeper Meaning

Muay Thai is not just fighting. It is a **martial art rooted in Thai Buddhist culture**, warrior traditions, and respect for lineage.',
   0, FALSE, 10),

  ('33333333-0602-0000-0000-000000000001',
   '22222222-0006-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Gym Etiquette & Respect',
   'The unwritten rules of training in a Muay Thai gym.',
   'text',
   '# Gym Etiquette — The Unwritten Rules

## Before Training

- **Arrive on time** — late arrival disrespects the kru
- **Remove shoes before stepping on mats** — always
- **Greet your kru** — a head bow or wai when you enter
- **No ego at the door**

## During Training

- **Listen first, ask questions second**
- **Never walk over or step over someone** — walk around
- **Never sit with feet pointed at a person or Buddha image** — deeply disrespectful in Thai culture
- **Don''t stop when tired** — the kru decides when the round ends
- **Water breaks when permitted**

## Pad Work

- **Thank your pad holder** — they are serving you
- **Hit the pads, not the holder''s arms**
- **Match the pad holder''s rhythm** — they lead, you follow
- **Wai after pads** — always

## Sparring

- **Control your power** — sparring is for learning, not winning
- **Touch gloves before and after**
- **If your partner is newer, slow down**

## The Principle

In Thai: **น้ำใจ (nam jai)** — "water of the heart" — generosity of spirit. Be generous with respect, patience, and effort.',
   1, FALSE, 10),

  ('33333333-0603-0000-0000-000000000001',
   '22222222-0006-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Wai Kru & Culture Knowledge Check',
   'Test your understanding of Muay Thai culture.',
   'quiz',
   NULL, 2, FALSE, 5)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 7: Pad Work Etiquette
-- ============================================
INSERT INTO lessons (id, module_id, course_id, title, description, content_type, text_content, drill_instructions, drill_duration_minutes, lesson_order, is_preview, estimated_minutes) VALUES
  ('33333333-0701-0000-0000-000000000001',
   '22222222-0007-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Pad Work Fundamentals',
   'The art of working pads — as striker and holder.',
   'text',
   '# Pad Work Fundamentals

Pad work is the heart of Muay Thai training. A good pad round is a conversation between striker and holder.

## As the Striker

- **Listen for the call** — the pad holder will call combinations or tap pads to signal
- **Hit the center of the pad** — accuracy over power
- **Return to guard after every combo** — don''t stand there admiring your work
- **Match the holder''s pace** — they set the rhythm, you follow
- **Breathe with your strikes** — exhale on every hit

## As the Holder

- **Present the pads at the right angle** — flat for punches, angled for kicks
- **Absorb the strike slightly** — meet the strike, don''t pull away or push into it
- **Call the combinations clearly** — "jab, cross, kick!" or tap the pads as signals
- **Move the striker around** — step back to make them chase, angle to make them adjust
- **Watch for bad habits** — dropping hands, leaning, poor technique

## The Relationship

In a Thai gym, pad work is a **teaching tool**, not just exercise. The pad holder (often the kru) is:
- Reading your technique in real-time
- Adjusting the angle and distance to challenge you
- Building your timing and rhythm
- Testing your cardio and mental toughness

## Basic Pad Combinations for Naga Level

1. Jab — cross
2. Jab — cross — lead hook
3. Jab — cross — body kick
4. Teep
5. Check — cross

## Respect

- Always **wai** your pad holder before and after
- If a trainer holds pads for you, that is a **gift of their time and knowledge**
- Hold pads for others when asked — it teaches you to read strikes',
   NULL, NULL, 0, FALSE, 10),

  ('33333333-0702-0000-0000-000000000001',
   '22222222-0007-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Drill: Partner Pad Rounds',
   'Structured pad work practice with a partner.',
   'drill',
   NULL,
   '# Partner Pad Work — 15 Minutes

You need: Thai pads (or focus mitts) and a partner.

## Round 1: Jab-Cross Only (3 minutes)
- Holder calls "jab" or "cross" or "one-two"
- Striker throws clean, returns to guard
- Holder: present pads at chin height, slight angle inward

## Round 2: Add the Kick (3 minutes)
- Holder calls "one-two-kick"
- Striker: jab, cross, rear body kick
- Holder: after catching the kick on the pad, reset and go again
- Focus on the transition from punches to kick

## Round 3: Add the Teep (3 minutes)
- Holder holds belly pad or flat pad at stomach level
- Striker throws teep on command
- Mix: jab-teep, cross-teep, teep alone

## Round 4: Defense Round (3 minutes)
- Holder throws LIGHT attacks at striker
- Striker checks kicks and returns with a cross
- Striker catches teeps and returns with a kick
- This round builds reaction and counter-timing

## Round 5: Free Round (3 minutes)
- Holder calls any combination
- Striker responds as fast as possible
- This simulates real training rhythm

Switch roles halfway through if both partners need pad work.',
   15, 1, FALSE, 15),

  ('33333333-0703-0000-0000-000000000001',
   '22222222-0007-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Pad Work Knowledge Check',
   'Test your understanding of pad work etiquette.',
   'quiz',
   NULL, NULL, NULL, 2, FALSE, 5)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 8: History of Muay Thai
-- ============================================
INSERT INTO lessons (id, module_id, course_id, title, description, content_type, text_content, lesson_order, is_preview, estimated_minutes) VALUES
  ('33333333-0801-0000-0000-000000000001',
   '22222222-0008-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Origins of Muay Thai',
   'From the battlefields of ancient Siam to the rings of Bangkok.',
   'text',
   '# The Origins of Muay Thai

Muay Thai — the Art of Eight Limbs — is Thailand''s national martial art and one of the oldest fighting systems in the world.

## Ancient Roots

Muay Thai evolved from **Muay Boran** (ancient boxing), a battlefield martial art used by Siamese soldiers when weapons were lost in combat. It used the entire body as a weapon:
- **Fists** as swords
- **Elbows** as hammers
- **Knees** as axes
- **Shins** as shields

This is why Muay Thai is called the **Art of Eight Limbs** — fists (2), elbows (2), knees (2), shins (2).

## The Legendary Nai Khanomtom

In **1774**, during a war between Burma and Siam, a captured Thai boxer named **Nai Khanomtom** was forced to fight Burmese champions. He defeated **10 opponents in a row** using Muay Boran.

The Burmese king was so impressed he freed Nai Khanomtom. This event is celebrated every year on **March 17 — National Muay Thai Day** (Boxer''s Day).

## Modernization

In the early 1900s, Muay Thai was formalized:
- **Boxing rings** replaced open courtyards
- **Weight classes** were introduced
- **Timed rounds** replaced fighting to submission
- **Gloves** replaced rope-wrapped hands (though Muay Kard Chuek still uses ropes)
- **Referees and scoring** were standardized

## The Golden Era

The 1980s-1990s are considered Muay Thai''s **Golden Era**:
- Legendary fighters like **Samart Payakaroon**, **Dieselnoi**, and **Saenchai** became national heroes
- Lumpinee and Rajadamnern stadiums in Bangkok became the sport''s spiritual home
- Muay Thai became Thailand''s most popular sport

## Muay Thai Today

- Practiced in **over 150 countries**
- Recognized by the **International Olympic Committee** (working toward Olympic inclusion)
- The backbone of modern **MMA striking**
- A cornerstone of Thai culture, tourism, and national identity',
   0, FALSE, 12),

  ('33333333-0802-0000-0000-000000000001',
   '22222222-0008-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Muay Thai Today & Its Global Impact',
   'How Muay Thai went from Thai villages to global phenomenon.',
   'text',
   '# Muay Thai Today

## The Stadiums

Two stadiums define professional Muay Thai:

**Lumpinee Boxing Stadium** (สนามมวยลุมพินี) — run by the Royal Thai Army. Fighting here is the highest honor for a nak muay. Located in Ram Intra, Bangkok (moved from its original Lumpinee Park location in 2014).

**Rajadamnern Stadium** (สนามมวยราชดำเนิน) — the oldest purpose-built Muay Thai stadium, opened in 1945. Located on Ratchadamnoen Nok Road, Bangkok.

A **Lumpinee or Rajadamnern champion** is considered the pinnacle of the sport.

## Weight Classes

Thai boxing uses weight classes similar to Western boxing, from mini flyweight (105 lbs) to heavyweight (190+ lbs). In Thailand, the most popular weight classes are **126-147 lbs** — lighter, faster, more technical fighting.

## Scoring

Muay Thai is scored on:
- **Clean strikes** — kicks score higher than punches
- **Damage and effect** — a strike that visibly hurts scores more
- **Ring control** — pushing the opponent back, dictating pace
- **Clinch dominance** — controlling position and landing knees
- **Defense** — clean checks and evasion show skill

Judges favor the fighter who **controls the fight**, not necessarily the one who throws more.

## Muay Thai in MMA

Modern mixed martial arts (MMA) has adopted Muay Thai as its primary striking system. Fighters like **Anderson Silva**, **José Aldo**, **Valentina Shevchenko**, and **Israel Adesanya** built their careers on Muay Thai fundamentals.

## Cultural Significance

Muay Thai is more than sport in Thailand:
- It is a path out of poverty for many Thai families
- Young fighters (starting at age 6-8) compete to support their families
- The sport is deeply intertwined with **Buddhism, monarchy, and national identity**
- The pre-fight Wai Kru, the mongkhon (headband), and the prajioud (armband) carry spiritual meaning

## Why This Matters for You

As a student of Muay Thai, you are joining a tradition that spans centuries. Understanding this history is not optional — it is part of what makes you a nak muay, not just someone who knows how to kick.',
   1, FALSE, 12),

  ('33333333-0803-0000-0000-000000000001',
   '22222222-0008-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'History Knowledge Check',
   'Test your knowledge of Muay Thai history.',
   'quiz',
   NULL, 2, FALSE, 5)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 9: Final Assessment
-- ============================================
INSERT INTO lessons (id, module_id, course_id, title, description, content_type, text_content, lesson_order, is_preview, estimated_minutes) VALUES
  ('33333333-0901-0000-0000-000000000001',
   '22222222-0009-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Course Review',
   'Review everything you have learned before the final quiz.',
   'text',
   '# Naga Level — Course Review

You have completed all 7 skill modules. Before taking the final assessment, review the key points:

## 1. Basic Stance
- Feet shoulder-width, lead foot forward, rear foot angled 45°
- Weight 60/40 on rear leg, balls of feet, knees bent
- Hands at cheekbone height, elbows tight, chin tucked

## 2. Jab & Cross
- Jab: straight line, snap back, rear hand stays at chin
- Cross: hip rotation drives power, foot pivots, return to guard
- 1-2 combination: jab sets range, cross delivers power

## 3. Teep
- Chamber knee high, push through with ball of foot
- Longest-range weapon, controls distance
- Lead teep for defense, rear teep for offense

## 4. Shin Block
- Lift shin to form a wall at 45° angle
- Hands stay up, check early
- Counter after checking: cross or body kick

## 5. Wai Kru & Culture
- Honors teacher, gym, family
- Three bows, Ram Muay unique to each gym
- Spiritual preparation before competition

## 6. Pad Work
- Striker follows holder''s rhythm and calls
- Hit center of pad, return to guard between combos
- Always wai before and after pad rounds

## 7. History
- Evolved from Muay Boran battlefield art
- Nai Khanomtom defeated 10 opponents (1774)
- Art of Eight Limbs: fists, elbows, knees, shins
- Lumpinee and Rajadamnern are the spiritual home

## Next Step

Pass the final assessment below, then visit a certified gym for your in-person Naga evaluation.',
   0, FALSE, 10),

  ('33333333-0902-0000-0000-000000000001',
   '22222222-0009-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Final Assessment — Naga Level',
   'Comprehensive quiz covering all 7 Naga skills. You need 80% to pass.',
   'quiz',
   NULL, 1, FALSE, 15)
ON CONFLICT DO NOTHING;

-- ============================================
-- QUIZ QUESTIONS — Module 2: Stance
-- ============================================
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0201-0000-0000-000000000001',
   '33333333-0203-0000-0000-000000000001',
   'What is the correct weight distribution in a Muay Thai stance?',
   'multiple_choice',
   '[{"id":"a","text":"50% front, 50% rear","is_correct":false},{"id":"b","text":"60% rear, 40% front","is_correct":true},{"id":"c","text":"80% front, 20% rear","is_correct":false},{"id":"d","text":"70% rear, 30% front","is_correct":false}]',
   'b',
   'The Muay Thai stance puts roughly 60% weight on the rear leg and 40% on the lead leg. This allows the lead leg to check kicks and teep quickly.',
   0),
  ('44444444-0202-0000-0000-000000000001',
   '33333333-0203-0000-0000-000000000001',
   'Where should your hands be in the guard position?',
   'multiple_choice',
   '[{"id":"a","text":"At waist height","is_correct":false},{"id":"b","text":"At shoulder height","is_correct":false},{"id":"c","text":"At cheekbone height with elbows tucked","is_correct":true},{"id":"d","text":"Extended forward like a boxer","is_correct":false}]',
   'c',
   'Hands at cheekbone height with elbows tucked to the ribs. This protects both the head and body.',
   1),
  ('44444444-0203-0000-0000-000000000001',
   '33333333-0203-0000-0000-000000000001',
   'You should stand flat-footed in your Muay Thai stance.',
   'true_false',
   '[{"id":"true","text":"True","is_correct":false},{"id":"false","text":"False","is_correct":true}]',
   'false',
   'Never flat-footed. Stay on the balls of your feet for quick movement and reaction.',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- QUIZ QUESTIONS — Module 3: Jab & Cross
-- ============================================
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0301-0000-0000-000000000001',
   '33333333-0304-0000-0000-000000000001',
   'Where does the power for the cross primarily come from?',
   'multiple_choice',
   '[{"id":"a","text":"The arm muscles","is_correct":false},{"id":"b","text":"The shoulder","is_correct":false},{"id":"c","text":"Hip rotation and weight transfer","is_correct":true},{"id":"d","text":"Leaning forward","is_correct":false}]',
   'c',
   'The cross is a whole-body technique. Power starts in the rear foot, transfers through hip rotation, through the shoulder turn, and into the fist.',
   0),
  ('44444444-0302-0000-0000-000000000001',
   '33333333-0304-0000-0000-000000000001',
   'In the jab-cross (1-2) combination, what is the purpose of the jab?',
   'multiple_choice',
   '[{"id":"a","text":"To knock out the opponent","is_correct":false},{"id":"b","text":"To set range and create an opening for the cross","is_correct":true},{"id":"c","text":"To block incoming strikes","is_correct":false},{"id":"d","text":"To push the opponent back","is_correct":false}]',
   'b',
   'The jab is a rangefinder and setup tool. It measures distance, blinds the opponent briefly, and creates the opening for the power cross.',
   1),
  ('44444444-0303-0000-0000-000000000001',
   '33333333-0304-0000-0000-000000000001',
   'What should your rear hand do while you throw a jab?',
   'multiple_choice',
   '[{"id":"a","text":"Drop to your waist for balance","is_correct":false},{"id":"b","text":"Extend forward with the jab","is_correct":false},{"id":"c","text":"Stay glued to your chin","is_correct":true},{"id":"d","text":"Move behind your head","is_correct":false}]',
   'c',
   'The rear hand always stays at the chin when jabbing. Dropping it leaves you wide open to a counter.',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- QUIZ QUESTIONS — Module 4: Teep
-- ============================================
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0401-0000-0000-000000000001',
   '33333333-0403-0000-0000-000000000001',
   'What part of the foot should make contact when throwing a teep?',
   'multiple_choice',
   '[{"id":"a","text":"The toes","is_correct":false},{"id":"b","text":"The heel","is_correct":false},{"id":"c","text":"The ball of the foot","is_correct":true},{"id":"d","text":"The side of the foot","is_correct":false}]',
   'c',
   'Always strike with the ball of the foot. Kicking with the toes risks serious injury.',
   0),
  ('44444444-0402-0000-0000-000000000001',
   '33333333-0403-0000-0000-000000000001',
   'The teep is a snapping kick, not a pushing kick.',
   'true_false',
   '[{"id":"true","text":"True","is_correct":false},{"id":"false","text":"False","is_correct":true}]',
   'false',
   'The teep is a PUSH kick. You push through the target, not flick at it. That pushing force is what makes it effective.',
   1),
  ('44444444-0403-0000-0000-000000000001',
   '33333333-0403-0000-0000-000000000001',
   'Why is the teep considered Muay Thai''s signature technique?',
   'multiple_choice',
   '[{"id":"a","text":"It is the most powerful strike","is_correct":false},{"id":"b","text":"It is your longest-range weapon and controls distance","is_correct":true},{"id":"c","text":"It is the easiest technique to learn","is_correct":false},{"id":"d","text":"It is only used in Muay Thai and no other martial art","is_correct":false}]',
   'b',
   'The teep is Muay Thai''s signature because it uses the leg (longest limb) to control distance — the fundamental principle of Thai boxing.',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- QUIZ QUESTIONS — Module 5: Shin Block
-- ============================================
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0501-0000-0000-000000000001',
   '33333333-0503-0000-0000-000000000001',
   'What angle should your shin be at when checking a kick?',
   'multiple_choice',
   '[{"id":"a","text":"Straight up and down (90 degrees)","is_correct":false},{"id":"b","text":"About 45 degrees outward","is_correct":true},{"id":"c","text":"Horizontal to the ground","is_correct":false},{"id":"d","text":"Pointed toward the opponent","is_correct":false}]',
   'b',
   'The shin turns slightly outward at about 45 degrees to form a wall that catches the incoming kick cleanly.',
   0),
  ('44444444-0502-0000-0000-000000000001',
   '33333333-0503-0000-0000-000000000001',
   'Using a rolling pin on your shins is an effective conditioning method.',
   'true_false',
   '[{"id":"true","text":"True","is_correct":false},{"id":"false","text":"False","is_correct":true}]',
   'false',
   'This is a myth that causes damage. Shin conditioning happens naturally through heavy bag work, pad work, and checking kicks over months of training.',
   1),
  ('44444444-0503-0000-0000-000000000001',
   '33333333-0503-0000-0000-000000000001',
   'What should you do immediately after checking a kick?',
   'multiple_choice',
   '[{"id":"a","text":"Hop backward to create distance","is_correct":false},{"id":"b","text":"Drop your hands to regain balance","is_correct":false},{"id":"c","text":"Counter with a strike while the opponent is off-balance","is_correct":true},{"id":"d","text":"Wait for the next attack","is_correct":false}]',
   'c',
   'After checking a kick, the opponent is momentarily off-balance. Counter immediately with a cross or body kick for maximum effect.',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- QUIZ QUESTIONS — Module 6: Wai Kru & Culture
-- ============================================
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0601-0000-0000-000000000001',
   '33333333-0603-0000-0000-000000000001',
   'What does "Wai Kru" translate to?',
   'multiple_choice',
   '[{"id":"a","text":"Fighting dance","is_correct":false},{"id":"b","text":"Paying respect to the teacher","is_correct":true},{"id":"c","text":"Prayer before battle","is_correct":false},{"id":"d","text":"Warming up","is_correct":false}]',
   'b',
   'Wai Kru means "paying respect to the teacher." Wai is the respectful gesture, Kru means teacher.',
   0),
  ('44444444-0602-0000-0000-000000000001',
   '33333333-0603-0000-0000-000000000001',
   'Why is it disrespectful to sit with your feet pointed at someone in a Thai gym?',
   'multiple_choice',
   '[{"id":"a","text":"Feet are considered dirty in Thai culture","is_correct":false},{"id":"b","text":"The feet are the lowest part of the body and pointing them at someone is deeply disrespectful in Thai culture","is_correct":true},{"id":"c","text":"It blocks the walkway","is_correct":false},{"id":"d","text":"It is only a gym rule, not a cultural practice","is_correct":false}]',
   'b',
   'In Thai culture, feet are the lowest part of the body both physically and spiritually. Pointing them at a person or sacred object is considered very rude.',
   1),
  ('44444444-0603-0000-0000-000000000001',
   '33333333-0603-0000-0000-000000000001',
   'What does "nam jai" (น้ำใจ) mean?',
   'multiple_choice',
   '[{"id":"a","text":"Water of life","is_correct":false},{"id":"b","text":"Fighting spirit","is_correct":false},{"id":"c","text":"Generosity of spirit (water of the heart)","is_correct":true},{"id":"d","text":"Heart of a warrior","is_correct":false}]',
   'c',
   'Nam jai literally means "water of the heart" — generosity of spirit. It is the guiding principle of respect and kindness in Thai gym culture.',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- QUIZ QUESTIONS — Module 7: Pad Work
-- ============================================
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0701-0000-0000-000000000001',
   '33333333-0703-0000-0000-000000000001',
   'Who sets the rhythm during pad work?',
   'multiple_choice',
   '[{"id":"a","text":"The striker","is_correct":false},{"id":"b","text":"The pad holder","is_correct":true},{"id":"c","text":"Both equally","is_correct":false},{"id":"d","text":"Neither — you go at your own pace","is_correct":false}]',
   'b',
   'The pad holder leads the round. They call combinations, set the pace, and decide when to push the striker harder.',
   0),
  ('44444444-0702-0000-0000-000000000001',
   '33333333-0703-0000-0000-000000000001',
   'You should always wai your pad holder before and after a round.',
   'true_false',
   '[{"id":"true","text":"True","is_correct":true},{"id":"false","text":"False","is_correct":false}]',
   'true',
   'Always wai (bow with palms together) your pad holder before and after. This is a sign of respect, especially when a trainer holds for you.',
   1),
  ('44444444-0703-0000-0000-000000000001',
   '33333333-0703-0000-0000-000000000001',
   'What should you focus on when hitting pads as a beginner?',
   'multiple_choice',
   '[{"id":"a","text":"Hitting as hard as possible","is_correct":false},{"id":"b","text":"Speed above all else","is_correct":false},{"id":"c","text":"Accuracy — hitting the center of the pad","is_correct":true},{"id":"d","text":"Showing off advanced combinations","is_correct":false}]',
   'c',
   'Accuracy over power. Hit the center of the pad with clean technique. Power comes naturally as your form improves.',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- QUIZ QUESTIONS — Module 8: History
-- ============================================
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0801-0000-0000-000000000001',
   '33333333-0803-0000-0000-000000000001',
   'Why is Muay Thai called the "Art of Eight Limbs"?',
   'multiple_choice',
   '[{"id":"a","text":"Because fights last 8 rounds","is_correct":false},{"id":"b","text":"Because it uses fists (2), elbows (2), knees (2), and shins (2)","is_correct":true},{"id":"c","text":"Because there are 8 weight classes","is_correct":false},{"id":"d","text":"Because Muay Boran had 8 techniques","is_correct":false}]',
   'b',
   'Muay Thai uses 8 points of contact: two fists, two elbows, two knees, and two shins — making it the most versatile striking art.',
   0),
  ('44444444-0802-0000-0000-000000000001',
   '33333333-0803-0000-0000-000000000001',
   'Who was Nai Khanomtom and why is he important?',
   'multiple_choice',
   '[{"id":"a","text":"The first Muay Thai champion at Lumpinee Stadium","is_correct":false},{"id":"b","text":"A captured Thai boxer who defeated 10 Burmese opponents in 1774","is_correct":true},{"id":"c","text":"The founder of modern Muay Thai rules","is_correct":false},{"id":"d","text":"The king who made Muay Thai a national sport","is_correct":false}]',
   'b',
   'Nai Khanomtom was captured during a war with Burma and defeated 10 Burmese champions in succession using Muay Boran. His victory is celebrated on March 17 — National Muay Thai Day.',
   1),
  ('44444444-0803-0000-0000-000000000001',
   '33333333-0803-0000-0000-000000000001',
   'Which two stadiums are considered the spiritual home of Muay Thai?',
   'multiple_choice',
   '[{"id":"a","text":"Rajadamnern and Lumpinee","is_correct":true},{"id":"b","text":"Lumpinee and Omnoi","is_correct":false},{"id":"c","text":"Rajadamnern and Channel 7","is_correct":false},{"id":"d","text":"Lumpinee and ONE Championship Arena","is_correct":false}]',
   'a',
   'Lumpinee (run by the Royal Thai Army) and Rajadamnern (opened 1945) are the two most prestigious Muay Thai stadiums. Holding a title at either is the highest honor.',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- QUIZ QUESTIONS — Module 9: Final Assessment
-- (10 questions spanning all 7 skills)
-- ============================================
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0901-0000-0000-000000000001',
   '33333333-0902-0000-0000-000000000001',
   'In the Muay Thai stance, your chin should be:',
   'multiple_choice',
   '[{"id":"a","text":"Lifted up for visibility","is_correct":false},{"id":"b","text":"Tucked down, looking through your eyebrows","is_correct":true},{"id":"c","text":"Turned to the side","is_correct":false},{"id":"d","text":"It does not matter","is_correct":false}]',
   'b',
   'Chin tucked protects you from uppercuts and straight punches. Look through your eyebrows, not over your guard.',
   0),
  ('44444444-0902-0000-0000-000000000001',
   '33333333-0902-0000-0000-000000000001',
   'What is the primary purpose of the jab in Muay Thai?',
   'multiple_choice',
   '[{"id":"a","text":"To deliver maximum damage","is_correct":false},{"id":"b","text":"To measure distance and set up power strikes","is_correct":true},{"id":"c","text":"To block incoming kicks","is_correct":false},{"id":"d","text":"To clinch the opponent","is_correct":false}]',
   'b',
   'The jab is a rangefinder and setup tool. Speed and accuracy over power — it creates openings for the cross, kick, or teep.',
   1),
  ('44444444-0903-0000-0000-000000000001',
   '33333333-0902-0000-0000-000000000001',
   'The teep strikes with the ball of the foot and is a pushing motion.',
   'true_false',
   '[{"id":"true","text":"True","is_correct":true},{"id":"false","text":"False","is_correct":false}]',
   'true',
   'Correct. The teep uses the ball of the foot and pushes through the target — never the toes, never a flicking motion.',
   2),
  ('44444444-0904-0000-0000-000000000001',
   '33333333-0902-0000-0000-000000000001',
   'When checking a kick, your hands should:',
   'multiple_choice',
   '[{"id":"a","text":"Reach down to grab the incoming leg","is_correct":false},{"id":"b","text":"Stay in guard position at cheekbone height","is_correct":true},{"id":"c","text":"Extend forward for balance","is_correct":false},{"id":"d","text":"Cover your stomach","is_correct":false}]',
   'b',
   'Hands stay up during a check. Dropping your guard is one of the most common beginner mistakes — the opponent will follow a kick with a punch.',
   3),
  ('44444444-0905-0000-0000-000000000001',
   '33333333-0902-0000-0000-000000000001',
   'How many bows are traditionally performed during the Wai Kru?',
   'multiple_choice',
   '[{"id":"a","text":"One","is_correct":false},{"id":"b","text":"Two","is_correct":false},{"id":"c","text":"Three","is_correct":true},{"id":"d","text":"Five","is_correct":false}]',
   'c',
   'Three bows — traditionally to Buddha, Dharma, and Sangha, or to your teacher, your gym, and your parents/family.',
   4),
  ('44444444-0906-0000-0000-000000000001',
   '33333333-0902-0000-0000-000000000001',
   'During pad work, who leads the round?',
   'multiple_choice',
   '[{"id":"a","text":"The striker","is_correct":false},{"id":"b","text":"The pad holder","is_correct":true},{"id":"c","text":"They take turns leading","is_correct":false},{"id":"d","text":"Neither — it is freestyle","is_correct":false}]',
   'b',
   'The pad holder sets the rhythm, calls combinations, and controls the pace. The striker follows their lead.',
   5),
  ('44444444-0907-0000-0000-000000000001',
   '33333333-0902-0000-0000-000000000001',
   'Muay Boran is:',
   'multiple_choice',
   '[{"id":"a","text":"A modern fitness variation of Muay Thai","is_correct":false},{"id":"b","text":"The ancient battlefield martial art from which Muay Thai evolved","is_correct":true},{"id":"c","text":"A type of clinch technique","is_correct":false},{"id":"d","text":"The name of a famous stadium","is_correct":false}]',
   'b',
   'Muay Boran means "ancient boxing" — the battlefield fighting system used by Siamese soldiers that evolved into modern Muay Thai.',
   6),
  ('44444444-0908-0000-0000-000000000001',
   '33333333-0902-0000-0000-000000000001',
   'The cross gets its power primarily from the arm muscles.',
   'true_false',
   '[{"id":"true","text":"True","is_correct":false},{"id":"false","text":"False","is_correct":true}]',
   'false',
   'The cross is a whole-body technique. Power comes from the ground through the rear foot, hip rotation, shoulder turn, and finally the arm. Arm-only punching loses 70% of potential power.',
   7),
  ('44444444-0909-0000-0000-000000000001',
   '33333333-0902-0000-0000-000000000001',
   'What year did Nai Khanomtom defeat 10 Burmese opponents?',
   'multiple_choice',
   '[{"id":"a","text":"1654","is_correct":false},{"id":"b","text":"1774","is_correct":true},{"id":"c","text":"1892","is_correct":false},{"id":"d","text":"1945","is_correct":false}]',
   'b',
   '1774. This legendary event is celebrated every March 17 as National Muay Thai Day (Boxer''s Day).',
   8),
  ('44444444-0910-0000-0000-000000000001',
   '33333333-0902-0000-0000-000000000001',
   'After completing this course, what is your next step toward Naga certification?',
   'multiple_choice',
   '[{"id":"a","text":"You automatically receive the certificate","is_correct":false},{"id":"b","text":"Visit a certified gym for an in-person skill assessment with a trainer","is_correct":true},{"id":"c","text":"Submit a video of your techniques online","is_correct":false},{"id":"d","text":"Wait 30 days and retake the final quiz","is_correct":false}]',
   'b',
   'The online course qualifies you for certification, but the actual Naga certificate is issued after an in-person assessment at a certified gym where a trainer verifies your skills.',
   9)
ON CONFLICT DO NOTHING;

-- ============================================
-- 019: Seed Phayra Nak Certification Course (Level 2)
-- Maps directly to the 7 Phayra Nak skills in
-- lib/certification-levels.ts
-- Requires Naga (Level 1) certificate + 7 day wait
-- ============================================

-- Insert the course (platform-wide, no org_id)
INSERT INTO courses (
  id, org_id, title, slug, description, short_description,
  difficulty, category, certificate_level,
  is_free, price_thb, status, is_featured, display_order,
  total_modules, total_lessons, estimated_hours
) VALUES (
  '11111111-0000-0000-0000-000000000002',
  NULL,
  'Phayra Nak Certification — Level 2',
  'phayra-nak-certification',
  'The second level of Thailand''s national Muay Thai certification system. Build on your Naga foundation with combinations, clinch work, elbow and knee strikes, and conditioning fundamentals. Completing this course qualifies you for the Phayra Nak (Level 2) certification assessment.',
  'Advance your Muay Thai with combinations, clinch, elbows, knees, and conditioning.',
  'intermediate',
  'certification',
  'phayra-nak',
  FALSE,
  10000,
  'published',
  TRUE,
  2,
  9, 19, 12.0
) ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- MODULES (9 total)
-- ============================================

INSERT INTO course_modules (id, course_id, title, description, module_order) VALUES
  ('22222222-0001-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002',
   'Welcome to Phayra Nak',
   'What Level 2 demands, how it builds on Naga, and what the Serpent King represents in Muay Thai.',
   0),
  ('22222222-0002-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002',
   '3-Strike Combinations',
   'Learn to chain jab-cross-kick and other three-strike sequences with proper flow and timing.',
   1),
  ('22222222-0003-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002',
   'Footwork Patterns',
   'Master angles, pivots, lateral movement, and ring cutting — the geometry of fighting.',
   2),
  ('22222222-0004-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002',
   'Basic Clinch Entry & Control',
   'The clinch is uniquely Muay Thai. Learn how to enter, establish inside control, and maintain position.',
   3),
  ('22222222-0005-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002',
   'Defensive Counters',
   'Move from passive defense to active countering — catch and return, parry and strike.',
   4),
  ('22222222-0006-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002',
   'Elbow Strikes (Sok)',
   'The most devastating close-range weapons in Muay Thai — sok tat (horizontal) and sok ti (uppercut elbow).',
   5),
  ('22222222-0007-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002',
   'Knee Strikes from Range (Khao Trong)',
   'The straight knee — Muay Thai''s signature body weapon. Learn to generate power from range.',
   6),
  ('22222222-0008-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002',
   'Conditioning Fundamentals',
   'Skipping, shadow boxing, and the traditional conditioning methods that build a nak muay''s engine.',
   7),
  ('22222222-0009-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002',
   'Final Assessment',
   'Review all Phayra Nak skills and take the comprehensive knowledge assessment.',
   8)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 1: Welcome to Phayra Nak
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0101-0000-0000-000000000002',
   '11111111-0000-0000-0000-000000000002',
   '22222222-0001-0000-0000-000000000002',
   'The Serpent King — What Level 2 Means',
   'text', 0, TRUE, 6,
   '# The Serpent King — Phayra Nak

Welcome to Level 2 of the Naga-to-Garuda Muay Thai Certification System.

## From Naga to Phayra Nak

In Thai mythology, the Phayra Nak (พญานาค) is the Serpent King — the ruler of all Nagas. Where the Naga represents a student who has entered the water, the Phayra Nak has learned to command it.

At Level 1 you learned to stand, strike, defend, and respect. Now you will learn to **combine**, **move**, **clinch**, and **condition** — the four pillars that separate a beginner from an intermediate nak muay.

## What You Will Learn

1. **3-Strike Combinations** — Chaining attacks with flow and timing
2. **Footwork Patterns** — Angles, pivots, and ring control
3. **Basic Clinch** — Entering and controlling the clinch position
4. **Defensive Counters** — Catch-and-return, parry-and-strike
5. **Elbow Strikes** — Sok tat and sok ti at close range
6. **Knee Strikes** — Khao trong from range
7. **Conditioning** — Skipping, shadow boxing, traditional methods

## Prerequisites

- Naga (Level 1) certification
- Minimum 7 days since Naga was issued
- All 7 Naga skills signed off

## Assessment Format

After completing this coursework, visit your gym for in-person skill assessment. Your trainer will evaluate each of the 7 Phayra Nak skills before issuing your certificate.'),

  ('33333333-0102-0000-0000-000000000002',
   '11111111-0000-0000-0000-000000000002',
   '22222222-0001-0000-0000-000000000002',
   'Level 2 Training Philosophy',
   'text', 1, TRUE, 5,
   '# Level 2 Training Philosophy

## From Techniques to Combinations

At Level 1 you learned individual techniques in isolation — a jab, a cross, a teep, a block. Level 2 is about **connecting** those tools into flowing sequences.

A single strike is easy to defend. Two strikes are harder. Three strikes from different angles, using different weapons? That is Muay Thai.

## The Thai Concept of "Lom" (Flow)

Thai trainers talk about **lom** (ลม) — literally "wind." A fighter with good lom moves from strike to strike like wind through trees. There are no pauses, no resets, no telegraphing.

Bad lom looks like: jab... pause... cross... pause... kick.
Good lom looks like: jab-cross-kick — one continuous motion.

## Training at This Level

Your daily training should now include:

- **15 minutes** of shadow boxing (not just warming up — drilling combinations)
- **3 rounds** of pad work focusing on 3-strike combinations
- **2 rounds** of clinch work with a partner
- **10 minutes** of conditioning (skipping, bodyweight exercises)

## The Mental Shift

Level 2 asks you to think **two steps ahead**. When you throw a jab, you should already know whether the cross or the kick comes next. Your body learns this through repetition — thousands of repetitions.

This is not about talent. It is about training.')
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 2: 3-Strike Combinations
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0201-0000-0000-000000000002',
   '11111111-0000-0000-0000-000000000002',
   '22222222-0002-0000-0000-000000000002',
   'Building the Jab-Cross-Kick',
   'text', 0, FALSE, 8,
   '# Building the Jab-Cross-Kick

The jab-cross-kick is the most fundamental combination in Muay Thai. It uses all three ranges — long (jab), medium (cross), close-medium (kick) — and attacks different levels of the body.

## Why This Combination Works

1. **The jab** measures distance and blinds the opponent
2. **The cross** generates power through hip rotation
3. **The kick** takes advantage of the opponent''s guard being high from blocking punches

This is called **level changing** — attacking head then body, or body then head. It is one of the most effective principles in all striking arts.

## Breaking Down the Mechanics

### The Jab
- From your Naga stance, extend the lead hand straight
- Snap it back immediately — the jab is about speed, not power
- The jab creates the opening; it does not need to hurt

### The Cross (Mat Trong)
- As the jab retracts, the rear hand fires
- Rotate the rear hip fully — this is where power comes from
- Your weight shifts to the lead leg momentarily

### The Rear Kick (Te Tat)
- As the cross retracts, the rear leg swings
- The hip that rotated for the cross now continues rotating for the kick
- Turn over on the ball of the standing foot
- Strike with the lower shin, not the foot

## The Connection Point

The secret is the **hip rotation**. The cross rotates your hips one direction. The kick continues that same rotation. There is no pause, no reset. One motion flows into the next.

Think of it as a whip — the jab is the tip, the cross is the middle, the kick is the handle driving everything.

## Common Mistakes

- **Resetting between strikes** — dropping hands, standing up straight
- **Arm punching the cross** — no hip rotation means no power and no flow into the kick
- **Telegraphing the kick** — if you lean back before kicking, the opponent knows it is coming
- **Kicking with the foot** — always strike with the shin'),

  ('33333333-0202-0000-0000-000000000002',
   '11111111-0000-0000-0000-000000000002',
   '22222222-0002-0000-0000-000000000002',
   'Combination Variations',
   'text', 1, FALSE, 7,
   '# Combination Variations

The jab-cross-kick is your base. Now learn to modify it.

## Variation 1: Jab-Cross-Low Kick

Same combination, but the kick targets the thigh instead of the body or head. Thai fighters call the low kick **te tat kha** (เตะตัดขา) — literally "leg cutting kick."

The low kick is devastating because:
- It accumulates damage over rounds
- It compromises the opponent''s stance and movement
- It is harder to check than a body kick because it comes lower

## Variation 2: Jab-Body Cross-Head Kick

Throw the cross to the body (bend your knees, don''t lean down), then kick to the head. This is an advanced level change — going low then high.

The body shot pulls the opponent''s guard down. The kick exploits the opening upstairs.

## Variation 3: Double Jab-Cross-Kick

Add a second jab before the cross. The rhythm changes from 1-2-3 to 1-1-2-3. This disrupts the opponent''s timing because the second jab comes when they expect the cross.

## Variation 4: Jab-Cross-Switch Kick

Instead of kicking with the rear leg, switch your stance mid-combination and kick with what was the lead leg. This is faster and comes from an unexpected angle.

The switch kick (te tat klab) is a signature technique of many Thai champions.

## When to Use Each

- **Standard jab-cross-kick**: Your bread and butter. Use it to start exchanges.
- **Low kick variation**: When the opponent has a narrow stance or plants their lead leg.
- **Body-head variation**: Against opponents who shell up and protect only the head.
- **Double jab variation**: Against opponents who time your rhythm.
- **Switch kick variation**: When you need speed over power, or to surprise.

## Training Method

Practice each variation 50 times per side on pads. Then have your pad holder call random variations by number (1 through 5). This builds pattern recognition and automatic response.'),

  ('33333333-0203-0000-0000-000000000002',
   '11111111-0000-0000-0000-000000000002',
   '22222222-0002-0000-0000-000000000002',
   '3-Strike Combination Drill',
   'drill', 2, FALSE, 15,
   '# 3-Strike Combination Drill

## Equipment Needed
- Thai pads or heavy bag
- Timer (3-minute rounds, 1-minute rest)

## Round 1 — Base Combination (3 minutes)
Jab-cross-rear kick. Alternate sides every 10 reps.
Focus: smooth flow between strikes, no pausing between the cross and kick.

## Round 2 — Low Kick Variation (3 minutes)
Jab-cross-low kick. Target the heavy bag at thigh height or have pad holder angle the pad down.
Focus: drop the kick angle without leaning back.

## Round 3 — Body-Head Level Change (3 minutes)
Jab-body cross-head kick. Bend knees for the body shot, then explode upward for the kick.
Focus: making the level change smooth, not telegraphing.

## Round 4 — Double Jab Variation (3 minutes)
Double jab-cross-kick. Play with the rhythm — fast-fast-power-power.
Focus: the second jab should be harder than the first.

## Round 5 — Random Call (3 minutes)
Partner calls 1-5, you throw the corresponding variation immediately.
Focus: reaction time and automatic execution.

## Cool Down
50 teeps (front kicks) each side, slow and controlled. Stretch hip flexors and hamstrings.')
ON CONFLICT DO NOTHING;

-- Quiz for Module 2
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0201-0000-0000-000000000002',
   '33333333-0203-0000-0000-000000000002',
   'What is the key mechanical connection between the cross and the rear kick in the jab-cross-kick combination?',
   'multiple_choice',
   '[{"id":"a","text":"They use different muscle groups so you can rest between them"},{"id":"b","text":"The hip rotation from the cross continues into the kick rotation"},{"id":"c","text":"You need to reset your stance between the two strikes"},{"id":"d","text":"The cross should be thrown with the same leg that kicks"}]',
   'b',
   'The cross rotates the hips in one direction, and the kick continues that same rotation. This creates a fluid, powerful combination with no pause between strikes.',
   0),
  ('44444444-0202-0000-0000-000000000002',
   '33333333-0203-0000-0000-000000000002',
   'What does "te tat kha" mean in Thai?',
   'multiple_choice',
   '[{"id":"a","text":"Head kick"},{"id":"b","text":"Body punch"},{"id":"c","text":"Leg cutting kick"},{"id":"d","text":"Spinning elbow"}]',
   'c',
   'Te tat kha (เตะตัดขา) literally translates to "leg cutting kick" — referring to the devastating low kick that targets the opponent''s thigh.',
   1),
  ('44444444-0203-0000-0000-000000000002',
   '33333333-0203-0000-0000-000000000002',
   'A double jab before the cross disrupts the opponent because it changes the rhythm they expect.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'true',
   'The opponent expects the pattern jab-cross. When you add a second jab, the cross arrives when they expect a kick or pause, breaking their defensive timing.',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 3: Footwork Patterns
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0301-0000-0000-000000000002',
   '11111111-0000-0000-0000-000000000002',
   '22222222-0003-0000-0000-000000000002',
   'Angles and Pivots',
   'text', 0, FALSE, 8,
   '# Angles and Pivots

At Level 1 you learned to stand still in a good stance. At Level 2 you learn to **move** in that stance.

## Why Footwork Matters

A common misconception is that Muay Thai is a flat-footed, forward-marching art. Watch any stadium fight in Bangkok and you will see something different — fighters constantly adjusting angles, cutting off the ring, and pivoting to create openings.

## The Four Directions

### Forward Step (Kao Na)
- Lead foot steps first, rear foot follows
- Never cross your feet — maintain your stance width
- Use this to close distance before striking

### Backward Step (Thoi Lang)
- Rear foot steps first, lead foot follows
- Keep your guard up — retreating fighters often drop their hands
- Combine with teep to maintain distance

### Lateral Step (Khao Khang)
- Step to the side with the foot closest to that direction
- The other foot follows immediately
- Creates angles for attack — step left and throw the rear kick

### The Pivot (Mun Tua)
- Plant the lead foot and spin on the ball of that foot
- Rotate 45-90 degrees to create a new angle
- Essential after throwing combinations — pivot out rather than backing straight up

## The Diamond Drill

Imagine you are standing on a diamond shape on the floor:
1. Step forward to the front point
2. Step to the right point
3. Step backward to the rear point
4. Step to the left point

Repeat while maintaining your guard and stance. This builds automatic footwork patterns.

## Thai vs. Western Footwork

In boxing, footwork is about constant small shuffles. In Muay Thai, footwork is more deliberate — bigger steps, more weight committed. This is because Thai fighters must also defend against kicks and knees, which require a stable base.

The key principle: **move, plant, strike**. Never strike while your feet are moving.'),

  ('33333333-0302-0000-0000-000000000002',
   '11111111-0000-0000-0000-000000000002',
   '22222222-0003-0000-0000-000000000002',
   'Footwork Drill — Ring Cutting',
   'drill', 1, FALSE, 12,
   '# Footwork Drill — Ring Cutting

## Concept
Ring cutting means using footwork to trap your opponent against the ropes or corner. Instead of chasing them in a straight line, you cut off their escape angles.

## Equipment
- Open space (ring or mat area)
- Partner (or cones for solo drill)

## Solo Drill (3 rounds x 3 minutes)

### Round 1 — Diamond Pattern
Move through all four points of the diamond pattern. After each step, throw a jab-cross. Reset stance. Next direction. Focus on maintaining proper stance through all movements.

### Round 2 — Pivot Drill
Step forward with a jab. Pivot 45 degrees left. Jab-cross. Pivot 45 degrees right. Jab-cross-kick. Repeat. The pivot should be fast and keep your balance.

### Round 3 — Cut and Strike
Imagine an opponent retreating backward and to the right. Step forward-right at a diagonal angle. Throw rear kick. They move left — step left and throw jab-cross. Always cut the angle, never follow straight.

## Partner Drill (3 rounds x 3 minutes)
One person retreats around the ring. The other person practices cutting off their movement using lateral steps and pivots. No striking — just footwork. Switch roles each round.

## Key Points
- Never cross your feet
- Always maintain stance width
- Plant before you strike
- Control the center of the ring')
ON CONFLICT DO NOTHING;

-- Quiz for Module 3
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0301-0000-0000-000000000002',
   '33333333-0302-0000-0000-000000000002',
   'What is the key principle of Muay Thai footwork regarding striking?',
   'multiple_choice',
   '[{"id":"a","text":"Strike while moving forward for maximum momentum"},{"id":"b","text":"Move, plant, strike — never strike while your feet are moving"},{"id":"c","text":"Keep both feet in the air for maximum flexibility"},{"id":"d","text":"Shuffle constantly like a boxer"}]',
   'b',
   'In Muay Thai, you must plant your feet before striking. Striking while moving compromises balance and power, and leaves you vulnerable to sweeps and trips.',
   0),
  ('44444444-0302-0000-0000-000000000002',
   '33333333-0302-0000-0000-000000000002',
   'What does "ring cutting" mean?',
   'multiple_choice',
   '[{"id":"a","text":"Damaging the ring ropes with kicks"},{"id":"b","text":"Using footwork to trap your opponent against the ropes or corner"},{"id":"c","text":"Running laps around the ring"},{"id":"d","text":"A type of knee strike"}]',
   'b',
   'Ring cutting means using lateral movement and diagonal steps to cut off your opponent''s escape routes, trapping them against the ropes or in a corner where you can attack.',
   1),
  ('44444444-0303-0000-0000-000000000002',
   '33333333-0302-0000-0000-000000000002',
   'In Muay Thai footwork, you should cross your feet to move faster.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'You should never cross your feet in Muay Thai. Crossing your feet compromises your balance and makes you vulnerable to sweeps. Always maintain your stance width when moving.',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 4: Basic Clinch Entry & Control
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0401-0000-0000-000000000002',
   '11111111-0000-0000-0000-000000000002',
   '22222222-0004-0000-0000-000000000002',
   'The Muay Thai Clinch — Plam',
   'text', 0, FALSE, 8,
   '# The Muay Thai Clinch — Plam (ปล้ำ)

The clinch is what separates Muay Thai from every other striking art. While boxing and kickboxing break the clinch immediately, Muay Thai fighters actively seek it — because inside the clinch, you can throw knees, elbows, and sweeps.

## Why the Clinch Matters

In Thailand, the clinch often decides fights. Judges award points for clinch dominance, successful knees in the clinch, and sweeps/dumps. A fighter who controls the clinch controls the fight.

## Clinch Positions (Basic)

### Double Collar Tie (Plam Khaw)
- Both hands behind the opponent''s head/neck
- Fingers interlocked (never thumbs — they can be broken)
- Elbows tight against the opponent''s collarbone
- Pull their head down while keeping yours up

### Single Collar Tie
- One hand behind the head, one hand on the bicep or inside the elbow
- Used when you cannot secure both hands behind the head
- Good transitional position

### Inside Position
- Your arms are inside their arms
- This is the dominant position — you control their posture
- Always fight for inside position

## Entering the Clinch

### From Punching Range
1. Throw a jab-cross combination
2. On the cross, step forward with your lead foot
3. Your cross hand slides to the back of their neck
4. Your other hand follows immediately
5. Pull them into you while stepping your hips close

### From Kick Defense
1. Catch or block a kick
2. Step forward immediately while they''re on one leg
3. Secure the collar tie before they can reset

### From Body-to-Body
1. After an exchange where you end up chest-to-chest
2. Swim your hands to inside position
3. Establish the collar tie

## First Rule of the Clinch

**Posture**. Keep your head up, back straight, and hips close to your opponent. The fighter who controls their posture controls the clinch.'),

  ('33333333-0402-0000-0000-000000000002',
   '11111111-0000-0000-0000-000000000002',
   '22222222-0004-0000-0000-000000000002',
   'Clinch Entry Drill',
   'drill', 1, FALSE, 15,
   '# Clinch Entry Drill

## Equipment
- Partner (required)
- Mouthguard recommended

## Warm Up (5 minutes)
Pummeling drill: face your partner, both in stance. Alternate swimming for inside position — right under, left under, right under. No striking, just hand fighting. Build a rhythm.

## Drill 1 — Punch-to-Clinch Entry (3 rounds x 2 minutes)
Throw jab-cross at partner (light contact or pads). On the cross, close distance and secure double collar tie. Hold for 3 seconds, then release and reset. Partner does not resist initially.

## Drill 2 — Kick Catch to Clinch (3 rounds x 2 minutes)
Partner throws a slow rear kick. Catch the kick with both hands. Step forward while they''re on one leg and secure the clinch. Hold for 3 seconds, release.

## Drill 3 — Inside Position Fighting (3 rounds x 2 minutes)
Both partners clinch. Fight for inside position only — no striking, no knees. The goal is to get both your hands inside their arms and secure the collar tie. Restart when someone achieves and holds inside position for 3 seconds.

## Drill 4 — Clinch and Knee (3 rounds x 2 minutes)
Secure the clinch. Throw one controlled knee (light contact). Partner absorbs. Release and switch roles. Focus on pulling the opponent into the knee.

## Key Points
- Stay on the balls of your feet in the clinch
- Keep your elbows tight — wide elbows lose position
- Breathe — clinch work is exhausting
- Never look down — keep your head up')
ON CONFLICT DO NOTHING;

-- Quiz for Module 4
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0401-0000-0000-000000000002',
   '33333333-0402-0000-0000-000000000002',
   'What is the dominant position in the Muay Thai clinch?',
   'multiple_choice',
   '[{"id":"a","text":"Arms outside the opponent''s arms"},{"id":"b","text":"Arms inside the opponent''s arms (inside position)"},{"id":"c","text":"Both hands on the opponent''s waist"},{"id":"d","text":"One hand on each shoulder"}]',
   'b',
   'Inside position — where your arms are inside your opponent''s arms — is the dominant position because it gives you control over their posture and allows you to pull them into knees.',
   0),
  ('44444444-0402-0000-0000-000000000002',
   '33333333-0402-0000-0000-000000000002',
   'What is the Thai word for the clinch?',
   'multiple_choice',
   '[{"id":"a","text":"Teep"},{"id":"b","text":"Plam (ปล้ำ)"},{"id":"c","text":"Sok"},{"id":"d","text":"Khao"}]',
   'b',
   'Plam (ปล้ำ) is the Thai word for clinch/grappling. It is one of the most important aspects of Muay Thai fighting.',
   1),
  ('44444444-0403-0000-0000-000000000002',
   '33333333-0402-0000-0000-000000000002',
   'When entering the clinch from punching range, you should step backward to create space.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'You must step forward to close the distance when entering the clinch. After throwing a cross, step your lead foot forward and slide your hand to the back of the opponent''s neck.',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 5: Defensive Counters
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0501-0000-0000-000000000002',
   '11111111-0000-0000-0000-000000000002',
   '22222222-0005-0000-0000-000000000002',
   'From Defense to Offense — Catch and Return',
   'text', 0, FALSE, 8,
   '# From Defense to Offense — Catch and Return

At Level 1, you learned the basic shin block. Now you will learn to turn every defense into an immediate attack.

## The Principle of Counter-Fighting

In Thai scoring, a clean counter is worth more than the initial attack. Judges respect the fighter who reads the opponent, defends calmly, and punishes them for attacking. This is called **muay femur** (มวยเฟมือ) — the intelligent fighter.

## Catch and Return

### Catching the Body Kick
1. As the kick comes, absorb it on your forearm and elbow (same as Level 1 block)
2. Immediately trap the kicking leg by pressing your elbow down on it
3. You now have their leg — they are on one foot
4. Options from here:
   - **Sweep**: hook their standing leg with your rear foot
   - **Cross**: throw a hard cross to their exposed body
   - **Dump**: turn their body and push/pull them to the ground

### The Key: Immediate Response
The catch must flow directly into the return. If you catch and pause, the opponent will recover their leg. The sequence is: block-catch-strike — one motion.

## Parry and Strike

### Parrying the Jab
1. Use your rear hand to tap the jab to the outside
2. Simultaneously step to the outside angle
3. You are now at an angle where you can strike and they cannot
4. Throw the rear cross or rear kick

### Parrying the Cross
1. Use your lead hand to redirect the cross across your body
2. Step slightly to the inside angle
3. Counter with a lead hook or lead elbow

## The Teep Counter

When the opponent throws a punch combination:
1. Step back slightly
2. Fire the teep into their midsection as they step forward
3. Their forward momentum multiplies the impact

This is called **teep tawaan** — the "answering teep." It stops forward pressure and scores well with judges.

## Training the Counter Mindset

Most beginners think: "I need to attack more." Level 2 teaches you: "I need to make them pay for attacking me." The best fighters in Thailand throw fewer strikes — but every strike is meaningful.'),

  ('33333333-0502-0000-0000-000000000002',
   '11111111-0000-0000-0000-000000000002',
   '22222222-0005-0000-0000-000000000002',
   'Counter Drill — React and Return',
   'drill', 1, FALSE, 15,
   '# Counter Drill — React and Return

## Equipment
- Partner with Thai pads or focus mitts
- Space for movement

## Drill 1 — Catch and Cross (3 rounds x 3 minutes)
Partner throws slow-medium rear kicks. You check/catch the kick, trap the leg for one second, then throw a hard cross to the pad. Release and reset. Focus on the catch flowing into the cross — no pause.

## Drill 2 — Catch and Sweep (3 rounds x 2 minutes)
Partner throws slow rear kicks. Catch the kick. Instead of striking, hook their standing leg with your rear foot and guide them to the ground (gently in training). Reset. Focus on timing — sweep as you catch, not after.

## Drill 3 — Parry and Cross (3 rounds x 3 minutes)
Partner throws single jabs. Parry with your rear hand and simultaneously step to the outside angle. Throw the rear cross to the pad. Reset. Build the parry-step-strike as one motion.

## Drill 4 — Teep Counter (3 rounds x 2 minutes)
Partner steps forward with jab-cross (pads up). You step back and fire the teep before their cross lands. The teep should stop their forward movement. Reset and repeat.

## Drill 5 — Random Attack, Your Choice (3 rounds x 3 minutes)
Partner randomly throws: kick, jab, or jab-cross. You choose the appropriate counter:
- Kick → catch and cross
- Jab → parry and cross
- Jab-cross → teep counter

This builds reaction and decision-making under pressure.

## Cool Down
Light clinch pummeling with partner for 3 minutes. Stretch shoulders and hips.')
ON CONFLICT DO NOTHING;

-- Quiz for Module 5
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0501-0000-0000-000000000002',
   '33333333-0502-0000-0000-000000000002',
   'What does "muay femur" mean?',
   'multiple_choice',
   '[{"id":"a","text":"A powerful aggressive fighter"},{"id":"b","text":"An intelligent, technical fighter who uses counters"},{"id":"c","text":"A clinch specialist"},{"id":"d","text":"A fighter who only uses kicks"}]',
   'b',
   'Muay femur (มวยเฟมือ) describes an intelligent, technical fighter who reads opponents and uses well-timed counters rather than brute aggression. It is considered the highest art form in Muay Thai.',
   0),
  ('44444444-0502-0000-0000-000000000002',
   '33333333-0502-0000-0000-000000000002',
   'After catching an opponent''s kick, what are your three main options?',
   'multiple_choice',
   '[{"id":"a","text":"Run away, duck, and jump"},{"id":"b","text":"Sweep their standing leg, cross to the body, or dump them"},{"id":"c","text":"Let go immediately and reset"},{"id":"d","text":"Hold their leg and wait for the referee"}]',
   'b',
   'After catching a kick, your three main counter options are: sweep (hook their standing leg), strike (cross to the exposed body), or dump (turn and push them to the ground).',
   1),
  ('44444444-0503-0000-0000-000000000002',
   '33333333-0502-0000-0000-000000000002',
   'The "teep tawaan" is an answering teep used to counter an opponent''s forward pressure.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'true',
   'Teep tawaan is the answering teep — thrown into the opponent''s midsection as they step forward to attack. Their forward momentum adds to the impact.',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 6: Elbow Strikes (Sok)
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0601-0000-0000-000000000002',
   '11111111-0000-0000-0000-000000000002',
   '22222222-0006-0000-0000-000000000002',
   'The Art of the Elbow — Sok Tat & Sok Ti',
   'text', 0, FALSE, 8,
   '# The Art of the Elbow — Sok Tat & Sok Ti

The elbow is the most dangerous weapon in Muay Thai. It is the sharpest bone in the body — a blade made of calcium. In Thailand, elbows are responsible for more cuts and stoppages than any other strike.

## Why Elbows Matter

Elbows work at a range where punches lose power. When you are too close for a full cross or hook, the elbow becomes your primary weapon. The saying in Thai boxing is: **"elbows are for cutting, knees are for breaking."**

## Sok Tat — Horizontal Elbow (ศอกตัด)

The horizontal elbow slashes across the opponent''s face like a blade.

### Technique
1. From your guard, keep the striking elbow bent at 90 degrees
2. Rotate your entire body — hips, torso, shoulder
3. The elbow cuts horizontally across, targeting the eyebrow, temple, or cheekbone
4. Follow through — the power comes from the rotation, not the arm
5. Your other hand stays protecting your chin

### When to Use
- After a cross lands and you are close
- Exiting the clinch
- As a counter when the opponent ducks into you

## Sok Ti — Uppercut Elbow (ศอกตี)

The uppercut elbow drives upward into the chin or nose.

### Technique
1. Drop your elbow slightly to load the strike
2. Drive upward using your legs and hips — think "standing up explosively"
3. The point of the elbow strikes under the chin
4. Keep your other hand protecting your face

### When to Use
- When the opponent''s head is low (after a body shot)
- As they duck under a hook
- Rising out of the clinch

## Safety in Training

**Elbows are trained on pads only.** Never throw elbows in light sparring. The risk of cuts is too high. In Thailand, elbow sparring only happens under strict supervision with headgear and at controlled speed.

Practice on focus mitts held at face height. The pad holder angles the mitt to simulate the target surface.

## The Mental Component

Learning elbows changes how you think about distance. Most beginners panic when an opponent gets close. After learning elbows, close range becomes your territory — a place where you have weapons and they may not expect them.'),

  ('33333333-0602-0000-0000-000000000002',
   '11111111-0000-0000-0000-000000000002',
   '22222222-0006-0000-0000-000000000002',
   'Elbow Strike Drill',
   'drill', 1, FALSE, 12,
   '# Elbow Strike Drill

## Equipment
- Focus mitts or Thai pads
- Partner to hold pads

## Round 1 — Sok Tat Isolation (3 minutes each side)
Partner holds mitt at face height, angled slightly. Throw sok tat (horizontal elbow) from your guard. Full hip rotation on every rep. 10 reps, reset, 10 reps. Focus on rotation speed, not arm strength.

## Round 2 — Sok Ti Isolation (3 minutes each side)
Partner holds mitt under their chin, pad facing down. Drive the uppercut elbow upward. Use your legs to power the strike. 10 reps, reset, 10 reps.

## Round 3 — Cross-Elbow Combination (3 minutes)
Throw a cross to the pad (partner holds at mid-level). As the cross retracts, step forward and throw sok tat to the face-height pad. The cross closes the distance, the elbow finishes. This is the most common elbow entry in fights.

## Round 4 — Jab-Cross-Sok Tat (3 minutes)
Full three-strike combination. Jab to the face pad, cross to the face pad, then sok tat as you step inside. The elbow should feel like the natural continuation of the cross.

## Round 5 — Defense to Elbow (3 minutes)
Partner throws a slow jab. Parry and step inside. Throw sok tat. Reset. This trains the counter-elbow — one of the most effective techniques in Muay Thai.

## Key Points
- Power comes from hip rotation, not arm muscles
- Keep the non-striking hand protecting your chin at all times
- Step into range for the elbow — do not reach
- Train on pads only, never in light sparring')
ON CONFLICT DO NOTHING;

-- Quiz for Module 6
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0601-0000-0000-000000000002',
   '33333333-0602-0000-0000-000000000002',
   'What is the difference between sok tat and sok ti?',
   'multiple_choice',
   '[{"id":"a","text":"Sok tat is a kick, sok ti is a punch"},{"id":"b","text":"Sok tat is horizontal (slashing), sok ti is vertical (uppercut)"},{"id":"c","text":"Sok tat uses the knee, sok ti uses the shin"},{"id":"d","text":"There is no difference"}]',
   'b',
   'Sok tat (ศอกตัด) is the horizontal/slashing elbow that cuts across the face. Sok ti (ศอกตี) is the uppercut elbow that drives upward into the chin. Both use the point of the elbow as the striking surface.',
   0),
  ('44444444-0602-0000-0000-000000000002',
   '33333333-0602-0000-0000-000000000002',
   'Where does the power for an elbow strike come from?',
   'multiple_choice',
   '[{"id":"a","text":"The arm muscles"},{"id":"b","text":"The wrist"},{"id":"c","text":"Hip rotation and body mechanics"},{"id":"d","text":"The shoulder only"}]',
   'c',
   'Like all Muay Thai strikes, elbow power comes from hip rotation and full body mechanics — not from muscling the arm. The rotation of the hips drives the torso and shoulder, which delivers the elbow.',
   1),
  ('44444444-0603-0000-0000-000000000002',
   '33333333-0602-0000-0000-000000000002',
   'It is safe to throw elbows during light sparring without headgear.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'Elbows should only be trained on pads. The risk of cuts is extremely high. Even in Thailand, elbow sparring only happens under strict supervision with protective equipment.',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 7: Knee Strikes (Khao Trong)
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0701-0000-0000-000000000002',
   '11111111-0000-0000-0000-000000000002',
   '22222222-0007-0000-0000-000000000002',
   'The Straight Knee — Khao Trong',
   'text', 0, FALSE, 8,
   '# The Straight Knee — Khao Trong (เข่าตรง)

The knee is Muay Thai''s most powerful body weapon. A clean knee to the midsection can end a fight instantly — cracking ribs, destroying the solar plexus, and breaking the opponent''s will to continue.

## Khao Trong — The Straight Knee

Khao trong drives forward and upward into the opponent''s body. Unlike a knee from the clinch (which you will learn at higher levels), the straight knee is thrown from punching range.

### Technique
1. From your stance, drive the rear knee forward and up
2. Rise up on the ball of your standing foot — get tall
3. Push your hips forward — the power comes from the hip thrust
4. Point the knee directly at the target (solar plexus, ribs, or liver)
5. Your hands stay in guard position or grab the opponent''s shoulders
6. Retract the knee back to stance — do not leave it hanging

### The Hip Thrust

The secret to a powerful knee is the **hip thrust**. Think of driving your belt buckle toward the target. The knee is just the contact point — the hips deliver the force.

Without the hip thrust, the knee is just lifting your leg. With it, your entire bodyweight is behind the strike.

## Range Considerations

The straight knee works at a very specific range — closer than kicking range but further than elbow range. This is sometimes called the "knee pocket."

To enter the knee pocket:
- Step forward behind a jab-cross combination
- Catch a kick and step in
- After blocking a punch, close distance

## Defending Against Knees

The primary defense is the **teep**. A well-timed teep pushes the opponent away before they can enter knee range. You can also:
- Step to the side (angle out)
- Push down on their hips with your hands
- Throw a low kick to disrupt their base before they can knee

## Thai Scoring

In Thai stadium scoring, a clean knee to the body scores very well. It demonstrates dominance and technique. Multiple clean knees can swing a round — judges see knees as a sign of the superior fighter.'),

  ('33333333-0702-0000-0000-000000000002',
   '11111111-0000-0000-0000-000000000002',
   '22222222-0007-0000-0000-000000000002',
   'Knee Strike Drill',
   'drill', 1, FALSE, 15,
   '# Knee Strike Drill

## Equipment
- Heavy bag or belly pad (partner-held)
- Thai pads for combination work

## Round 1 — Straight Knee Isolation (3 minutes each side)
Stand at arm''s length from the heavy bag. Drive the rear knee into the bag. Focus on the hip thrust — push your hips into the bag on every rep. 10 reps, switch sides. The bag should swing from the impact.

## Round 2 — Step and Knee (3 minutes)
Start at punching range. Step forward with the lead foot, then drive the rear knee. The step closes distance; the knee strikes. Reset to starting position each rep. Focus on the timing — step, then knee, not both at once.

## Round 3 — Jab-Cross-Knee (3 minutes)
Throw jab-cross to the Thai pads. On the cross, step forward and immediately drive the rear knee into the belly pad. The combination pulls the opponent''s guard up, the knee attacks the body underneath.

## Round 4 — Catch-to-Knee (3 minutes)
Partner throws a slow kick. Catch the kick with both hands. Pull them toward you and drive the knee into the belly pad. This is one of the most common knee entries in Thai fighting.

## Round 5 — Alternating Knees (3 minutes)
On the heavy bag. Left knee, right knee, left knee, right knee — continuous. Rise on the ball of the standing foot each time. This builds the rhythm and conditioning for sustained knee attacks. Target: 50+ knees per round.

## Cool Down
- 20 slow teeps each side (working the hip flexor)
- Deep lunge stretch — 30 seconds each side
- Butterfly stretch — 30 seconds')
ON CONFLICT DO NOTHING;

-- Quiz for Module 7
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0701-0000-0000-000000000002',
   '33333333-0702-0000-0000-000000000002',
   'What generates the power in a straight knee (khao trong)?',
   'multiple_choice',
   '[{"id":"a","text":"Lifting the leg as high as possible"},{"id":"b","text":"The hip thrust — driving the hips forward into the target"},{"id":"c","text":"Swinging the lower leg"},{"id":"d","text":"Jumping off the ground"}]',
   'b',
   'The hip thrust is the source of power in the straight knee. Think of driving your belt buckle toward the target — the knee is just the contact point, but the hips deliver the force of your entire bodyweight.',
   0),
  ('44444444-0702-0000-0000-000000000002',
   '33333333-0702-0000-0000-000000000002',
   'What is the primary defense against straight knees?',
   'multiple_choice',
   '[{"id":"a","text":"Blocking with the arms"},{"id":"b","text":"Ducking under the knee"},{"id":"c","text":"The teep — pushing the opponent away before they enter knee range"},{"id":"d","text":"Turning your back"}]',
   'c',
   'The teep (front push kick) is the primary defense against knees. A well-timed teep pushes the opponent out of knee range before they can close the distance.',
   1),
  ('44444444-0703-0000-0000-000000000002',
   '33333333-0702-0000-0000-000000000002',
   'The "knee pocket" is the specific range where straight knees are effective — closer than kicking range but further than elbow range.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'true',
   'The knee pocket is the sweet spot between kicking range and elbow range where straight knees can be thrown effectively. Learning to enter and exit this range is key to Level 2.',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 8: Conditioning Fundamentals
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0801-0000-0000-000000000002',
   '11111111-0000-0000-0000-000000000002',
   '22222222-0008-0000-0000-000000000002',
   'The Thai Way of Conditioning',
   'text', 0, FALSE, 7,
   '# The Thai Way of Conditioning

Walk into any gym in Thailand at 6 AM and you will hear the same sound: the rhythmic slap of a jump rope on concrete. Then shadow boxing. Then running. Conditioning is not an afterthought in Muay Thai — it is the foundation.

## Why Conditioning Is a Skill

At Level 2, conditioning moves from "getting fit" to a **trainable skill**. The three pillars of Thai conditioning are:

1. **Skipping (Kra Dot Chok)** — Builds rhythm, footwork, and calf endurance
2. **Shadow Boxing (Chok Lom)** — Builds technique memory and cardio
3. **Running (Wing)** — Builds the aerobic base that powers everything

## Skipping — More Than Cardio

Thai fighters skip rope differently than boxers. The Thai skip emphasizes:

- **High knees**: lift each knee to waist height
- **Double unders**: spin the rope twice per jump for explosive power
- **Directional skipping**: forward, backward, side-to-side
- **Single leg**: 30 seconds per leg to build balance

A typical Thai fighter skips for 15-20 minutes at the start of every session. It replaces the warm-up jog common in Western gyms.

### Building Your Skip Routine
- Week 1: 5 minutes continuous, basic bounce
- Week 2: 8 minutes, adding high knees every 30 seconds
- Week 3: 10 minutes, adding double unders every minute
- Week 4: 15 minutes, mixing all variations

## Shadow Boxing — The Mirror of Truth

Shadow boxing is where you practice everything without a target. It builds:

- **Technique memory**: your body learns the movements
- **Combination flow**: chain strikes together smoothly
- **Footwork**: move while striking
- **Visualization**: imagine an opponent reacting to your strikes

### Shadow Boxing Rules
- Always maintain your guard — never drop your hands
- Move your feet — do not stand flat-footed
- Throw every strike with intent — no lazy movements
- Practice defense between combinations (slip, block, parry)
- 3-5 rounds of 3 minutes is standard

## Running — The Aerobic Engine

Thai fighters run 10 km every morning. You do not need to start there, but you do need to build an aerobic base:

- Week 1-2: 3 km at a comfortable pace
- Week 3-4: 5 km, adding 30-second sprints every 3 minutes
- Week 5+: 8 km steady state

Running builds the engine that powers your 5 rounds of fighting. Without it, your technique deteriorates as fatigue sets in.'),

  ('33333333-0802-0000-0000-000000000002',
   '11111111-0000-0000-0000-000000000002',
   '22222222-0008-0000-0000-000000000002',
   'Conditioning Circuit Drill',
   'drill', 1, FALSE, 20,
   '# Conditioning Circuit Drill

## Equipment
- Jump rope
- Heavy bag or open space
- Timer

## The Phayra Nak Conditioning Circuit

Complete 3 full circuits. Rest 2 minutes between circuits.

### Station 1 — Jump Rope (3 minutes)
- Minute 1: Basic bounce, steady rhythm
- Minute 2: High knees, alternating legs
- Minute 3: Double unders or fast singles (max speed)

### Station 2 — Shadow Boxing (3 minutes)
- Minute 1: Jab-cross combinations with footwork
- Minute 2: Add kicks — jab-cross-kick, teep, switch kick
- Minute 3: Full arsenal — punches, kicks, elbows, knees, clinch entries

### Station 3 — Heavy Bag Power Round (3 minutes)
- 10 jab-cross-kicks (each side)
- 10 straight knees (each side)
- 10 elbows (each side)
- Fill remaining time with free combinations

### Station 4 — Bodyweight Conditioning (3 minutes)
- 30 seconds: push-ups
- 30 seconds: squats
- 30 seconds: mountain climbers
- 30 seconds: plank
- 30 seconds: burpees
- 30 seconds: rest (standing, hands on head, breathe)

## Cool Down (5 minutes)
- Light shadow boxing (50% speed, focus on form)
- Hip flexor stretch (30 seconds each side)
- Hamstring stretch (30 seconds each side)
- Shoulder stretch (30 seconds each side)
- Deep breathing: 10 breaths, inhale 4 seconds, exhale 6 seconds

## Progress Tracking
- Week 1: Complete 2 circuits
- Week 2: Complete 3 circuits
- Week 3: Complete 3 circuits, increase bag work intensity
- Week 4: Complete 3 circuits with no decrease in technique quality')
ON CONFLICT DO NOTHING;

-- Quiz for Module 8
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0801-0000-0000-000000000002',
   '33333333-0802-0000-0000-000000000002',
   'What are the three pillars of traditional Thai conditioning?',
   'multiple_choice',
   '[{"id":"a","text":"Weight lifting, swimming, and yoga"},{"id":"b","text":"Skipping (jump rope), shadow boxing, and running"},{"id":"c","text":"Stretching, meditation, and sparring"},{"id":"d","text":"Heavy bag, pad work, and clinching"}]',
   'b',
   'The three pillars of Thai conditioning are skipping (kra dot chok), shadow boxing (chok lom), and running (wing). These form the foundation of every Thai fighter''s daily training routine.',
   0),
  ('44444444-0802-0000-0000-000000000002',
   '33333333-0802-0000-0000-000000000002',
   'What is the primary purpose of shadow boxing?',
   'multiple_choice',
   '[{"id":"a","text":"To look impressive in the mirror"},{"id":"b","text":"To build technique memory, combination flow, and visualization"},{"id":"c","text":"To replace pad work when no partner is available"},{"id":"d","text":"To stretch before training"}]',
   'b',
   'Shadow boxing builds technique memory (your body learns movements through repetition), combination flow (chaining strikes smoothly), and visualization (imagining an opponent reacting). It is considered essential daily practice.',
   1),
  ('44444444-0803-0000-0000-000000000002',
   '33333333-0802-0000-0000-000000000002',
   'Thai fighters typically skip rope for only 1-2 minutes as a quick warm-up.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'Thai fighters typically skip rope for 15-20 minutes at the start of every session. It is a comprehensive conditioning exercise, not just a warm-up — building rhythm, footwork, calf endurance, and cardio.',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 9: Final Assessment
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0901-0000-0000-000000000002',
   '11111111-0000-0000-0000-000000000002',
   '22222222-0009-0000-0000-000000000002',
   'Phayra Nak Review — Skills Checklist',
   'text', 0, FALSE, 6,
   '# Phayra Nak Review — Skills Checklist

Before taking the final assessment, review each of the 7 Phayra Nak skills:

## 1. 3-Strike Combinations (Jab-Cross-Kick)
- Can you throw jab-cross-kick with smooth flow and no pause between strikes?
- Can you perform at least 3 variations (low kick, body-head, double jab, switch)?
- Do you understand the hip rotation connection between the cross and the kick?

## 2. Footwork Patterns (Angles, Pivots)
- Can you move in all four directions while maintaining your stance?
- Can you pivot 45-90 degrees after throwing combinations?
- Do you understand ring cutting and how to control the center?

## 3. Basic Clinch Entry and Control
- Can you enter the clinch from punching range?
- Can you secure the double collar tie and fight for inside position?
- Do you understand proper clinch posture?

## 4. Defensive Counters (Catch and Return)
- Can you catch a body kick and immediately counter?
- Can you parry a jab and counter with a cross?
- Do you understand the teep counter (teep tawaan)?

## 5. Elbow Strikes (Sok Tat, Sok Ti)
- Can you throw a horizontal elbow (sok tat) with proper rotation?
- Can you throw an uppercut elbow (sok ti) with hip and leg drive?
- Do you understand when and where to use elbows?

## 6. Knee Strikes from Range (Khao Trong)
- Can you throw a straight knee with a proper hip thrust?
- Can you enter the knee pocket from combinations?
- Do you understand the knee defense (teep)?

## 7. Conditioning Fundamentals
- Can you skip rope for 15 minutes with variations?
- Can you shadow box for 3 rounds with proper form throughout?
- Do you follow a regular conditioning routine?

## What Happens Next

1. Complete the knowledge assessment below
2. Visit your gym for in-person skill evaluation
3. Your trainer signs off each skill as you demonstrate proficiency
4. Once all 7 skills are signed off, your Phayra Nak certificate is issued

## Remember

The Phayra Nak — Serpent King — rules through skill, not force. This level is about **connecting** your techniques into a cohesive fighting system. You are no longer learning individual tools. You are learning to fight.'),

  ('33333333-0902-0000-0000-000000000002',
   '11111111-0000-0000-0000-000000000002',
   '22222222-0009-0000-0000-000000000002',
   'Phayra Nak Comprehensive Assessment',
   'quiz', 1, FALSE, 20,
   'Complete this 10-question assessment covering all Phayra Nak skills. You must understand the material — this is not a memorization test. Review any sections you are unsure about before attempting.')
ON CONFLICT DO NOTHING;

-- Final Assessment Quiz — 10 comprehensive questions
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0901-0000-0000-000000000002',
   '33333333-0902-0000-0000-000000000002',
   'In the jab-cross-kick combination, what connects the cross to the kick mechanically?',
   'multiple_choice',
   '[{"id":"a","text":"A pause to reset your stance"},{"id":"b","text":"Continuous hip rotation from the cross flowing into the kick"},{"id":"c","text":"Switching your stance between strikes"},{"id":"d","text":"Dropping your hands to generate momentum"}]',
   'b',
   'The hip rotation from the cross continues directly into the kick rotation. There is no pause or reset — one fluid motion connects all three strikes.',
   0),
  ('44444444-0902-0000-0000-000000000002',
   '33333333-0902-0000-0000-000000000002',
   'What does "move, plant, strike" mean in the context of Muay Thai footwork?',
   'multiple_choice',
   '[{"id":"a","text":"Move to a new gym, plant your flag, and start fighting"},{"id":"b","text":"Reposition your feet, establish a stable base, then throw your strike"},{"id":"c","text":"Always move while striking for unpredictability"},{"id":"d","text":"Plant a lead kick before following up with punches"}]',
   'b',
   'Move, plant, strike is the fundamental footwork principle: reposition first, establish a stable base (plant), then throw your strike. Striking while moving compromises power and balance.',
   1),
  ('44444444-0903-0000-0000-000000000002',
   '33333333-0902-0000-0000-000000000002',
   'What is "inside position" in the clinch?',
   'multiple_choice',
   '[{"id":"a","text":"Standing inside the ring"},{"id":"b","text":"Having your arms inside your opponent''s arms, giving you control"},{"id":"c","text":"Being closer to the corner"},{"id":"d","text":"Keeping your elbows wide for leverage"}]',
   'b',
   'Inside position means your arms are inside your opponent''s arms. This is the dominant clinch position because it gives you control over their posture and lets you pull them into knees.',
   2),
  ('44444444-0904-0000-0000-000000000002',
   '33333333-0902-0000-0000-000000000002',
   'A fighter described as "muay femur" is known for being aggressive and wild.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'Muay femur describes an intelligent, technical fighter who reads opponents and uses well-timed counters — the opposite of aggressive and wild. It is considered the highest art form in Thai boxing.',
   3),
  ('44444444-0905-0000-0000-000000000002',
   '33333333-0902-0000-0000-000000000002',
   'What are the three options after catching an opponent''s kick?',
   'multiple_choice',
   '[{"id":"a","text":"Hold the leg, wait, let go"},{"id":"b","text":"Sweep their standing leg, cross to the body, or dump them to the ground"},{"id":"c","text":"Push them away, back up, and teep"},{"id":"d","text":"Elbow, headbutt, and knee"}]',
   'b',
   'After catching a kick: sweep (hook the standing leg), strike (cross to exposed body), or dump (turn and push them down). The response must be immediate — no pausing.',
   4),
  ('44444444-0906-0000-0000-000000000002',
   '33333333-0902-0000-0000-000000000002',
   'What is the striking surface for sok tat (horizontal elbow)?',
   'multiple_choice',
   '[{"id":"a","text":"The fist"},{"id":"b","text":"The forearm"},{"id":"c","text":"The point of the elbow"},{"id":"d","text":"The open palm"}]',
   'c',
   'The point of the elbow is the striking surface for all elbow strikes. It is the sharpest bone in the body and is what causes the cuts and damage that elbows are famous for.',
   5),
  ('44444444-0907-0000-0000-000000000002',
   '33333333-0902-0000-0000-000000000002',
   'The power of khao trong (straight knee) comes primarily from the hip thrust.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'true',
   'The hip thrust is the key to a powerful straight knee. Think of driving your belt buckle toward the target — the knee is the contact point, but the hips deliver the force of your entire bodyweight.',
   6),
  ('44444444-0908-0000-0000-000000000002',
   '33333333-0902-0000-0000-000000000002',
   'How long does a typical Thai fighter skip rope at the start of a training session?',
   'multiple_choice',
   '[{"id":"a","text":"1-2 minutes"},{"id":"b","text":"5 minutes"},{"id":"c","text":"15-20 minutes"},{"id":"d","text":"45 minutes"}]',
   'c',
   'Thai fighters typically skip rope for 15-20 minutes at the start of every session. It is far more than a warm-up — it builds rhythm, footwork, calf endurance, and cardiovascular conditioning.',
   7),
  ('44444444-0909-0000-0000-000000000002',
   '33333333-0902-0000-0000-000000000002',
   'What is "ring cutting" in Muay Thai footwork?',
   'multiple_choice',
   '[{"id":"a","text":"Cutting the ring ropes to escape"},{"id":"b","text":"Using lateral steps and diagonal movement to trap the opponent against ropes or corners"},{"id":"c","text":"A type of spinning attack"},{"id":"d","text":"Running in circles around the opponent"}]',
   'b',
   'Ring cutting uses lateral and diagonal footwork to cut off the opponent''s escape routes, trapping them against the ropes or in a corner where you can attack effectively.',
   8),
  ('44444444-0910-0000-0000-000000000002',
   '33333333-0902-0000-0000-000000000002',
   'Elbows should be practiced during light sparring to build realistic timing.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'Elbows should only be trained on pads, never in light sparring. The elbow is the sharpest bone in the body and the risk of cuts is extremely high. Even in Thailand, elbow sparring requires strict supervision and full protective equipment.',
   9)
ON CONFLICT DO NOTHING;

-- ============================================
-- 020: Seed Singha Certification Course (Level 3)
-- Maps directly to the 8 Singha skills in
-- lib/certification-levels.ts
-- Requires Phayra Nak (Level 2) certificate + 14 day wait
-- ============================================

INSERT INTO courses (
  id, org_id, title, slug, description, short_description,
  difficulty, category, certificate_level,
  is_free, price_thb, status, is_featured, display_order,
  total_modules, total_lessons, estimated_hours
) VALUES (
  '11111111-0000-0000-0000-000000000003',
  NULL,
  'Singha Certification — Level 3',
  'singha-certification',
  'The advanced level of Thailand''s national Muay Thai certification system. Develop fight-ready skills — power striking, clinch sweeps, sparring, strategy, advanced knees, and the mental toughness required to compete. Completing this course qualifies you for the Singha (Level 3) certification assessment.',
  'Fight-ready Muay Thai — power, clinch sweeps, sparring, strategy, and mental fortitude.',
  'advanced',
  'certification',
  'singha',
  FALSE,
  18000,
  'published',
  TRUE,
  3,
  10, 19, 16.0
) ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- MODULES (10 total — intro + 8 skills + final)
-- ============================================

INSERT INTO course_modules (id, course_id, title, description, module_order) VALUES
  ('22222222-0001-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003',
   'Welcome to Singha',
   'What Level 3 demands, the transition from student to fighter, and what the Mythical Lion represents.',
   0),
  ('22222222-0002-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003',
   'Advanced Striking Power',
   'Hip rotation, weight transfer, and the biomechanics that turn technique into devastating force.',
   1),
  ('22222222-0003-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003',
   'Clinch Sweeps & Dumps',
   'Turn clinch control into dominant scoring — sweeps, trips, and throws from the plam.',
   2),
  ('22222222-0004-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003',
   'Sparring Fundamentals',
   'Controlled contact sparring — reading opponents, managing exchanges, and staying composed.',
   3),
  ('22222222-0005-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003',
   'Fight Strategy & Distance Management',
   'The chess match of Muay Thai — controlling range, reading patterns, and imposing your game.',
   4),
  ('22222222-0006-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003',
   'Advanced Knee Techniques',
   'Khao khong (diagonal knee) and khao loi (flying knee) — the weapons that finish fights.',
   5),
  ('22222222-0007-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003',
   'Body Kick Defense & Counter',
   'Mastering the check, the catch, and the counter against the most common attack in Muay Thai.',
   6),
  ('22222222-0008-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003',
   'Mental Fortitude Under Pressure',
   'Composure, breathing, and the Thai mental framework for performing when it matters.',
   7),
  ('22222222-0009-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003',
   'Basic Pad Holding for Partners',
   'The art of feeding pads — timing, angle, resistance, and coaching your training partner.',
   8),
  ('22222222-0010-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003',
   'Final Assessment',
   'Review all Singha skills and take the comprehensive knowledge assessment.',
   9)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 1: Welcome to Singha
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0101-0000-0000-000000000003',
   '11111111-0000-0000-0000-000000000003',
   '22222222-0001-0000-0000-000000000003',
   'The Mythical Lion — What Level 3 Means',
   'text', 0, TRUE, 6,
   '# The Mythical Lion — Singha

Welcome to Level 3 of the Naga-to-Garuda Certification System.

## From Serpent to Lion

The Singha (สิงห์) is the mythical lion of Thai legend — fierce, noble, and fearless. You have been the Naga (learning to enter the water) and the Phayra Nak (learning to command it). Now you become the Singha — learning to **fight**.

This is the pivotal level. Levels 1 and 2 taught you techniques and combinations. Level 3 teaches you to **use them against a resisting opponent**. You will spar. You will develop strategy. You will learn to stay composed when someone is trying to hit you back.

## What You Will Learn

1. **Advanced Striking Power** — Biomechanics of devastating force
2. **Clinch Sweeps & Dumps** — Scoring from the clinch
3. **Sparring Fundamentals** — Controlled contact with real opponents
4. **Fight Strategy** — Distance management and pattern reading
5. **Advanced Knee Techniques** — Khao khong and khao loi
6. **Body Kick Defense & Counter** — Complete defensive system
7. **Mental Fortitude** — Composure under pressure
8. **Basic Pad Holding** — Teaching and coaching others

## The Shift at Level 3

Levels 1-2 ask: "Can you perform the technique?"
Level 3 asks: "Can you perform the technique **when someone is trying to stop you?**"

This is the difference between a student and a fighter. The Singha fights.

## Prerequisites

- Phayra Nak (Level 2) certification
- Minimum 14 days since Level 2 was issued
- All 7 Phayra Nak skills signed off
- Access to a training partner for sparring modules')
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 2: Advanced Striking Power
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0201-0000-0000-000000000003',
   '11111111-0000-0000-0000-000000000003',
   '22222222-0002-0000-0000-000000000003',
   'The Biomechanics of Power',
   'text', 0, FALSE, 8,
   '# The Biomechanics of Power

At Levels 1-2 you learned correct form. At Level 3, you learn to generate **maximum force** with that form.

## The Kinetic Chain

Power in Muay Thai follows a kinetic chain — energy that starts at the ground and transfers through the body to the striking surface:

**Ground → Feet → Legs → Hips → Core → Shoulders → Strike**

Every link in this chain must fire in sequence. If one link breaks (feet not planted, hips not rotating, core not engaged), the power is lost.

## Hip Rotation — The Engine

The hips are the engine of every powerful strike. This was introduced at Level 2, but now you must master it:

### For Punches
- The cross: rear foot pivots, rear hip drives forward, torso rotates, shoulder delivers the fist
- The hook: lead hip opens, torso rotates horizontally, arm stays bent at 90 degrees
- Common mistake: punching with the arm only (no hip involvement)

### For Kicks
- The rear kick: standing foot pivots 180 degrees, hips turn completely over, the shin is a baseball bat
- The key: **turn the hip over**. Your belly button should face the target at the moment of impact
- Common mistake: not pivoting enough on the standing foot

### For Knees
- The hip thrust drives forward and upward
- Think: belt buckle to target
- Rise on the ball of the standing foot for maximum extension

## Weight Transfer

Power requires committing your weight:

- **Rear cross**: weight shifts from back foot to front foot as the punch lands
- **Rear kick**: weight transfers entirely to the standing leg as the kicking hip turns over
- **Teep**: weight drives forward through the hips into the ball of the foot

The fighter who commits their weight hits harder. The trade-off: you are briefly less balanced. This is why power striking requires good timing — you commit when you know you will land.

## The "Heavy" vs "Fast" Spectrum

Thai trainers describe strikes as either **nak** (heavy/powerful) or **wai** (fast/sharp). Both are valuable:

- Heavy strikes damage — they break ribs, buckle legs, and stop opponents
- Fast strikes score — they land clean, pile up points, and set up heavy strikes

Level 3 is about learning to be heavy. Levels 4-5 will refine the balance between heavy and fast.'),

  ('33333333-0202-0000-0000-000000000003',
   '11111111-0000-0000-0000-000000000003',
   '22222222-0002-0000-0000-000000000003',
   'Power Striking Drill',
   'drill', 1, FALSE, 15,
   '# Power Striking Drill

## Equipment
- Heavy bag (essential for power work)
- Thai pads with experienced holder

## Round 1 — Power Cross Isolation (3 minutes)
Single rear cross on the heavy bag. Maximum power every rep. 10 crosses, rest 10 seconds, repeat.
Checklist per rep: foot pivots, hip drives, weight transfers, fist turns over at impact.
The bag should swing significantly from each cross.

## Round 2 — Power Kick Isolation (3 minutes each side)
Single rear roundhouse kick. Full commitment — pivot the standing foot 180 degrees, turn the hip completely over, swing through the target.
Listen for the sound: a powerful kick makes a deep THUD, not a slap. If it slaps, the hip is not turning over.

## Round 3 — Power Combination: Cross-Kick (3 minutes)
Rear cross immediately followed by rear kick. The hip rotation from the cross feeds into the kick. Maximum power on both strikes. Rest 5 seconds between combinations.

## Round 4 — Heavy Knees (3 minutes)
Clinch the heavy bag (wrap your arms around it). Drive straight knees — pull the bag into each knee while thrusting your hips. The bag should compress and bounce. 10 knees each side, alternating.

## Round 5 — Power Round: Full Arsenal (3 minutes)
Trainer calls the weapon: "Cross!" "Kick!" "Knee!" "Elbow!" You respond with the most powerful version of that strike. No combinations — single strikes, maximum force. 5-second rest between calls.

## Key Points
- Power work is NOT about speed — slow down and focus on mechanics
- Every rep should be near-maximum effort
- Rest between reps — power work is quality, not quantity
- If your form deteriorates, stop and reset')
ON CONFLICT DO NOTHING;

-- Quiz for Module 2
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0201-0000-0000-000000000003',
   '33333333-0202-0000-0000-000000000003',
   'What is the correct kinetic chain for power generation in Muay Thai?',
   'multiple_choice',
   '[{"id":"a","text":"Arm → Shoulder → Core → Hips"},{"id":"b","text":"Ground → Feet → Legs → Hips → Core → Shoulders → Strike"},{"id":"c","text":"Hands → Wrists → Elbows → Shoulders"},{"id":"d","text":"Core → Legs → Feet → Ground"}]',
   'b',
   'Power starts from the ground and travels up through the kinetic chain: ground → feet → legs → hips → core → shoulders → striking surface. Each link must fire in sequence.',
   0),
  ('44444444-0202-0000-0000-000000000003',
   '33333333-0202-0000-0000-000000000003',
   'For a powerful rear kick, your belly button should face the target at the moment of impact.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'true',
   'Turning the hip completely over means your belly button faces the target at impact. This ensures maximum hip rotation and weight transfer into the kick.',
   1),
  ('44444444-0203-0000-0000-000000000003',
   '33333333-0202-0000-0000-000000000003',
   'What do Thai trainers mean by "nak" and "wai"?',
   'multiple_choice',
   '[{"id":"a","text":"Left and right"},{"id":"b","text":"Attack and defense"},{"id":"c","text":"Heavy/powerful and fast/sharp"},{"id":"d","text":"Clinch and distance fighting"}]',
   'c',
   'Nak means heavy/powerful strikes that damage, and wai means fast/sharp strikes that score. Both have strategic value, and Level 3 focuses on developing power (nak).',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 3: Clinch Sweeps & Dumps
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0301-0000-0000-000000000003',
   '11111111-0000-0000-0000-000000000003',
   '22222222-0003-0000-0000-000000000003',
   'Sweeps, Trips, and Throws from the Clinch',
   'text', 0, FALSE, 8,
   '# Sweeps, Trips, and Throws from the Clinch

At Level 2, you learned to enter the clinch and fight for position. At Level 3, you learn to **score** from the clinch — sweeping, tripping, and dumping your opponent to the canvas.

## Why Sweeps Score

In Thai scoring, sweeps and dumps are highly valued. They demonstrate:
- Superior technique and balance
- Dominance over the opponent
- Ring generalship

A clean sweep does not need to hurt the opponent — it simply needs to put them on the ground while you remain standing. Judges see this as a clear sign of the better fighter.

## The Inside Trip (Ped Nai)

The most basic clinch sweep:
1. Secure double collar tie with inside position
2. Step your lead foot to the outside of their lead foot
3. Hook your foot behind their ankle
4. Pull their head down and to the side while tripping their foot
5. They fall — you stay standing

Key: the pull and the trip happen simultaneously. The head pull off-balances them; the trip removes their base.

## The Hip Throw (Ting)

A more aggressive dump:
1. From the clinch, turn your hips into the opponent
2. Your hip becomes the fulcrum — their weight goes over it
3. Pull their head/body across your hip with the collar tie
4. They rotate over your hip to the ground

This requires commitment — you turn your back partially, which is risky if it fails. Practice until the motion is automatic.

## The Knee-Tap Sweep (Ped Khao)

Subtle and effective:
1. In the clinch, throw a knee to the body
2. As the knee retracts, hook it behind their knee
3. Push forward with your upper body while pulling their knee
4. They buckle backward

This works because the opponent braces for the knee strike and does not expect the sweep.

## Training Safety

All sweeps and dumps must be trained on mats. The person being swept should know how to fall safely — tuck the chin, roll on the shoulder, slap the mat with the arm to disperse impact. Never practice sweeps on hard floors.'),

  ('33333333-0302-0000-0000-000000000003',
   '11111111-0000-0000-0000-000000000003',
   '22222222-0003-0000-0000-000000000003',
   'Clinch Sweep Drill',
   'drill', 1, FALSE, 15,
   '# Clinch Sweep Drill

## Equipment
- Training partner (required)
- Mats (essential — never sweep on hard floors)

## Warm Up — Clinch Pummeling (3 minutes)
Standard pummeling for inside position. No sweeps yet — just build the clinch feel.

## Drill 1 — Inside Trip Isolation (3 minutes each side)
Start in clinch, both partners cooperative. Practice the inside trip slowly: step outside, hook the ankle, pull the head, complete the sweep. Partner falls safely (tuck chin, slap mat). 5 reps per side, switch attacker/defender.

## Drill 2 — Hip Throw Isolation (3 minutes each side)
From clinch position. Turn the hips in slowly, pull over, complete the throw. Partner goes with the motion and practices breakfalls. 5 reps per side. Focus on hip placement — your hip must be below their center of gravity.

## Drill 3 — Knee-to-Sweep Combination (3 minutes each side)
Throw a controlled knee to the body pad. As the knee retracts, hook behind their knee and sweep. This trains the deception — knee then sweep. 5 reps per side.

## Drill 4 — Clinch Sparring with Sweeps (3 rounds x 2 minutes)
Both partners actively clinch. Fight for position AND attempt sweeps. 50% resistance — not full competition, but not cooperative. Score a point for each successful sweep. Switch roles naturally.

## Key Points
- Always practice on mats
- The person being swept practices breakfalls
- Start slow, increase speed as technique improves
- The sweep comes from timing and leverage, not strength')
ON CONFLICT DO NOTHING;

-- Quiz for Module 3
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0301-0000-0000-000000000003',
   '33333333-0302-0000-0000-000000000003',
   'What makes the knee-tap sweep (ped khao) effective?',
   'multiple_choice',
   '[{"id":"a","text":"It uses maximum strength to overpower the opponent"},{"id":"b","text":"The opponent braces for a knee strike and does not expect the sweep"},{"id":"c","text":"It targets the head"},{"id":"d","text":"It requires jumping into the air"}]',
   'b',
   'The knee-tap sweep works through deception: the opponent braces to defend the knee strike, and does not expect the sweeping motion that follows as the knee retracts behind their leg.',
   0),
  ('44444444-0302-0000-0000-000000000003',
   '33333333-0302-0000-0000-000000000003',
   'In the inside trip (ped nai), the head pull and the foot trip must happen simultaneously.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'true',
   'The head pull off-balances the opponent (removes their equilibrium) while the trip removes their base (the foot). Both must happen at the same time for the sweep to work.',
   1),
  ('44444444-0303-0000-0000-000000000003',
   '33333333-0302-0000-0000-000000000003',
   'Why are sweeps and dumps valued in Thai scoring?',
   'multiple_choice',
   '[{"id":"a","text":"They cause the most physical damage"},{"id":"b","text":"They demonstrate superior technique, balance, and dominance"},{"id":"c","text":"They automatically end the round"},{"id":"d","text":"They earn bonus points from the referee"}]',
   'b',
   'Sweeps demonstrate superior technique and balance, dominance over the opponent, and ring generalship. Judges see a clean sweep as a clear sign of the better fighter, even if it does not cause damage.',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 4: Sparring Fundamentals
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0401-0000-0000-000000000003',
   '11111111-0000-0000-0000-000000000003',
   '22222222-0004-0000-0000-000000000003',
   'Introduction to Sparring',
   'text', 0, FALSE, 10,
   '# Introduction to Sparring

Sparring is where Muay Thai becomes real. Everything you have learned — every technique, combination, and drill — must now work against someone who is trying to do the same thing to you.

## The Purpose of Sparring

Sparring is NOT fighting. The purpose is to **learn**, not to win:
- Test techniques against resistance
- Develop timing and distance sense
- Learn to stay calm under pressure
- Build defensive reflexes
- Identify weaknesses in your game

## Types of Sparring

### Technical Sparring (50-60% power)
The bread and butter of training. Both partners work at moderate speed and light-moderate contact. The goal is to practice technique, not to hurt each other.

Rules:
- Light contact to the head (touch, don''t thud)
- Moderate contact to the body (protective gear recommended)
- Full technique range allowed (punches, kicks, knees, elbows to pads only)
- If one person increases power, the other asks them to slow down

### Body Sparring
Only strikes to the body — no head shots. Great for:
- Developing body shot defense
- Building pain tolerance in a controlled way
- Allowing newer students to spar without head strike anxiety

### Clinch Sparring
Clinch only — no striking at range. Focus on position, knees, sweeps. Excellent for building clinch skills without the full complexity of open sparring.

## Sparring Etiquette in Thailand

Thai gyms have strict sparring culture:
- **Touch gloves** before and after every round
- **Match intensity** to your partner — never go harder than them
- **Experienced fighters go lighter** with newer students, not harder
- **No ego** — if you get hit clean, acknowledge it and learn
- **Apologize** if you accidentally hit too hard
- **Never target an injured area** your partner has mentioned

## Your First Sparring Sessions

Start with body sparring only. Get comfortable with someone attacking you. Then add light head shots. Then add clinch. Build up gradually over weeks, not days.

The number one mistake beginners make: trying to win their first sparring sessions. You will get hit. You will miss. You will feel awkward. This is normal. Every champion started here.'),

  ('33333333-0402-0000-0000-000000000003',
   '11111111-0000-0000-0000-000000000003',
   '22222222-0004-0000-0000-000000000003',
   'Sparring Progression Drill',
   'drill', 1, FALSE, 20,
   '# Sparring Progression Drill

## Equipment
- Boxing gloves (16 oz for sparring)
- Shin guards
- Mouthguard (mandatory)
- Groin guard (mandatory)
- Training partner at similar level

## Phase 1 — Mirror Drill (2 rounds x 3 minutes)
Face your partner in stance. One person leads, the other mirrors. Lead person moves forward, backward, left, right — partner matches their movement maintaining distance. No striking. This builds distance awareness.

## Phase 2 — Single Weapon Sparring (2 rounds x 3 minutes)
Round 1: Jab only. Both partners can only throw jabs. Focus on timing, distance, and defense. This reduces complexity so you can focus on reading your opponent.
Round 2: Teep only. Both partners can only throw teeps. Same focus — timing and distance.

## Phase 3 — Body Sparring (2 rounds x 3 minutes)
Punches and kicks to the body only. No head shots. 50-60% power. Focus on:
- Attacking openings when you see them
- Defending calmly (blocks, parries, movement)
- Returning to guard after every exchange

## Phase 4 — Open Technical Sparring (2 rounds x 3 minutes)
All weapons allowed. Light contact to the head, moderate to the body. Focus on:
- Using combinations, not single strikes
- Moving after exchanges (don''t stand in the pocket)
- Breathing — exhale on every strike, never hold your breath

## Cool Down Discussion (5 minutes)
After sparring, talk with your partner:
- What worked well for each of you?
- What openings did you notice?
- What should each person work on?

This debrief is critical for learning. Sparring without reflection is just exercise.')
ON CONFLICT DO NOTHING;

-- Quiz for Module 4
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0401-0000-0000-000000000003',
   '33333333-0402-0000-0000-000000000003',
   'What is the primary purpose of sparring?',
   'multiple_choice',
   '[{"id":"a","text":"To prove you are better than your partner"},{"id":"b","text":"To learn — testing techniques, developing timing, and building defensive reflexes"},{"id":"c","text":"To practice knockout power"},{"id":"d","text":"To simulate a real fight at full intensity"}]',
   'b',
   'Sparring is for learning, not winning. The purpose is to test techniques against resistance, develop timing and distance sense, stay calm under pressure, and identify weaknesses.',
   0),
  ('44444444-0402-0000-0000-000000000003',
   '33333333-0402-0000-0000-000000000003',
   'In Thai sparring culture, experienced fighters should go harder against newer students to toughen them up.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'In Thai sparring culture, experienced fighters go LIGHTER with newer students, not harder. The experienced partner controls the pace and creates a learning environment.',
   1),
  ('44444444-0403-0000-0000-000000000003',
   '33333333-0402-0000-0000-000000000003',
   'What is the recommended first type of sparring for beginners?',
   'multiple_choice',
   '[{"id":"a","text":"Full contact sparring with all weapons"},{"id":"b","text":"Body sparring only — no head shots"},{"id":"c","text":"Clinch sparring with sweeps"},{"id":"d","text":"Elbow sparring"}]',
   'b',
   'Body sparring (strikes to the body only, no head shots) is the best starting point. It lets beginners get comfortable with someone attacking them without the anxiety of head strikes.',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 5: Fight Strategy & Distance Management
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0501-0000-0000-000000000003',
   '11111111-0000-0000-0000-000000000003',
   '22222222-0005-0000-0000-000000000003',
   'The Three Ranges of Muay Thai',
   'text', 0, FALSE, 8,
   '# The Three Ranges of Muay Thai

Fight strategy begins with understanding distance. There are three ranges in Muay Thai, and each favors different weapons:

## Long Range (Raya Klai)

**Distance**: just outside kicking range
**Weapons**: teep, rear kick, jab
**Strategy**: control distance, pick shots, score with kicks

The long-range fighter uses the teep to keep opponents away and scores with round kicks when they step in. This is the safest range because you have the most time to react.

Famous long-range fighters: Saenchai, Buakaw

## Medium Range (Raya Klang)

**Distance**: punching and kicking range
**Weapons**: all punches, hooks, body kicks, switch kicks
**Strategy**: combinations, pressure, overwhelming offense

The medium range is where exchanges happen. Most fights are won here. The key is to enter with a combination, score, and exit before the opponent can counter.

Famous medium-range fighters: Yodsanklai, Rodtang

## Close Range (Raya Klai — Clinch)

**Distance**: clinch, elbow, and knee range
**Weapons**: knees, elbows, sweeps, dumps
**Strategy**: clinch control, knee bombardment, scoring sweeps

Close range is uniquely Muay Thai. A fighter who dominates the clinch controls the fight. The risk is that entering the clinch exposes you to elbows and knees during the entry.

Famous clinch fighters: Dieselnoi, Petchboonchu

## Reading Your Opponent

Strategy is about imposing YOUR preferred range while denying theirs:

- If they want long range, close distance aggressively
- If they want close range, keep them at the end of your teep
- If they want medium range, either stay long (out-kick them) or clinch (remove their punching range)

## Pattern Recognition

After 30 seconds of sparring, you should be reading patterns:
- Do they always lead with the jab? Counter it.
- Do they drop their hands after kicking? Punish with a cross.
- Do they back straight up? Cut the ring and trap them.
- Do they look down before kicking? They are telegraphing.

The ability to read patterns and adapt is what separates a fighter from a technician.'),

  ('33333333-0502-0000-0000-000000000003',
   '11111111-0000-0000-0000-000000000003',
   '22222222-0005-0000-0000-000000000003',
   'Strategy Application Drill',
   'drill', 1, FALSE, 15,
   '# Strategy Application Drill

## Equipment
- Partner for sparring
- Full protective gear

## Round 1 — Long Range Only (3 minutes)
Both fighters must stay at long range. Only teeps, rear kicks, and jabs allowed. If either fighter enters medium or close range, both reset. This teaches patience and range control.

## Round 2 — Pressure Fighting (3 minutes)
One fighter is the aggressor (pushing forward, cutting the ring). The other is the counter-fighter (circling, using teeps and counters). Switch roles after the round. Notice how different roles require different strategies.

## Round 3 — Pattern Exploitation (3 minutes)
Partner A throws the same 2-3 attack patterns repeatedly. Partner B must identify the pattern and find the counter within the round. After the round, discuss: how quickly did B find the counter?

## Round 4 — Range Dictation (3 minutes)
Before the round, each fighter secretly chooses their preferred range (long, medium, or clinch). Both try to fight at their preferred range. After the round, discuss who successfully imposed their range and how.

## Round 5 — Open Strategy Sparring (3 minutes)
Full technical sparring with conscious strategy. Before the round, each fighter chooses one strategic goal (e.g., "I will score with body kicks" or "I will dominate the clinch"). After the round, evaluate whether you achieved your goal.

## Debrief
- What range felt most comfortable?
- What patterns did you notice in your partner?
- Did your strategy survive contact with the opponent?')
ON CONFLICT DO NOTHING;

-- Quiz for Module 5
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0501-0000-0000-000000000003',
   '33333333-0502-0000-0000-000000000003',
   'What are the three ranges of Muay Thai?',
   'multiple_choice',
   '[{"id":"a","text":"Attack range, defense range, and neutral range"},{"id":"b","text":"Long range, medium range, and close range (clinch)"},{"id":"c","text":"Punching range, kicking range, and grappling range"},{"id":"d","text":"Safe range, danger range, and kill range"}]',
   'b',
   'The three ranges are long range (teep/kick distance), medium range (punching and kicking), and close range (clinch — knees, elbows, sweeps). Each favors different weapons and strategies.',
   0),
  ('44444444-0502-0000-0000-000000000003',
   '33333333-0502-0000-0000-000000000003',
   'If your opponent prefers fighting at long range, what is the strategic response?',
   'multiple_choice',
   '[{"id":"a","text":"Also fight at long range to match them"},{"id":"b","text":"Close distance aggressively to deny them their preferred range"},{"id":"c","text":"Back up and give them more space"},{"id":"d","text":"Only throw teeps"}]',
   'b',
   'Strategy is about imposing YOUR preferred range while denying theirs. If they want long range, close the distance aggressively so they cannot use their teeps and long kicks effectively.',
   1),
  ('44444444-0503-0000-0000-000000000003',
   '33333333-0502-0000-0000-000000000003',
   'Pattern recognition in sparring means reading your opponent''s habits and finding counters for them.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'true',
   'Pattern recognition — noticing that an opponent always leads with the jab, drops their hands after kicking, or backs straight up — allows you to predict their actions and counter them effectively.',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 6: Advanced Knee Techniques
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0601-0000-0000-000000000003',
   '11111111-0000-0000-0000-000000000003',
   '22222222-0006-0000-0000-000000000003',
   'Khao Khong & Khao Loi — Advanced Knees',
   'text', 0, FALSE, 8,
   '# Khao Khong & Khao Loi — Advanced Knees

At Level 2 you learned the straight knee (khao trong). Now you add two devastating variations: the diagonal knee and the flying knee.

## Khao Khong — Diagonal Knee (เข่าโค้ง)

The diagonal knee arcs in from the side rather than driving straight up. It targets the ribs, the floating ribs, and the side of the body — areas that are difficult to defend.

### Technique
1. From the clinch or close range, rotate your hip outward
2. Drive the knee upward at a 45-degree angle
3. The knee curves into the target from the side
4. Pull the opponent toward the knee with your arms
5. The shinbone and knee both make contact

### Why It Works
The straight knee is relatively easy to defend — push the hips away or brace the core. The diagonal knee comes from an unexpected angle and targets the soft tissue on the side of the body. It slides past the opponent''s guard.

### When to Use
- In the clinch when the opponent braces against straight knees
- From the side when you have an angle
- After a sweep attempt — as they recover their balance, the side is exposed

## Khao Loi — Flying Knee (เข่าลอย)

The most spectacular technique in Muay Thai — launching your entire body into a single devastating knee strike.

### Technique
1. From medium range, take a quick step forward with the lead foot
2. Explode off the lead foot — jump upward and forward
3. Drive the rear knee upward with maximum force
4. Both arms grab the opponent''s head/shoulders to pull them into the knee
5. Land in a balanced stance

### When to Use
- When the opponent backs up in a straight line (you close the distance with the jump)
- As a fight-ending weapon — the flying knee carries enormous force
- When the opponent''s hands are low after throwing a kick

### The Risk
The flying knee is all-or-nothing. If it misses, you land off-balance and are vulnerable. It should be thrown with confidence and timing, never desperation.

## Thai Expression

There is a Thai saying: **"เข่าเดียวจบ"** (khao diao jop) — "one knee finishes it." The knee is the strike most likely to end a fight with a single blow.'),

  ('33333333-0602-0000-0000-000000000003',
   '11111111-0000-0000-0000-000000000003',
   '22222222-0006-0000-0000-000000000003',
   'Advanced Knee Drill',
   'drill', 1, FALSE, 15,
   '# Advanced Knee Drill

## Equipment
- Heavy bag or belly pad
- Thai pads
- Partner for clinch knees

## Round 1 — Khao Khong Isolation (3 minutes each side)
On the heavy bag. Clinch the bag and throw diagonal knees — feel the arc, the hip rotation outward, and the curved path into the side of the bag. 10 reps per side. The knee should make contact with the side of the bag, not the front.

## Round 2 — Clinch Knee Combination (3 minutes)
With a partner holding belly pad. Clinch and throw: straight knee, straight knee, diagonal knee. The first two knees make the opponent brace forward. The diagonal knee catches the exposed side. 5 sets per side.

## Round 3 — Khao Loi Entry (3 minutes)
NO CONTACT for this drill. Practice the flying knee motion in open space. Step, explode, drive the knee, land balanced. Focus on the launch mechanics and landing in a fighting stance. Do not throw this at a partner until your trainer approves.

## Round 4 — Khao Loi on Heavy Bag (3 minutes)
Now add the target. Step into the heavy bag, launch the flying knee. The bag should swing violently from the impact. Focus on committing your bodyweight into the strike. 5 reps per side with full reset between reps.

## Round 5 — Mixed Knee Sparring (3 rounds x 2 minutes)
Clinch sparring with partner. Use all three knee types: straight, diagonal, and (controlled) flying entries. 50% power. Focus on choosing the right knee for the situation.

## Key Points
- Diagonal knee power comes from hip rotation, not just lifting the leg
- Flying knee requires commitment — hesitation leads to weak strikes
- Always pull the opponent into the knee with your arms
- Train flying knees on bags before attempting with partners')
ON CONFLICT DO NOTHING;

-- Quiz for Module 6
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0601-0000-0000-000000000003',
   '33333333-0602-0000-0000-000000000003',
   'What makes the diagonal knee (khao khong) harder to defend than the straight knee?',
   'multiple_choice',
   '[{"id":"a","text":"It is thrown with more force"},{"id":"b","text":"It comes from an unexpected side angle and targets soft tissue on the ribs"},{"id":"c","text":"It is faster than any other strike"},{"id":"d","text":"It can only be thrown in the clinch"}]',
   'b',
   'The diagonal knee arcs in from a 45-degree angle, bypassing the frontal guard and targeting the soft tissue on the side of the body — an area that is difficult to brace against.',
   0),
  ('44444444-0602-0000-0000-000000000003',
   '33333333-0602-0000-0000-000000000003',
   'The flying knee (khao loi) is a low-risk technique that can be thrown frequently without consequence.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'The flying knee is an all-or-nothing technique. If it misses, you land off-balance and are vulnerable to counters. It should be thrown with confidence and good timing, never out of desperation.',
   1),
  ('44444444-0603-0000-0000-000000000003',
   '33333333-0602-0000-0000-000000000003',
   'What does the Thai expression "khao diao jop" mean?',
   'multiple_choice',
   '[{"id":"a","text":"Knees are useless"},{"id":"b","text":"One knee finishes it"},{"id":"c","text":"Practice knees daily"},{"id":"d","text":"Knees before elbows"}]',
   'b',
   '"เข่าเดียวจบ" (khao diao jop) means "one knee finishes it" — reflecting the devastating power of the knee strike, which is the technique most likely to end a fight with a single blow.',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 7: Body Kick Defense & Counter
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0701-0000-0000-000000000003',
   '11111111-0000-0000-0000-000000000003',
   '22222222-0007-0000-0000-000000000003',
   'Complete Body Kick Defense System',
   'text', 0, FALSE, 8,
   '# Complete Body Kick Defense System

The body kick (te tat) is the most common attack in Muay Thai. If you cannot defend it, you cannot fight. At Level 3, you build a complete defensive system — multiple options for every kick.

## Defense 1: The Check (Pat)

You learned this at Level 1. Lift the lead leg and block the kick with your shin. This remains your primary defense.

### Refinements at Level 3
- **Angle the check**: point your knee slightly outward so the shin meets the kick at an angle — this deflects rather than absorbs
- **Return immediately**: after checking, the same leg can fire a teep or kick before it returns to the ground
- **Stay balanced**: keep your guard up and your weight centered over the standing leg

## Defense 2: The Catch (Jap)

Catch the kicking leg with your arm and elbow. You learned the basics at Level 2. Level 3 refinements:

### Counter Options from the Catch
1. **Cross to the face**: their guard is open because the kicking arm extended
2. **Sweep the standing leg**: hook with your rear foot
3. **Dump backward**: lift the caught leg and push their shoulder
4. **Step-through throw**: step past them and use their momentum to throw them

### Timing the Catch
Do NOT reach for the kick. Let it come to you, absorb on your forearm, then clamp your elbow down to trap it. Reaching forward exposes your body.

## Defense 3: The Step-Back (Thoi)

Step backward out of range and let the kick miss. Then:
- **Counter kick**: as their kick passes and they rotate, kick them back
- **Teep**: as they recover balance, teep them away
- **Close distance**: step forward immediately as the kick misses and clinch

## Defense 4: The Cut (Tat)

Step forward INTO the kick before it gains full momentum. The shin strikes your hip/upper thigh area where it has less power. This is a Thai-specific defense that looks counterintuitive but works because it kills the arc of the kick.

After cutting the kick:
- You are now at close range — throw elbows, knees, or clinch
- The kicker is off-balance because their kick was jammed

## Choosing Your Defense

- **Low kick coming**: check (lift the leg)
- **Body kick at full range**: catch or step back
- **Kick from close**: cut (step inside)
- **Kick is very powerful**: step back (avoid it entirely)

Your goal at Level 3: have at least THREE defensive options for the body kick and choose the right one instinctively.'),

  ('33333333-0702-0000-0000-000000000003',
   '11111111-0000-0000-0000-000000000003',
   '22222222-0007-0000-0000-000000000003',
   'Body Kick Defense Drill',
   'drill', 1, FALSE, 15,
   '# Body Kick Defense Drill

## Equipment
- Partner with shin guards
- Open space or ring

## Drill 1 — Reactive Check (3 minutes each side)
Partner throws slow-medium rear kicks. You check every kick with the correct shin block. Focus on the Level 3 refinement: angle the knee outward, return to stance immediately. After each check, throw one counter technique (teep, kick, or cross).

## Drill 2 — Catch and Counter Rotation (3 minutes)
Partner throws slow rear kicks. Catch each kick. Rotate through four counters in order:
Rep 1: catch + cross
Rep 2: catch + sweep
Rep 3: catch + dump
Rep 4: catch + step-through throw
Repeat the cycle. This builds the decision-making for post-catch options.

## Drill 3 — Step-Back Counter Kick (3 minutes)
Partner throws medium rear kicks. Step back and let the kick miss. As it passes, throw your own rear kick back. The timing is: their kick misses → they rotate → their back is partially exposed → you kick. 10 reps, switch.

## Drill 4 — Cut and Clinch (3 minutes)
Partner throws rear kicks from mid-range. Step forward INTO the kick (cut it). The kick loses power because it has not reached full arc. Immediately clinch and throw one knee. Reset. 10 reps, switch.

## Drill 5 — Random Defense Sparring (3 rounds x 2 minutes)
Partner throws kicks at varying distances and speeds. You must choose the correct defense:
- Far kick → step back and counter
- Medium kick → catch or check
- Close kick → cut and clinch

No other strikes — just kicks and their defenses. Focus on reaction and correct choice.

## Key Points
- Never reach for a catch — let the kick come to you
- After every defense, counter immediately
- Cutting a kick looks wrong but works — trust the technique
- Build instinct through repetition, not thinking')
ON CONFLICT DO NOTHING;

-- Quiz for Module 7
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0701-0000-0000-000000000003',
   '33333333-0702-0000-0000-000000000003',
   'What does "cutting" a kick mean?',
   'multiple_choice',
   '[{"id":"a","text":"Checking the kick with your shin"},{"id":"b","text":"Stepping forward into the kick before it reaches full power"},{"id":"c","text":"Catching the kick and sweeping"},{"id":"d","text":"Ducking under the kick"}]',
   'b',
   'Cutting a kick means stepping forward INTO it before it gains full arc and momentum. The shin strikes your hip area where it has less power, and you end up at close range for elbows, knees, or clinch.',
   0),
  ('44444444-0702-0000-0000-000000000003',
   '33333333-0702-0000-0000-000000000003',
   'When catching a kick, you should reach forward to grab it as early as possible.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'You should NOT reach forward for the catch. Let the kick come to you, absorb it on your forearm, then clamp your elbow down. Reaching forward exposes your body to the full force of the kick.',
   1),
  ('44444444-0703-0000-0000-000000000003',
   '33333333-0702-0000-0000-000000000003',
   'At Level 3, how many defensive options should you have for the body kick?',
   'multiple_choice',
   '[{"id":"a","text":"One — the shin check"},{"id":"b","text":"Two — check and catch"},{"id":"c","text":"At least three — and choose the right one instinctively"},{"id":"d","text":"None — attack is the best defense"}]',
   'c',
   'At Level 3, you should have at least three defensive options (check, catch, step-back, cut) and be able to choose the correct one instinctively based on the distance and speed of the incoming kick.',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 8: Mental Fortitude Under Pressure
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0801-0000-0000-000000000003',
   '11111111-0000-0000-0000-000000000003',
   '22222222-0008-0000-0000-000000000003',
   'Composure, Breathing, and the Fighter''s Mind',
   'text', 0, FALSE, 8,
   '# Composure, Breathing, and the Fighter''s Mind

The greatest Thai fighters are not the strongest or fastest. They are the calmest. They fight as if they are meditating — relaxed, aware, and present. This mental state is what separates a good fighter from a great one.

## Jai Yen — Cool Heart

Thai culture has a concept called **jai yen** (ใจเย็น) — literally "cool heart." It means staying calm when things are difficult. In fighting, jai yen means:

- Not panicking when you get hit
- Not chasing when the opponent runs
- Not tensing up when pressure increases
- Making clear decisions under stress

The opposite is **jai ron** (ใจร้อน) — "hot heart." A fighter with jai ron is emotional, reactive, and makes mistakes. They swing wildly after being hit. They chase into traps. They gas out because tension burns energy.

## Breathing Under Pressure

The single most important mental skill is **breathing**. Most beginners hold their breath during exchanges. This causes:
- Rapid fatigue (muscles starve for oxygen)
- Tunnel vision (brain lacks oxygen)
- Increased anxiety (the body interprets breath-holding as danger)

### Combat Breathing
- **Exhale on every strike**: sharp, short exhale through the mouth
- **Inhale during movement**: between combinations, inhale through the nose
- **Never hold your breath**: even when absorbing a shot, exhale
- **Recovery breathing**: between rounds, slow inhale (4 counts), slow exhale (6 counts)

## The Three-Second Rule

When you get hit with a clean shot:
1. **Second 1**: Accept it happened — do not react emotionally
2. **Second 2**: Reset your guard and stance
3. **Second 3**: Respond with a technique — fire back or clinch

Most fighters freeze or panic after getting hit. The three-second rule gives your brain a structured response. With practice, it becomes instant.

## Sabai — Relaxation in Combat

Thai trainers constantly say **"sabai sabai"** (สบาย สบาย) — "relax, relax." This is not a suggestion to be lazy. It means:

- Keep your muscles loose until the moment of impact
- Tension is the enemy of speed — tight muscles are slow muscles
- Save energy by staying relaxed between exchanges
- Trust your training — your body knows what to do

## Visualization

Before sparring or fighting, Thai fighters often sit quietly and visualize:
- The techniques they want to use
- How they will respond to specific attacks
- Staying calm when pressured
- Winning the fight with composure

Visualization trains the same neural pathways as physical practice. 5 minutes of focused visualization before every sparring session will accelerate your progress.'),

  ('33333333-0802-0000-0000-000000000003',
   '11111111-0000-0000-0000-000000000003',
   '22222222-0008-0000-0000-000000000003',
   'Mental Fortitude Drill',
   'drill', 1, FALSE, 12,
   '# Mental Fortitude Drill

## Equipment
- Partner for sparring
- Timer

## Drill 1 — Pressure Breathing (3 minutes)
Partner throws light but continuous jabs and body shots at you. Your ONLY job is to maintain your guard and BREATHE. Exhale on every shot you absorb. Do not counter. Do not move away. Just breathe and block. This teaches you to stay calm under sustained pressure.

## Drill 2 — Three-Second Rule Practice (3 minutes)
Partner throws one clean (light) shot, then stops. You practice the three-second rule: accept, reset, respond. After your response (one combination), partner throws another clean shot. Repeat. Build the structured response until it is automatic.

## Drill 3 — Recovery Round (3 minutes)
Spar at 70% intensity for 2 minutes. At the 2-minute mark, partner increases to 80% for the final minute. Your job is to maintain composure and technique during the pressure increase. Do not panic, do not swing wildly, do not hold your breath.

## Drill 4 — Visualization (5 minutes)
Sit quietly. Close your eyes. Visualize a sparring round in detail:
- See your opponent in front of you
- Throw your best combinations
- Get hit — practice the three-second rule mentally
- Clinch, knee, sweep
- Feel yourself staying calm and composed throughout

## Drill 5 — Sabai Sparring (3 minutes)
Spar at 50% intensity with one rule: stay as relaxed as possible. Your partner calls "sabai!" every 30 seconds — when you hear it, consciously relax your shoulders, unclench your jaw, and breathe. This builds the habit of periodic relaxation checks during fighting.

## Key Points
- Breathing is a skill that must be trained, not just understood
- Composure under pressure comes from repetition, not willpower
- Visualization is real training, not daydreaming
- The calmest fighter usually wins')
ON CONFLICT DO NOTHING;

-- Quiz for Module 8
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0801-0000-0000-000000000003',
   '33333333-0802-0000-0000-000000000003',
   'What does "jai yen" mean in the context of Muay Thai?',
   'multiple_choice',
   '[{"id":"a","text":"Hot heart — fighting with maximum aggression"},{"id":"b","text":"Cool heart — staying calm and composed under pressure"},{"id":"c","text":"Iron heart — ignoring all pain"},{"id":"d","text":"Brave heart — never retreating"}]',
   'b',
   'Jai yen (ใจเย็น) means "cool heart" — staying calm, composed, and making clear decisions under pressure. It is considered the most important mental quality in Thai fighting.',
   0),
  ('44444444-0802-0000-0000-000000000003',
   '33333333-0802-0000-0000-000000000003',
   'What are the three steps of the Three-Second Rule after getting hit?',
   'multiple_choice',
   '[{"id":"a","text":"Scream, run, hide"},{"id":"b","text":"Accept it happened, reset your guard, respond with a technique"},{"id":"c","text":"Hit back immediately as hard as you can"},{"id":"d","text":"Stop, think about what went wrong, apologize"}]',
   'b',
   'The Three-Second Rule: (1) Accept it happened without emotional reaction, (2) Reset your guard and stance, (3) Respond with a technique — fire back or clinch. This structured response prevents panic.',
   1),
  ('44444444-0803-0000-0000-000000000003',
   '33333333-0802-0000-0000-000000000003',
   'Holding your breath during sparring helps you absorb more damage.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'Holding your breath causes rapid fatigue, tunnel vision, and increased anxiety. You should exhale on every strike, inhale during movement, and never hold your breath — even when absorbing a shot.',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 9: Basic Pad Holding for Partners
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0901-0000-0000-000000000003',
   '11111111-0000-0000-0000-000000000003',
   '22222222-0009-0000-0000-000000000003',
   'The Art of Holding Pads',
   'text', 0, FALSE, 8,
   '# The Art of Holding Pads

Pad holding is one of the most underrated skills in Muay Thai. A good pad holder is worth more than a good heavy bag — they give feedback, create rhythm, simulate real fighting, and coach technique in real time.

At Level 3, you learn the basics of holding Thai pads for a training partner. This skill marks your transition from pure student to someone who can contribute to others'' training.

## Why Pad Holding Is a Certification Skill

Holding pads requires you to:
- Understand technique from the **other side** — feeling what good strikes feel like
- Read your partner''s habits and help correct them
- Build empathy and coaching instinct
- Demonstrate that you understand Muay Thai deeply enough to teach it

## Basic Pad Holding Positions

### For the Jab
- Hold the right pad at your partner''s face height
- Angle it slightly inward (10-15 degrees)
- Give slight resistance — push into the jab so the striker feels impact
- Do NOT pull the pad away as the punch comes

### For the Cross
- Hold the left pad at face height
- Angle slightly inward
- Meet the punch — step slightly forward into it for realistic feel
- The pad should absorb, not fly backward

### For the Kick
- Hold both pads together at your hip/rib level
- Angle the pads perpendicular to the incoming kick
- Brace your core — a good kick will move you
- ABSORB the kick, do not swing the pads into the kick

### For the Knee
- Hold a belly pad or both Thai pads at waist level
- Lean slightly into the knee for realistic resistance
- Keep your chin tucked behind the pads

### For the Elbow
- Hold one focus mitt at face height, angled to simulate a face/head
- Keep your hand BEHIND the pad — never let your fingers wrap around
- Elbows hit with enormous force at short range

## The Rhythm of Pad Work

Good pad work has a rhythm:
1. **Call the combination**: "Jab-cross-kick!" or use pad positioning to cue strikes
2. **Receive the strikes**: absorb with proper pad position
3. **Return fire**: throw a light strike back (jab, teep, push) to simulate the opponent fighting back
4. **Reset**: brief pause, then call the next combination

The "return fire" is critical. It teaches the striker to defend after attacking, not just throw and admire their work.

## Common Mistakes

- **Dead pads**: holding pads limply with no resistance — the striker gets no feedback
- **Chasing the strike**: moving pads toward the incoming strike — distorts distance
- **Poor angle**: holding pads flat instead of angled — strikes deflect rather than absorb
- **No return fire**: never firing back — the striker develops bad habits of dropping their guard'),

  ('33333333-0902-0000-0000-000000000003',
   '11111111-0000-0000-0000-000000000003',
   '22222222-0009-0000-0000-000000000003',
   'Pad Holding Drill',
   'drill', 1, FALSE, 15,
   '# Pad Holding Drill

## Equipment
- Thai pads (pair)
- Partner to strike

## Phase 1 — Single Strike Holding (5 minutes)
Hold for one strike at a time. Call the strike, receive it, reset:
- 10 jabs (right pad, face height)
- 10 crosses (left pad, face height)
- 10 rear kicks (both pads at hip level)
- 10 teeps (both pads at midsection)

Focus on pad angle, resistance, and keeping your hands steady.

## Phase 2 — Basic Combination Holding (5 minutes)
Hold for 2-3 strike combinations:
- Jab-cross: right pad then left pad, face height
- Jab-cross-kick: right, left, then both at hip level
- Jab-cross-knee: right, left, then belly pad down

After each combination, throw a light jab back at the striker. They must block or parry before throwing the next combo.

## Phase 3 — Rhythm Building (5 minutes per person)
Call continuous combinations with a steady rhythm:
- "Jab-cross!" → receive → return jab → "Kick!" → receive → return teep → "Jab-cross-knee!" → receive → return push
- Build a flow between calling, receiving, and returning

The goal is smooth, continuous pad work that simulates a round of real fighting.

## Key Points
- ABSORB strikes — do not chase them with the pads
- Give consistent resistance so the striker gets feedback
- Always return fire after combinations
- Watch the striker''s form — call out dropped guards or lazy technique
- Communicate: "Harder!" "Faster!" "Guard up!" "Good!"')
ON CONFLICT DO NOTHING;

-- Quiz for Module 9
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0901-0000-0000-000000000003',
   '33333333-0902-0000-0000-000000000003',
   'Why is "return fire" important when holding pads?',
   'multiple_choice',
   '[{"id":"a","text":"It makes the pad session more fun"},{"id":"b","text":"It teaches the striker to defend after attacking, not just throw and admire their work"},{"id":"c","text":"It helps the pad holder get a workout too"},{"id":"d","text":"It is required by competition rules"}]',
   'b',
   'Return fire (throwing a light strike back after receiving a combination) teaches the striker to defend after attacking. Without it, fighters develop the bad habit of dropping their guard after throwing.',
   0),
  ('44444444-0902-0000-0000-000000000003',
   '33333333-0902-0000-0000-000000000003',
   'When holding pads for a kick, you should swing the pads into the incoming kick for more impact.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'You should absorb the kick, not swing the pads into it. Swinging pads toward the strike distorts the striker''s sense of distance and timing, teaching them bad habits.',
   1),
  ('44444444-0903-0000-0000-000000000003',
   '33333333-0902-0000-0000-000000000003',
   'What is the correct pad angle for receiving a jab or cross?',
   'multiple_choice',
   '[{"id":"a","text":"Perfectly flat, facing the striker"},{"id":"b","text":"Angled slightly inward (10-15 degrees) with slight resistance"},{"id":"c","text":"Held behind your back"},{"id":"d","text":"Tilted completely sideways"}]',
   'b',
   'Pads should be angled slightly inward (10-15 degrees) with slight resistance pushing into the punch. This gives the striker realistic feedback and prevents the punch from deflecting off a flat surface.',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 10: Final Assessment
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-1001-0000-0000-000000000003',
   '11111111-0000-0000-0000-000000000003',
   '22222222-0010-0000-0000-000000000003',
   'Singha Review — Skills Checklist',
   'text', 0, FALSE, 6,
   '# Singha Review — Skills Checklist

Before taking the final assessment, review each of the 8 Singha skills:

## 1. Advanced Striking Power
- Can you generate power through the full kinetic chain (ground to strike)?
- Do you understand hip rotation for punches, kicks, and knees?
- Do you know the difference between "nak" (heavy) and "wai" (fast) striking?

## 2. Clinch Sweeps & Dumps
- Can you perform the inside trip (ped nai)?
- Can you execute a hip throw (ting)?
- Can you combine a knee with a sweep (ped khao)?

## 3. Sparring Fundamentals
- Have you completed at least 10 rounds of controlled sparring?
- Do you understand sparring etiquette and intensity matching?
- Can you spar without losing composure?

## 4. Fight Strategy & Distance Management
- Can you identify and fight at the three ranges?
- Can you impose your preferred range on an opponent?
- Can you read and exploit your opponent''s patterns?

## 5. Advanced Knee Techniques
- Can you throw khao khong (diagonal knee) with proper hip rotation?
- Can you execute khao loi (flying knee) with commitment and balance?
- Do you understand when to use each knee type?

## 6. Body Kick Defense & Counter
- Can you check, catch, step-back, AND cut a body kick?
- Can you counter immediately from each defensive option?
- Can you choose the right defense instinctively?

## 7. Mental Fortitude
- Do you practice combat breathing (exhale on strikes)?
- Can you apply the three-second rule after getting hit?
- Do you understand jai yen (cool heart) and sabai (relaxation)?

## 8. Basic Pad Holding
- Can you hold pads for jab, cross, kick, knee, and elbow?
- Do you use proper pad angle and resistance?
- Do you return fire after combinations?

## The Singha Standard

The Singha is a fighter. This assessment tests not just whether you know the techniques, but whether you can **apply them under pressure**. Your in-person assessment will include live sparring evaluation.

Good luck, Singha.'),

  ('33333333-1002-0000-0000-000000000003',
   '11111111-0000-0000-0000-000000000003',
   '22222222-0010-0000-0000-000000000003',
   'Singha Comprehensive Assessment',
   'quiz', 1, FALSE, 25,
   'Complete this 10-question assessment covering all Singha skills. This is a knowledge test — your in-person assessment will evaluate practical application.')
ON CONFLICT DO NOTHING;

-- Final Assessment Quiz — 10 comprehensive questions
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-1001-0000-0000-000000000003',
   '33333333-1002-0000-0000-000000000003',
   'What is the correct kinetic chain for generating maximum striking power?',
   'multiple_choice',
   '[{"id":"a","text":"Arm → Shoulder → Core"},{"id":"b","text":"Ground → Feet → Legs → Hips → Core → Shoulders → Strike"},{"id":"c","text":"Hips → Arms → Hands"},{"id":"d","text":"Feet → Knees → Fist"}]',
   'b',
   'Power flows from the ground up through the kinetic chain. Every link must fire in sequence for maximum force transfer.',
   0),
  ('44444444-1002-0000-0000-000000000003',
   '33333333-1002-0000-0000-000000000003',
   'In the inside trip (ped nai), the head pull and foot trip must happen simultaneously.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'true',
   'The head pull off-balances the opponent while the trip removes their base. Both must happen at the same time — one without the other will not complete the sweep.',
   1),
  ('44444444-1003-0000-0000-000000000003',
   '33333333-1002-0000-0000-000000000003',
   'What is the primary purpose of sparring?',
   'multiple_choice',
   '[{"id":"a","text":"To win and prove you are better"},{"id":"b","text":"To learn — testing techniques, developing timing, building defensive reflexes"},{"id":"c","text":"To practice knockout power"},{"id":"d","text":"To tire out your training partner"}]',
   'b',
   'Sparring is for learning. It tests techniques against resistance, develops timing and distance sense, builds calm under pressure, and reveals weaknesses to improve.',
   2),
  ('44444444-1004-0000-0000-000000000003',
   '33333333-1002-0000-0000-000000000003',
   'If your opponent prefers long range fighting, the strategic response is to close distance aggressively.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'true',
   'Strategy is about denying your opponent their preferred range. If they want long range, close the distance so their teeps and long kicks become ineffective.',
   3),
  ('44444444-1005-0000-0000-000000000003',
   '33333333-1002-0000-0000-000000000003',
   'What makes the diagonal knee (khao khong) effective against opponents who brace for straight knees?',
   'multiple_choice',
   '[{"id":"a","text":"It is thrown with more force"},{"id":"b","text":"It arcs in from the side at a 45-degree angle, bypassing the frontal guard"},{"id":"c","text":"It targets the legs instead of the body"},{"id":"d","text":"It is a flying technique"}]',
   'b',
   'The diagonal knee comes from an unexpected side angle, targeting the ribs and soft tissue. Opponents who brace their core forward for straight knees leave their sides exposed.',
   4),
  ('44444444-1006-0000-0000-000000000003',
   '33333333-1002-0000-0000-000000000003',
   'What does "cutting" a kick mean?',
   'multiple_choice',
   '[{"id":"a","text":"Catching the kick with your hands"},{"id":"b","text":"Stepping forward into the kick before it reaches full power"},{"id":"c","text":"Checking it with your shin"},{"id":"d","text":"Ducking under the kick"}]',
   'b',
   'Cutting a kick means stepping forward INTO it before it gains full arc and momentum. This jams the kick, reduces its power, and puts you at close range for counters.',
   5),
  ('44444444-1007-0000-0000-000000000003',
   '33333333-1002-0000-0000-000000000003',
   'What does "jai yen" (ใจเย็น) mean?',
   'multiple_choice',
   '[{"id":"a","text":"Iron fist"},{"id":"b","text":"Cool heart — staying calm under pressure"},{"id":"c","text":"Hot temper"},{"id":"d","text":"Fast feet"}]',
   'b',
   'Jai yen means "cool heart" — the ability to stay calm, composed, and make clear decisions under pressure. It is the most valued mental quality in Thai fighting.',
   6),
  ('44444444-1008-0000-0000-000000000003',
   '33333333-1002-0000-0000-000000000003',
   'The Three-Second Rule after getting hit is: accept, reset guard, respond with a technique.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'true',
   'The Three-Second Rule provides a structured response to getting hit: (1) accept without emotion, (2) reset your guard and stance, (3) respond with a technique. This prevents panic.',
   7),
  ('44444444-1009-0000-0000-000000000003',
   '33333333-1002-0000-0000-000000000003',
   'Why should a pad holder "return fire" after receiving a combination?',
   'multiple_choice',
   '[{"id":"a","text":"To make pad work more tiring"},{"id":"b","text":"To teach the striker to defend after attacking, preventing the habit of dropping their guard"},{"id":"c","text":"To practice their own striking"},{"id":"d","text":"It is optional and not important"}]',
   'b',
   'Return fire teaches the striker to maintain their guard and defend after attacking. Without it, fighters develop the dangerous habit of admiring their strikes with their hands down.',
   8),
  ('44444444-1010-0000-0000-000000000003',
   '33333333-1002-0000-0000-000000000003',
   'Holding your breath during sparring helps maintain composure under pressure.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'Holding your breath causes rapid fatigue, tunnel vision, and increased anxiety. Combat breathing requires exhaling on every strike and inhaling during movement — never holding the breath.',
   9)
ON CONFLICT DO NOTHING;

-- ============================================
-- 021: Seed Hanuman Certification Course (Level 4)
-- Maps directly to the 9 Hanuman skills in
-- lib/certification-levels.ts
-- Requires Singha (Level 3) certificate + 30 day wait
-- ============================================

INSERT INTO courses (
  id, org_id, title, slug, description, short_description,
  difficulty, category, certificate_level,
  is_free, price_thb, status, is_featured, display_order,
  total_modules, total_lessons, estimated_hours
) VALUES (
  '11111111-0000-0000-0000-000000000004',
  NULL,
  'Hanuman Certification — Level 4',
  'hanuman-certification',
  'The elite level of Thailand''s national Muay Thai certification system. Master advanced clinch transitions, fight planning, full sparring, high-intensity conditioning, close-range elbows, advanced pad holding, competition readiness, Muay Boran fundamentals, and cornering basics. Only gym owners and admins can issue this certificate.',
  'Elite Muay Thai — advanced clinch, full sparring, fight planning, Muay Boran, and competition readiness.',
  'expert',
  'certification',
  'hanuman',
  FALSE,
  25000,
  'published',
  TRUE,
  4,
  11, 21, 20.0
) ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- MODULES (11 total — intro + 9 skills + final)
-- ============================================

INSERT INTO course_modules (id, course_id, title, description, module_order) VALUES
  ('22222222-0001-0000-0000-000000000004', '11111111-0000-0000-0000-000000000004',
   'Welcome to Hanuman',
   'The Divine Warrior — what Level 4 demands and the transition from fighter to complete martial artist.',
   0),
  ('22222222-0002-0000-0000-000000000004', '11111111-0000-0000-0000-000000000004',
   'Advanced Clinch Transitions & Sweeps',
   'Fluid transitions between clinch positions, chaining sweeps, and controlling the fight inside.',
   1),
  ('22222222-0003-0000-0000-000000000004', '11111111-0000-0000-0000-000000000004',
   'Fight Planning & Ring Strategy',
   'Building a fight plan, adjusting between rounds, and imposing your game on any opponent.',
   2),
  ('22222222-0004-0000-0000-000000000004', '11111111-0000-0000-0000-000000000004',
   'Full Sparring (Controlled)',
   'Complete sparring at higher intensity with all weapons — approaching real fight conditions.',
   3),
  ('22222222-0005-0000-0000-000000000004', '11111111-0000-0000-0000-000000000004',
   'High-Intensity Conditioning Circuits',
   'Fight-specific conditioning that mirrors the demands of a 5-round Muay Thai bout.',
   4),
  ('22222222-0006-0000-0000-000000000004', '11111111-0000-0000-0000-000000000004',
   'Elbow Combinations in Close Range',
   'Chaining elbows with punches and knees — the devastating close-range arsenal.',
   5),
  ('22222222-0007-0000-0000-000000000004', '11111111-0000-0000-0000-000000000004',
   'Advanced Pad Holding Technique',
   'Complex combination calling, rhythm variation, and developing fighters through pad work.',
   6),
  ('22222222-0008-0000-0000-000000000004', '11111111-0000-0000-0000-000000000004',
   'Competition Readiness Assessment',
   'Physical benchmarks, mental preparation, and understanding what it takes to compete.',
   7),
  ('22222222-0009-0000-0000-000000000004', '11111111-0000-0000-0000-000000000004',
   'Understanding Muay Boran Fundamentals',
   'The ancient art behind modern Muay Thai — historical techniques, philosophy, and cultural roots.',
   8),
  ('22222222-0010-0000-0000-000000000004', '11111111-0000-0000-0000-000000000004',
   'Cornering & Fight Reading Basics',
   'Reading a fight from the corner, giving instructions between rounds, and supporting a fighter.',
   9),
  ('22222222-0011-0000-0000-000000000004', '11111111-0000-0000-0000-000000000004',
   'Final Assessment',
   'Review all Hanuman skills and take the comprehensive knowledge assessment.',
   10)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 1: Welcome to Hanuman
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0101-0000-0000-000000000004',
   '11111111-0000-0000-0000-000000000004',
   '22222222-0001-0000-0000-000000000004',
   'The Divine Warrior — What Level 4 Means',
   'text', 0, TRUE, 6,
   '# The Divine Warrior — Hanuman

Welcome to Level 4 of the Naga-to-Garuda Certification System.

## From Lion to Divine Warrior

Hanuman (หนุมาน) is the divine warrior of Thai mythology — the monkey god who possesses supernatural strength, wisdom, and loyalty. In the Ramakien (Thailand''s national epic), Hanuman is the greatest warrior not because of his power alone, but because he combines strength with intelligence, strategy with heart.

At Level 4, you are no longer just a fighter. You are becoming a **complete martial artist** — someone who can fight, coach, plan, and understand the art at a deeper level.

## What Level 4 Demands

This level has 9 skills — the most of any level so far. They span:

1. **Advanced Clinch Transitions** — Fluid position changes and chained sweeps
2. **Fight Planning** — Building and adjusting strategy
3. **Full Sparring** — Higher intensity, all weapons, approaching fight conditions
4. **High-Intensity Conditioning** — Fight-specific fitness
5. **Elbow Combinations** — Close-range chain attacks
6. **Advanced Pad Holding** — Complex combination calling and fighter development
7. **Competition Readiness** — Physical and mental benchmarks for competing
8. **Muay Boran Fundamentals** — The ancient roots of modern Muay Thai
9. **Cornering Basics** — Reading fights and coaching between rounds

## The 30-Day Minimum

There is a 30-day minimum wait after Level 3. This is not arbitrary — the skills at this level require sustained training, not cramming. Use those 30 days to sharpen your Level 3 skills through regular sparring and clinch work.

## Certification Authority

Only gym owners and admins can issue Level 4 certificates. This reflects the seriousness of this credential — a Hanuman-certified practitioner is recognized as an advanced martial artist.

## The Path Forward

After Hanuman, only Garuda remains — the pinnacle. But do not rush. Many great fighters spend years at Level 4, refining their craft. The journey is the training.')
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 2: Advanced Clinch Transitions
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0201-0000-0000-000000000004',
   '11111111-0000-0000-0000-000000000004',
   '22222222-0002-0000-0000-000000000004',
   'Flowing Between Clinch Positions',
   'text', 0, FALSE, 9,
   '# Flowing Between Clinch Positions

At Level 2 you learned basic clinch entry. At Level 3 you learned sweeps. At Level 4 you learn to **flow** — transitioning between positions, chaining attacks, and controlling the entire clinch exchange.

## The Five Clinch Positions

### 1. Double Collar Tie (Plam Khaw)
Both hands behind the head, elbows tight. The dominant position. Pull their head down, throw knees.

### 2. Single Collar Tie + Bicep Control
One hand on the neck, one controlling their bicep. A transitional position — use it to set up the double collar tie or an off-balance.

### 3. Arm Drag Position
You have pulled one of their arms across your body. They are turned sideways — vulnerable to knees to the ribs and trips.

### 4. Body Lock (Low Clinch)
Both arms around their torso, below their arms. Used for lifting, throwing, and short knees to the body.

### 5. Underhook Position
One or both arms under their armpits. Controls their upper body and sets up hip throws.

## Transitioning Between Positions

The key to advanced clinch work is **never staying static**. If the opponent defends one position, flow to another:

- Double collar tie → they posture up → switch to arm drag
- Arm drag → they square up → transition to body lock
- Body lock → they push your head down → swim to underhooks → back to collar tie

Each transition creates a moment of vulnerability where you can strike or sweep.

## Chaining Sweeps

At Level 3 you learned individual sweeps. Now chain them:

1. Attempt inside trip → they lift their foot to avoid it
2. Their weight shifts to the other leg → immediately attack that leg with a hip throw
3. They resist the throw → they are off-balance → pull them into a knee

The opponent cannot defend everything simultaneously. Each failed sweep sets up the next attack.

## The Tempo of Clinch Fighting

Elite clinch fighters control the **tempo**:
- **Fast tempo**: rapid position changes, constant knees, overwhelming
- **Slow tempo**: patient, controlling posture, waiting for the perfect sweep
- **Tempo changes**: alternating fast and slow to confuse the opponent

The ability to change tempo is what separates a Level 4 clinch fighter from Level 3.'),

  ('33333333-0202-0000-0000-000000000004',
   '11111111-0000-0000-0000-000000000004',
   '22222222-0002-0000-0000-000000000004',
   'Clinch Transition Drill',
   'drill', 1, FALSE, 18,
   '# Clinch Transition Drill

## Equipment
- Partner (required), mats for sweeps
- Mouthguard, body protector recommended

## Drill 1 — Position Flow (4 rounds x 2 minutes)
Start in double collar tie. Every 10 seconds, transition to the next position in sequence: collar tie → single collar + bicep → arm drag → body lock → underhooks → back to collar tie. Partner is cooperative. Build smooth transitions.

## Drill 2 — Sweep Chains (3 rounds x 3 minutes)
Start in clinch. Attempt inside trip. If partner defends, immediately attempt hip throw. If defended, pull into a knee. Reset and repeat. Focus: the chain must flow — no pausing between attempts.

## Drill 3 — Tempo Changes (3 rounds x 3 minutes)
Clinch sparring at 60%. Round starts slow — patient, controlling posture. On trainer''s call of "GO," explode with fast knees and sweep attempts for 10 seconds. On "SLOW," return to patient control. Build the ability to shift gears.

## Drill 4 — Competitive Clinch (3 rounds x 3 minutes)
Full clinch sparring at 70%. Both partners fighting for position, throwing knees (controlled), and attempting sweeps. Score: 1 point for a sweep, 1 point for 3 consecutive knees. This is the closest to fight conditions.

## Key Points
- Transitions should feel like water flowing between containers
- Never stop moving in the clinch — static equals vulnerable
- Breathe through your nose in the clinch to manage fatigue
- The person who controls the tempo controls the clinch')
ON CONFLICT DO NOTHING;

INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0201-0000-0000-000000000004',
   '33333333-0202-0000-0000-000000000004',
   'What are the five clinch positions covered at Level 4?',
   'multiple_choice',
   '[{"id":"a","text":"Guard, mount, side control, back, and turtle"},{"id":"b","text":"Double collar tie, single collar + bicep, arm drag, body lock, and underhooks"},{"id":"c","text":"Standing, kneeling, sitting, lying, and hanging"},{"id":"d","text":"Left, right, forward, backward, and center"}]',
   'b',
   'The five clinch positions are: double collar tie (plam khaw), single collar tie + bicep control, arm drag position, body lock (low clinch), and underhook position.',
   0),
  ('44444444-0202-0000-0000-000000000004',
   '33333333-0202-0000-0000-000000000004',
   'Chaining sweeps works because the opponent cannot defend everything simultaneously.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'true',
   'When you chain sweeps, each failed attempt creates a new vulnerability. The opponent shifts their weight to defend one sweep, exposing them to the next attack in the chain.',
   1),
  ('44444444-0203-0000-0000-000000000004',
   '33333333-0202-0000-0000-000000000004',
   'What separates a Level 4 clinch fighter from Level 3?',
   'multiple_choice',
   '[{"id":"a","text":"Using more strength"},{"id":"b","text":"The ability to change tempo — alternating fast and slow to confuse the opponent"},{"id":"c","text":"Only using sweeps, never knees"},{"id":"d","text":"Staying in one position as long as possible"}]',
   'c',
   'Tempo control — alternating between fast explosive attacks and slow patient control — is what separates an advanced clinch fighter. It keeps the opponent guessing and unable to settle into a rhythm.',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 3: Fight Planning & Ring Strategy
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0301-0000-0000-000000000004',
   '11111111-0000-0000-0000-000000000004',
   '22222222-0003-0000-0000-000000000004',
   'Building a Fight Plan',
   'text', 0, FALSE, 9,
   '# Building a Fight Plan

At Level 3 you learned the three ranges and basic pattern recognition. At Level 4 you learn to build a **complete fight plan** — a strategic framework that guides your actions across all five rounds.

## The Thai 5-Round Structure

Thai fights follow a predictable rhythm that shapes strategy:

**Round 1**: Feeling out. Both fighters test range, timing, and reactions. Low-intensity. Rarely decisive.

**Round 2**: Building. Increase output. Establish your preferred range. Start scoring with clean techniques.

**Rounds 3-4**: Championship rounds. Maximum intensity. This is where fights are won and lost. Judges weight these rounds most heavily.

**Round 5**: Determined by rounds 3-4. If you are ahead, control and coast. If behind, you must take risks and push.

## Pre-Fight Analysis

Before a fight (or hard sparring), assess your opponent:

### Physical Assessment
- Taller or shorter than you? (Affects range strategy)
- Orthodox or southpaw? (Changes your angles)
- Muscular or lean? (Muscular may tire faster, lean may be more technical)
- How do they warm up? (Aggressive warm-ups suggest aggressive fighter)

### Technical Assessment (from watching footage or Round 1)
- What weapons do they favor? (Kicks, punches, clinch?)
- What is their preferred range?
- What defensive habits do they have? (Always check kicks? Parry? Shell up?)
- What do they do when pressured?

## Building Your Plan

A fight plan has three components:

### 1. Primary Strategy
Your main approach: "I will out-kick them at long range" or "I will dominate the clinch" or "I will pressure with combinations."

### 2. Plan B
What to do if Plan A is not working: "If I cannot out-kick them, I will switch to clinch and knees."

### 3. Round-by-Round Goals
- Round 1: Confirm my read of the opponent, test the teep
- Round 2: Establish my kick, score 3-4 clean body kicks
- Round 3: Increase pressure, mix kicks with clinch entries
- Round 4: Dominate — pour on offense, score heavily
- Round 5: If ahead, control pace. If behind, all-out attack.

## Adjusting Between Rounds

The corner advice between rounds should answer three questions:
1. What is working? (Do more of it)
2. What is the opponent doing successfully? (Counter it)
3. What is the priority for the next round? (One clear instruction)

The best fight plans are simple. Complexity breaks down under pressure.'),

  ('33333333-0302-0000-0000-000000000004',
   '11111111-0000-0000-0000-000000000004',
   '22222222-0003-0000-0000-000000000004',
   'Fight Planning Exercise',
   'drill', 1, FALSE, 15,
   '# Fight Planning Exercise

## Format
This is a mental + physical drill. You will build a fight plan, then execute it in sparring.

## Part 1 — Analysis (5 minutes, before sparring)
Watch your training partner shadow box for 2 minutes. Note:
- What techniques do they favor?
- What is their preferred range?
- What defensive habits do you notice?

Write down (mentally or on paper):
- Primary strategy: how will you fight them?
- Plan B: what if your primary strategy fails?
- Round 1 goal: what will you confirm in the first round?

## Part 2 — Execution (5 rounds x 3 minutes sparring)
Spar with your plan. Between each round, take 60 seconds to assess:
- Is my plan working?
- What do I need to adjust?
- What is my priority for the next round?

## Part 3 — Debrief (5 minutes)
With your partner, discuss:
- Did your plan survive contact? What changed?
- What adjustments did you make and why?
- What would you do differently in a rematch?

## Key Learning
No plan survives contact unchanged — but having a plan means you have a framework for adjustment. Fighters without a plan react. Fighters with a plan adapt.')
ON CONFLICT DO NOTHING;

INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0301-0000-0000-000000000004',
   '33333333-0302-0000-0000-000000000004',
   'In Thai scoring, which rounds carry the most weight?',
   'multiple_choice',
   '[{"id":"a","text":"Rounds 1 and 2"},{"id":"b","text":"Rounds 3 and 4"},{"id":"c","text":"Round 5 only"},{"id":"d","text":"All rounds are equal"}]',
   'b',
   'Rounds 3 and 4 are the championship rounds in Thai scoring. Judges weight them most heavily because this is when fighters show their true ability at peak intensity.',
   0),
  ('44444444-0302-0000-0000-000000000004',
   '33333333-0302-0000-0000-000000000004',
   'A fight plan should have a primary strategy, a Plan B, and round-by-round goals.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'true',
   'A complete fight plan has three components: primary strategy (main approach), Plan B (fallback if primary fails), and round-by-round goals (specific objectives for each round).',
   1),
  ('44444444-0303-0000-0000-000000000004',
   '33333333-0302-0000-0000-000000000004',
   'What should corner advice between rounds answer?',
   'multiple_choice',
   '[{"id":"a","text":"What the opponent had for breakfast"},{"id":"b","text":"What is working, what the opponent is doing well, and the priority for next round"},{"id":"c","text":"How many rounds are left"},{"id":"d","text":"Whether to quit or continue"}]',
   'b',
   'Effective corner advice answers three questions: what is working (do more), what the opponent is doing successfully (counter it), and the priority for the next round (one clear instruction).',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 4: Full Sparring (Controlled)
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0401-0000-0000-000000000004',
   '11111111-0000-0000-0000-000000000004',
   '22222222-0004-0000-0000-000000000004',
   'Advancing to Full Sparring',
   'text', 0, FALSE, 8,
   '# Advancing to Full Sparring

At Level 3 you began technical sparring at 50-60% intensity. Level 4 advances to **full sparring** — 70-80% intensity with all weapons, approaching real fight conditions.

## What Changes at This Level

### Intensity
Strikes land with more authority. Body kicks should be felt. Punches to the head are still controlled but not featherlight. The goal is to simulate fight pressure without causing injury.

### Weapons
All eight limbs are in play — punches, kicks, elbows (controlled to pads/body only), knees (body and clinch), clinch with sweeps. This is the full Muay Thai arsenal working together.

### Duration
Five 3-minute rounds with 1-minute rest, matching fight format. You must manage your energy across all five rounds — not just survive, but perform.

### Mental Pressure
At 70-80%, mistakes are punished. A dropped guard gets tagged. A lazy kick gets caught. This pressure is intentional — it trains you to maintain technique under stress.

## Rules of Full Sparring

1. **Both partners agree on intensity before starting** — never ambush someone with hard sparring
2. **Elbows to pads or body only** — never to the head in training
3. **If one person escalates beyond agreed intensity, stop immediately** and recalibrate
4. **Full protective gear**: 16 oz gloves, shin guards, mouthguard, groin guard, headgear optional but recommended
5. **A trainer should supervise** all full sparring sessions
6. **No ego** — if you are outmatched, learn from it; if you are dominant, teach through it

## Managing Exchanges

At this intensity, exchanges are real. Learn to:

- **Enter and exit**: throw your combination and move out of range. Do not stand in the pocket trading.
- **Control the clinch or disengage**: if the clinch starts, either commit to it or push out. Half-committed clinch work gets you kneed.
- **Breathe**: exhale sharply with every strike. Hold your breath and you will gas in 2 rounds.
- **Reset after getting hit**: everyone gets hit. The key is resetting your guard and composure immediately, not freezing.

## Recovery Between Sessions

Full sparring is demanding. Allow 48 hours between sessions. Train technique and conditioning on non-sparring days. Overtraining leads to accumulated damage and poor habits (flinching, shell defense, giving up position).'),

  ('33333333-0402-0000-0000-000000000004',
   '11111111-0000-0000-0000-000000000004',
   '22222222-0004-0000-0000-000000000004',
   'Full Sparring Session Plan',
   'drill', 1, FALSE, 25,
   '# Full Sparring Session Plan

## Equipment (All Mandatory)
- 16 oz boxing gloves
- Shin guards
- Mouthguard
- Groin guard
- Headgear (recommended)
- Trainer supervision

## Pre-Sparring (10 minutes)
- 5 minutes jump rope
- 3 minutes shadow boxing (building intensity)
- 2 minutes light technical sparring (30% — just flowing)

## Sparring Session (5 rounds x 3 minutes, 1-minute rest)

### Round 1 — Feeling Out (60%)
Find your range. Test your jab and teep. Read your partner. Do not force anything. Establish your rhythm.

### Round 2 — Building (70%)
Increase output. Start scoring with combinations and kicks. Test what works from your fight plan. Begin clinch exchanges.

### Round 3 — Championship Round (80%)
Maximum controlled intensity. This is the round you push yourself. Throw with authority. Clinch hard. Attempt sweeps. This round should feel difficult.

### Round 4 — Championship Round (80%)
Maintain intensity despite fatigue. This is where mental fortitude is tested. Keep your hands up, keep moving, keep scoring. Do not coast.

### Round 5 — Strategic Round (70%)
If you are ahead, control pace and avoid risks. If behind, increase pressure and take calculated risks. Practice round management.

## Post-Sparring
- 5 minutes light shadow boxing (cool down)
- Debrief with partner and trainer
- Note what worked and what needs improvement
- Ice any areas that took heavy contact

## Weekly Schedule
- Full sparring: maximum 2 sessions per week
- Technical sparring: 1-2 sessions per week
- The remaining days: technique, pads, conditioning, and rest')
ON CONFLICT DO NOTHING;

INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0401-0000-0000-000000000004',
   '33333333-0402-0000-0000-000000000004',
   'At what intensity should Level 4 full sparring be conducted?',
   'multiple_choice',
   '[{"id":"a","text":"100% — real fight intensity"},{"id":"b","text":"70-80% — approaching fight conditions but controlled"},{"id":"c","text":"30-40% — very light"},{"id":"d","text":"50% — same as Level 3"}]',
   'b',
   'Level 4 full sparring is conducted at 70-80% intensity. This is enough to simulate real fight pressure and punish mistakes, while still being controlled enough to train safely.',
   0),
  ('44444444-0402-0000-0000-000000000004',
   '33333333-0402-0000-0000-000000000004',
   'In full sparring, elbows can be thrown freely to the head.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'Even in full sparring, elbows should only be thrown to pads or the body — never to the head in training. The risk of cuts is too high regardless of intensity level.',
   1),
  ('44444444-0403-0000-0000-000000000004',
   '33333333-0402-0000-0000-000000000004',
   'How many full sparring sessions per week are recommended at Level 4?',
   'multiple_choice',
   '[{"id":"a","text":"Every day"},{"id":"b","text":"Maximum 2 sessions per week"},{"id":"c","text":"Once per month"},{"id":"d","text":"5 sessions per week"}]',
   'b',
   'Maximum 2 full sparring sessions per week is recommended. The body needs 48 hours to recover. Overtraining leads to accumulated damage and poor defensive habits.',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 5: High-Intensity Conditioning
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0501-0000-0000-000000000004',
   '11111111-0000-0000-0000-000000000004',
   '22222222-0005-0000-0000-000000000004',
   'Fight-Specific Conditioning',
   'text', 0, FALSE, 7,
   '# Fight-Specific Conditioning

Level 2 introduced conditioning fundamentals. Level 4 takes conditioning to fight-specific intensity — training your body to perform at 80%+ effort across five 3-minute rounds with 1-minute rest.

## The Energy Systems of Muay Thai

A 5-round fight demands three energy systems:

### Aerobic Base (60% of fight energy)
Sustained effort — staying active between bursts. Built through running, swimming, cycling at moderate intensity for 30+ minutes.

### Anaerobic Threshold (30%)
Hard sustained effort — pressure fighting, clinch battles. Built through interval training: 2-3 minute efforts at high intensity with short rest.

### Explosive Power (10%)
Knockout strikes, explosive sweeps, sudden bursts. Built through short sprints, plyometrics, and power strikes.

## The Thai Fighter''s Weekly Schedule

A professional Thai fighter trains twice daily:

**Morning (6 AM)**
- 10 km run
- 3 rounds shadow boxing
- 5 rounds pad work
- 3 rounds heavy bag
- Conditioning

**Afternoon (4 PM)**
- 3 rounds shadow boxing
- 5 rounds pad work
- 3 rounds clinch
- 2-3 rounds sparring (some days)
- Conditioning

You do not need to match this volume. But you need to understand the principle: **conditioning is built through daily consistent work, not occasional intense sessions.**

## Level 4 Benchmarks

At this level you should be able to:
- Run 8 km without walking
- Skip rope 20 minutes with variations
- Shadow box 5 rounds maintaining technique quality
- Complete a 5-round pad session without technique deterioration
- Spar 5 rounds and still have energy to clinch in round 5'),

  ('33333333-0502-0000-0000-000000000004',
   '11111111-0000-0000-0000-000000000004',
   '22222222-0005-0000-0000-000000000004',
   'Hanuman Conditioning Circuit',
   'drill', 1, FALSE, 25,
   '# Hanuman Conditioning Circuit

## Format
3 blocks. Each block simulates the energy demand of fight rounds. 1-minute rest between blocks.

## Block 1 — Aerobic Base (12 minutes)
- 3 minutes: jump rope (moderate pace, high knees)
- 3 minutes: shadow boxing (full combinations with movement)
- 3 minutes: heavy bag — continuous work, 60% power, no stopping
- 3 minutes: clinch pummeling with partner (position flow, no strikes)

## Block 2 — Anaerobic Threshold (12 minutes)
- 2 minutes: pad work — trainer calls fast combinations, no breaks
- 1 minute rest
- 2 minutes: heavy bag — maximum output, every strike with power
- 1 minute rest
- 2 minutes: clinch sparring with knees (controlled)
- 1 minute rest
- 3 minutes: alternating knees on heavy bag (non-stop, left-right-left-right)

## Block 3 — Explosive Power (8 minutes)
- 30 seconds: explosive cross — maximum power, reset between each
- 30 seconds rest
- 30 seconds: explosive kicks — full commitment each rep
- 30 seconds rest
- 30 seconds: explosive knees — drive through the bag
- 30 seconds rest
- Repeat the 30/30 cycle for remaining time (4 more rounds)

## Cool Down (5 minutes)
- 2 minutes light shadow boxing
- 3 minutes stretching: hip flexors, hamstrings, shoulders, neck

## Progression
- Week 1: Complete 2 blocks only
- Week 2: Complete all 3 blocks, reduce Block 3 to 5 minutes
- Week 3: Full circuit
- Week 4: Full circuit with increased intensity in Block 2')
ON CONFLICT DO NOTHING;

INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0501-0000-0000-000000000004',
   '33333333-0502-0000-0000-000000000004',
   'Which energy system provides the majority (60%) of energy in a Muay Thai fight?',
   'multiple_choice',
   '[{"id":"a","text":"Explosive power"},{"id":"b","text":"Anaerobic threshold"},{"id":"c","text":"Aerobic base"},{"id":"d","text":"Flexibility"}]',
   'c',
   'The aerobic base provides approximately 60% of fight energy — sustaining activity between explosive bursts. It is built through longer-duration moderate-intensity training like running.',
   0),
  ('44444444-0502-0000-0000-000000000004',
   '33333333-0502-0000-0000-000000000004',
   'Conditioning is best built through occasional intense sessions rather than daily consistent work.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'Conditioning is built through daily consistent work, not occasional intense sessions. This is the Thai training principle — twice-daily training builds a deep fitness base over time.',
   1)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 6: Elbow Combinations
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0601-0000-0000-000000000004',
   '11111111-0000-0000-0000-000000000004',
   '22222222-0006-0000-0000-000000000004',
   'Chaining Elbows with Punches and Knees',
   'text', 0, FALSE, 8,
   '# Chaining Elbows with Punches and Knees

At Level 2 you learned individual elbow strikes. At Level 4 you learn to **chain them** — integrating elbows into combinations with punches and knees for devastating close-range sequences.

## The Close-Range Arsenal

When you are inside punching range, three weapons dominate:
- **Elbows** — slash and cut
- **Knees** — power to the body
- **Short punches** — hooks and uppercuts

The key is flowing between them without resetting.

## Core Elbow Combinations

### Combo 1: Hook-Elbow (same side)
Throw a lead hook. As it retracts, the same arm immediately fires a sok tat (horizontal elbow). The hook brings their guard to one side; the elbow crashes through from the same angle. Two strikes, one motion.

### Combo 2: Uppercut-Uppercut Elbow
Rear uppercut to the body (they bend forward). Lead sok ti (uppercut elbow) to the chin as they fold. The body shot brings the head down; the elbow meets it coming up.

### Combo 3: Cross-Elbow-Knee
Rear cross closes distance. Lead sok tat attacks the face. Rear knee drives into the body. Three different weapons at three different levels in rapid succession.

### Combo 4: Double Elbow
Lead sok tat followed immediately by rear sok tat. Alternating horizontal elbows — the first opens the guard, the second penetrates it. Devastating but requires being very close.

### Combo 5: Clinch Exit Elbow
From clinch, push the opponent away with both hands on their chest. As they stumble backward, step forward and throw sok tat. This is extremely effective because the opponent is off-balance and not expecting a strike as they disengage.

## Range Management

Elbow combinations require you to be very close — closer than punching range. The entries from Level 2 still apply:
- Step behind a cross to enter
- Parry and step inside
- Exit the clinch into elbow range

The difference at Level 4: you do not throw a single elbow and retreat. You throw **sequences** and only exit when the combination is complete.

## Training Safety Reminder

All elbow combinations are trained on pads. The pad holder wears focus mitts at face height. In sparring, elbows go to the body only. No exceptions.'),

  ('33333333-0602-0000-0000-000000000004',
   '11111111-0000-0000-0000-000000000004',
   '22222222-0006-0000-0000-000000000004',
   'Elbow Combination Drill',
   'drill', 1, FALSE, 15,
   '# Elbow Combination Drill

## Equipment
- Focus mitts (pad holder)
- Belly pad for knees

## Round 1 — Hook-Elbow (3 minutes each side)
Lead hook to the mitt, immediately followed by lead sok tat to the second mitt (held at face height). Focus on the flow — hook retracts, elbow fires. No pause. 10 reps, switch sides.

## Round 2 — Uppercut-Elbow (3 minutes)
Rear uppercut to the body pad. As partner folds slightly, lead sok ti (uppercut elbow) to the mitt held under chin height. 10 reps, switch lead.

## Round 3 — Cross-Elbow-Knee (3 minutes)
Rear cross to the mitt. Step forward, lead sok tat to the face mitt. Immediately drive rear knee into the belly pad. Full three-weapon combination. 8 reps, rest, repeat.

## Round 4 — Double Elbow (3 minutes)
Lead sok tat to the left mitt, rear sok tat to the right mitt. Rapid alternation. Build speed gradually — start slow for form, increase to fight speed. 10 doubles, rest, repeat.

## Round 5 — Clinch Exit Elbow (3 minutes)
Start in clinch with partner. Push them away. As they stumble back, step forward and throw sok tat to the mitt. Reset to clinch. Repeat. This trains the timing of the clinch exit attack.

## Key Points
- Flow between strikes — no resetting between weapons
- Step INTO range for elbows, never reach
- Non-striking hand always protecting the chin
- All elbow contact on pads only')
ON CONFLICT DO NOTHING;

INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0601-0000-0000-000000000004',
   '33333333-0602-0000-0000-000000000004',
   'In the hook-elbow combination, why does the hook come first?',
   'multiple_choice',
   '[{"id":"a","text":"The hook is more powerful than the elbow"},{"id":"b","text":"The hook brings their guard to one side, opening the path for the elbow from the same angle"},{"id":"c","text":"You need to warm up your arm before throwing an elbow"},{"id":"d","text":"The hook and elbow target the same area"}]',
   'b',
   'The hook draws the opponent''s guard to one side to defend it. The elbow then crashes through from the same angle while they are still reacting to the hook. Two strikes, one motion.',
   0),
  ('44444444-0602-0000-0000-000000000004',
   '33333333-0602-0000-0000-000000000004',
   'The clinch exit elbow works because the opponent is off-balance and not expecting a strike as they disengage.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'true',
   'When pushed out of the clinch, the opponent is moving backward and off-balance. They are focused on recovering their stance, not defending — making the clinch exit elbow highly effective.',
   1)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 7: Advanced Pad Holding
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0701-0000-0000-000000000004',
   '11111111-0000-0000-0000-000000000004',
   '22222222-0007-0000-0000-000000000004',
   'The Art of Pad Holding',
   'text', 0, FALSE, 8,
   '# The Art of Pad Holding

Pad holding is not just catching strikes — it is **coaching through pads**. A great pad holder develops fighters, builds timing, and simulates realistic fight scenarios. At Level 4, you learn to hold pads at an advanced level.

## Why Pad Holding Is a Skill

In Thailand, the pad holder (often the trainer) is considered more important than the fighter during pad work. The pad holder:
- Controls the pace and rhythm
- Simulates realistic attacks for the fighter to defend
- Calls combinations that build specific skills
- Provides immediate feedback on technique
- Pushes the fighter''s conditioning

## Advanced Pad Holding Principles

### 1. Resistance
Meet the strike with appropriate resistance. Too soft and the fighter cannot gauge their power. Too hard and you risk injuring their joints. The pad should absorb 70-80% of the impact.

### 2. Angle
Present the pad at the correct angle for each strike:
- Crosses and jabs: pad facing the fighter, slight downward angle
- Hooks: pad on the side, perpendicular to the hook''s arc
- Kicks: pad at hip/rib height, angled to receive the shin
- Elbows: focus mitt at face height, angled to match the elbow''s trajectory
- Knees: belly pad pressed against your core

### 3. Rhythm and Timing
Call combinations with a rhythm that matches fight tempo. Start slow, build speed. Vary the tempo — 3 fast combinations followed by a slow power shot. This mimics the rhythm changes in a real fight.

### 4. Counter Attacks
After the fighter throws a combination, fire back with a light pad strike (simulate a punch or kick). This trains the fighter to:
- Return to guard after attacking
- Defend after offensive sequences
- Stay alert and not admire their own work

### 5. Verbal Coaching
Call out corrections in real time: "Hands up!" "Turn the hip!" "Breathe!" Keep instructions short and specific — one correction at a time.

## Complex Combination Calling

At Level 4, you should be able to call and hold for:
- 4-5 strike combinations
- Combinations ending in clinch entries
- Defensive sequences (block-counter)
- Round simulations (2-minute paced rounds with rest)'),

  ('33333333-0702-0000-0000-000000000004',
   '11111111-0000-0000-0000-000000000004',
   '22222222-0007-0000-0000-000000000004',
   'Pad Holding Practice Session',
   'drill', 1, FALSE, 20,
   '# Pad Holding Practice Session

## Equipment
- Thai pads (pair)
- Belly pad
- Focus mitts (optional for elbows)
- Partner to strike

## Round 1 — Basic Calls (3 minutes)
Call simple 2-3 strike combinations. Focus on presenting the pad at the correct angle, meeting each strike with appropriate resistance, and resetting between combinations. Start slow.

Calls: "Jab-cross!" "Kick!" "Jab-cross-kick!" "Teep!"

## Round 2 — Extended Combinations (3 minutes)
Call 4-5 strike combinations. The fighter must flow through the entire sequence.

Calls: "Jab-cross-hook-kick!" "Jab-cross-elbow-knee!" "Double jab-cross-body kick!"

## Round 3 — Counter Attack Integration (3 minutes)
After each combination, fire a light pad strike back at the fighter (simulate a jab or hook). They must block or parry, then throw the next called combination. This builds the attack-defend-attack rhythm.

## Round 4 — Tempo Variation (3 minutes)
Call 3 fast combinations in a row, then one slow power combination. Then 2 fast, then a long combination. Vary the rhythm to simulate fight conditions. The fighter must match your tempo.

## Round 5 — Round Simulation (3 minutes)
Hold pads as if it is a real fight round. Mix everything: combinations, counter attacks, clinch entries (fighter clinches you briefly, you push out, call the next combo). Increase intensity through the round, peak at 2 minutes, then manage the final minute.

## Switch Roles
Now the fighter holds pads for you. Repeat rounds 1-3. Both partners need this skill.

## Feedback Session
After both partners have held pads, discuss:
- Was the resistance appropriate?
- Were the pad angles correct for each strike?
- Did the counter attacks feel realistic?
- Were the verbal cues helpful?')
ON CONFLICT DO NOTHING;

INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0701-0000-0000-000000000004',
   '33333333-0702-0000-0000-000000000004',
   'Why should a pad holder fire light counter attacks after the fighter''s combinations?',
   'multiple_choice',
   '[{"id":"a","text":"To punish the fighter for making mistakes"},{"id":"b","text":"To train the fighter to return to guard, defend, and stay alert after attacking"},{"id":"c","text":"To make pad work more entertaining"},{"id":"d","text":"To test the pad holder''s own striking"}]',
   'b',
   'Counter attacks train the fighter to return to guard after offensive sequences, defend under pressure, and stay alert rather than admiring their own work. This simulates what happens in a real fight.',
   0),
  ('44444444-0702-0000-0000-000000000004',
   '33333333-0702-0000-0000-000000000004',
   'A pad holder should absorb 100% of the impact to protect the fighter''s joints.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'The pad should absorb 70-80% of the impact. Too soft and the fighter cannot gauge their power; too hard risks injuring their joints. Appropriate resistance gives realistic feedback.',
   1)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 8: Competition Readiness
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0801-0000-0000-000000000004',
   '11111111-0000-0000-0000-000000000004',
   '22222222-0008-0000-0000-000000000004',
   'Are You Ready to Compete?',
   'text', 0, FALSE, 8,
   '# Are You Ready to Compete?

Competition is not required for Level 4 certification — but understanding what it takes to compete is. This module covers the physical benchmarks, mental preparation, and practical considerations.

## Physical Benchmarks

Before considering competition, you should meet these minimums:

### Conditioning
- 5 rounds of hard pad work without significant technique deterioration
- 5 rounds of sparring at 70-80% intensity
- 8 km run under 45 minutes

### Technical
- Fluid combinations from all three ranges
- Comfortable in the clinch (can attack and defend)
- Can execute basic fight plan across 5 rounds
- Solid defensive skills (checks, parries, movement)

### Sparring Record
- Minimum 50 sparring rounds at Level 3-4 intensity
- Experience against different styles (pressure fighters, counter fighters, clinch fighters)
- No persistent defensive holes (always getting caught by the same technique)

## Weight Management

If competing, you will need to make weight. The principles:
- Know your walking weight and competition weight class
- Never cut more than 5% of bodyweight for water cut
- Begin dietary management 4-6 weeks before the fight
- The water cut (final 24 hours) should be supervised by experienced cornermen
- Rehydrate fully after weigh-in before competing

## Mental Preparation

### The Fear is Normal
Every fighter is nervous before competition. The difference between experienced and inexperienced fighters is not the absence of fear — it is the ability to perform despite it.

### Visualization
In the weeks before competition:
- Visualize your fight plan succeeding — see yourself executing combinations, controlling the clinch
- Visualize adversity — being hit hard, being tired, being behind — and see yourself responding calmly
- Visualize the walk to the ring, the Wai Kru, the first round

### Pre-Fight Routine
Develop a consistent routine: warm-up exercises, music, mental cues. Consistency creates comfort. Do the same warm-up before sparring that you will do before competing.

## The Decision to Compete

Competing is a personal choice. Some martial artists train their entire lives and never compete — and they are no less dedicated. Others compete once and gain insights that years of training cannot provide. Discuss with your trainer before making this decision.')
ON CONFLICT DO NOTHING;

INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0801-0000-0000-000000000004',
   '33333333-0801-0000-0000-000000000004',
   'How many sparring rounds at Level 3-4 intensity should you have before considering competition?',
   'multiple_choice',
   '[{"id":"a","text":"5 rounds"},{"id":"b","text":"20 rounds"},{"id":"c","text":"Minimum 50 rounds"},{"id":"d","text":"100 rounds exactly"}]',
   'c',
   'A minimum of 50 sparring rounds at high intensity gives you enough experience against different styles and situations to handle the unpredictability of competition.',
   0),
  ('44444444-0802-0000-0000-000000000004',
   '33333333-0801-0000-0000-000000000004',
   'Experienced fighters do not feel nervous before competition.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'Every fighter feels nervous before competition. The difference is that experienced fighters can perform despite the fear, not that they do not feel it.',
   1)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 9: Muay Boran Fundamentals
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0901-0000-0000-000000000004',
   '11111111-0000-0000-0000-000000000004',
   '22222222-0009-0000-0000-000000000004',
   'The Ancient Art — Muay Boran',
   'text', 0, FALSE, 10,
   '# The Ancient Art — Muay Boran

Muay Boran (มวยโบราณ) means "ancient boxing." It is the predecessor of modern Muay Thai — the battlefield art that Thai warriors used for centuries before it was codified into a sport.

## History

### Ancient Origins
Muay Boran developed as a battlefield combat system for the Siamese military. Soldiers fought with their bodies when weapons were lost — using headbutts, grabs, throws, and strikes from all limbs.

### Regional Styles
Before standardization, different regions of Thailand had distinct styles:
- **Muay Chaiya** (South): defensive, uses elbows and knees, turtle-like guard
- **Muay Korat** (Northeast): powerful, emphasizes heavy kicks and charging attacks
- **Muay Lopburi** (Central): intelligent, technical, emphasizes footwork and angles
- **Muay Thasao** (North): fast, emphasizes speed and quick combinations

### The Transition to Modern Muay Thai
In the 1920s-1930s, King Rama VII standardized rules: boxing gloves replaced rope bindings (kaad chuek), weight classes were introduced, timed rounds replaced fighting to submission. Muay Boran became Muay Thai — a sport.

## Techniques Lost in Modernization

Modern Muay Thai rules removed several Muay Boran techniques:
- **Headbutts** — devastating in ancient fights, banned in modern rules
- **Groin strikes** — legal in ancient fights, banned for safety
- **Ground fighting** — Muay Boran included throws to the ground and ground strikes
- **Joint locks and breaks** — particularly wrist and arm locks from the clinch
- **Certain elbow trajectories** — spinning back elbows and downward elbows were more common

## Cultural Significance

Muay Boran is not just a fighting system — it is a cultural treasure:
- The **Wai Kru Ram Muay** originates from Muay Boran ceremonies
- The **Mongkon** (headband) and **Pra Jiad** (armbands) carry spiritual significance from the ancient traditions
- Each technique has a poetic Thai name describing its action (e.g., "Hanuman Thawai Waen" — Hanuman Offers the Ring)
- The philosophy of respecting your teacher, your opponent, and the art comes directly from the ancient warrior code

## Why Learn Muay Boran at Level 4?

Understanding Muay Boran gives depth to your modern Muay Thai:
- You understand WHY techniques are structured the way they are
- You appreciate the cultural heritage you are part of
- You can demonstrate traditional techniques in ceremonies and exhibitions
- You become a more complete martial artist — not just a fighter, but a keeper of tradition')
ON CONFLICT DO NOTHING;

INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0901-0000-0000-000000000004',
   '33333333-0901-0000-0000-000000000004',
   'What does "Muay Boran" mean?',
   'multiple_choice',
   '[{"id":"a","text":"Modern boxing"},{"id":"b","text":"Ancient boxing"},{"id":"c","text":"Thai kickboxing"},{"id":"d","text":"Ring fighting"}]',
   'b',
   'Muay Boran (มวยโบราณ) literally means "ancient boxing." It is the battlefield combat system that preceded modern Muay Thai.',
   0),
  ('44444444-0902-0000-0000-000000000004',
   '33333333-0901-0000-0000-000000000004',
   'Which regional style of Muay Boran is known for its defensive, turtle-like guard using elbows and knees?',
   'multiple_choice',
   '[{"id":"a","text":"Muay Korat"},{"id":"b","text":"Muay Lopburi"},{"id":"c","text":"Muay Chaiya"},{"id":"d","text":"Muay Thasao"}]',
   'c',
   'Muay Chaiya from southern Thailand is known for its defensive style, turtle-like guard, and devastating close-range elbows and knees.',
   1),
  ('44444444-0903-0000-0000-000000000004',
   '33333333-0901-0000-0000-000000000004',
   'Modern Muay Thai rules were standardized with boxing gloves and timed rounds in the 1920s-1930s under King Rama VII.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'true',
   'King Rama VII standardized the rules in the 1920s-1930s, introducing boxing gloves (replacing rope bindings), weight classes, and timed rounds. This transition created modern Muay Thai from Muay Boran.',
   2)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 10: Cornering & Fight Reading
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-1001-0000-0000-000000000004',
   '11111111-0000-0000-0000-000000000004',
   '22222222-0010-0000-0000-000000000004',
   'Reading a Fight and Coaching Between Rounds',
   'text', 0, FALSE, 8,
   '# Reading a Fight and Coaching Between Rounds

At Level 4 you begin learning to see Muay Thai from the **outside** — reading a fight as it unfolds and providing useful guidance between rounds. This is the foundation of cornering.

## Fight Reading — What to Watch

### Scoring Assessment
Track who is winning each round based on Thai scoring criteria:
1. **Clean strikes that affect the opponent** (most important)
2. **Effective aggression** (moving forward with purpose, not wild swinging)
3. **Ring generalship** (controlling where the fight takes place)
4. **Defense** (only counts when combined with counters)

### Pattern Recognition
Watch for patterns in both fighters:
- Does Fighter A always circle left after a combination?
- Does Fighter B drop their rear hand before kicking?
- Which fighter controls the clinch?
- Who is managing distance better?

### Momentum Shifts
Fights have momentum — identify when it shifts:
- A fighter scores a hard strike and gains confidence
- A fighter gets swept and loses composure
- Fatigue changes a fighter''s behavior (wider stance, lower hands, fewer kicks)

## Giving Corner Advice

### The 60-Second Window
Between rounds you have approximately 60 seconds. The fighter is tired, emotional, and possibly hurt. Your advice must be:
- **Short** — one to two instructions maximum
- **Specific** — "throw the body kick after your cross" not "kick more"
- **Positive** — "you are winning the clinch, keep it up" not "stop losing the stand-up"
- **Actionable** — something they can implement immediately

### The Three-Part Framework
1. **Reassurance**: "Good round" or "You are doing well"
2. **One tactical instruction**: "His right hand drops before he kicks — time the counter cross"
3. **Energy management**: "This is your round — push now" or "Control the pace, you are ahead"

### What NOT to Do
- Do not overload with instructions — they will remember none of them
- Do not criticize — the fighter is doing their best under pressure
- Do not contradict the head trainer — one voice only
- Do not show panic — your fighter reads your energy

## Practice

Watch fights (live or on video) and practice:
1. Scoring each round silently
2. Identifying one tactical adjustment for each fighter between rounds
3. Formulating your corner advice in under 10 seconds

This observation skill transfers directly to your own fighting — if you can read others, you can read yourself.')
ON CONFLICT DO NOTHING;

INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-1001-0000-0000-000000000004',
   '33333333-1001-0000-0000-000000000004',
   'What is the most important factor in Thai scoring?',
   'multiple_choice',
   '[{"id":"a","text":"Number of strikes thrown"},{"id":"b","text":"Clean strikes that affect the opponent"},{"id":"c","text":"Aggression regardless of accuracy"},{"id":"d","text":"How loud the crowd cheers"}]',
   'b',
   'Clean strikes that visibly affect the opponent are the most important scoring factor in Thai judging. Volume alone (throwing many strikes) does not score if they do not land clean or have effect.',
   0),
  ('44444444-1002-0000-0000-000000000004',
   '33333333-1001-0000-0000-000000000004',
   'Corner advice between rounds should include multiple detailed tactical instructions.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'Corner advice should be short (one to two instructions maximum), specific, positive, and actionable. Overloading a tired, emotional fighter with multiple instructions means they will remember none of them.',
   1)
ON CONFLICT DO NOTHING;

-- ============================================
-- LESSONS — Module 11: Final Assessment
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-1101-0000-0000-000000000004',
   '11111111-0000-0000-0000-000000000004',
   '22222222-0011-0000-0000-000000000004',
   'Hanuman Review — Skills Checklist',
   'text', 0, FALSE, 6,
   '# Hanuman Review — Skills Checklist

Before the final assessment, review each of the 9 Hanuman skills:

## 1. Advanced Clinch Transitions & Sweeps
- Can you flow between the five clinch positions?
- Can you chain sweeps — when one fails, immediately attempt another?
- Can you control the tempo of a clinch exchange?

## 2. Fight Planning & Ring Strategy
- Can you build a fight plan with primary strategy, Plan B, and round-by-round goals?
- Can you adjust your plan between rounds?
- Do you understand the 5-round Thai scoring structure?

## 3. Full Sparring (Controlled)
- Can you spar 5 rounds at 70-80% intensity?
- Can you manage exchanges — enter, score, and exit?
- Do you maintain technique quality under pressure?

## 4. High-Intensity Conditioning
- Can you complete the Hanuman conditioning circuit?
- Do you meet the physical benchmarks (8 km run, 20 min skip, 5-round pad session)?

## 5. Elbow Combinations in Close Range
- Can you chain elbows with punches and knees?
- Can you execute the clinch exit elbow?
- Do you understand range management for elbow work?

## 6. Advanced Pad Holding
- Can you hold pads for complex 4-5 strike combinations?
- Do you provide appropriate resistance and counter attacks?
- Can you vary tempo and coach verbally during pad rounds?

## 7. Competition Readiness Assessment
- Do you understand the physical and mental benchmarks?
- Do you know the basics of weight management?
- Can you develop a pre-fight routine?

## 8. Muay Boran Fundamentals
- Can you explain the four regional styles?
- Do you understand the transition from ancient to modern Muay Thai?
- Do you appreciate the cultural significance of the traditions?

## 9. Cornering & Fight Reading Basics
- Can you score rounds using Thai criteria?
- Can you identify patterns and momentum shifts?
- Can you formulate concise, actionable corner advice?

## The Hanuman Standard

This is the most demanding level yet. The Hanuman-certified practitioner is not just a fighter — they are a martial artist who can fight, coach, plan, and understand the art at a deeper level. Only owners and admins can issue this certificate, reflecting its significance.'),

  ('33333333-1102-0000-0000-000000000004',
   '11111111-0000-0000-0000-000000000004',
   '22222222-0011-0000-0000-000000000004',
   'Hanuman Comprehensive Assessment',
   'quiz', 1, FALSE, 25,
   'Complete this 10-question assessment covering all 9 Hanuman skills. This assessment tests deep understanding — not memorization.')
ON CONFLICT DO NOTHING;

INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-1101-0000-0000-000000000004',
   '33333333-1102-0000-0000-000000000004',
   'What is the key difference between Level 3 clinch work and Level 4 clinch work?',
   'multiple_choice',
   '[{"id":"a","text":"Level 4 uses more strength"},{"id":"b","text":"Level 4 focuses on flowing between positions and chaining sweeps with tempo control"},{"id":"c","text":"Level 4 only uses the double collar tie"},{"id":"d","text":"There is no difference"}]',
   'b',
   'Level 4 clinch work is about fluid transitions between all five positions, chaining sweeps so each failed attempt sets up the next, and controlling the tempo to keep opponents off-balance.',
   0),
  ('44444444-1102-0000-0000-000000000004',
   '33333333-1102-0000-0000-000000000004',
   'In the Thai 5-round scoring system, which rounds carry the most weight?',
   'multiple_choice',
   '[{"id":"a","text":"Rounds 1 and 5"},{"id":"b","text":"Rounds 3 and 4"},{"id":"c","text":"All rounds equally"},{"id":"d","text":"Only the final round"}]',
   'b',
   'Rounds 3 and 4 are the championship rounds and carry the most weight in Thai scoring. This is when fighters show their true ability at peak intensity.',
   1),
  ('44444444-1103-0000-0000-000000000004',
   '33333333-1102-0000-0000-000000000004',
   'The aerobic base provides approximately 60% of energy in a Muay Thai fight.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'true',
   'The aerobic system provides the sustained effort between explosive bursts, accounting for roughly 60% of total fight energy. This is why distance running is fundamental to Thai training.',
   2),
  ('44444444-1104-0000-0000-000000000004',
   '33333333-1102-0000-0000-000000000004',
   'In the hook-elbow combination, why does the hook precede the elbow?',
   'multiple_choice',
   '[{"id":"a","text":"The hook is stronger"},{"id":"b","text":"The hook draws the guard to one side, opening the path for the elbow"},{"id":"c","text":"The hook warms up the arm"},{"id":"d","text":"The elbow is a finishing strike and must come last"}]',
   'b',
   'The hook draws the opponent''s guard to one side to defend it. The elbow then crashes through from the same angle while they are still reacting — two strikes flowing as one motion.',
   3),
  ('44444444-1105-0000-0000-000000000004',
   '33333333-1102-0000-0000-000000000004',
   'A great pad holder should provide counter attacks after the fighter''s combinations to train defensive awareness.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'true',
   'Counter attacks from the pad holder train the fighter to return to guard after attacking, stay alert, and develop the attack-defend-attack rhythm essential in real fights.',
   4),
  ('44444444-1106-0000-0000-000000000004',
   '33333333-1102-0000-0000-000000000004',
   'What is the southern Thai style of Muay Boran known for defensive techniques?',
   'multiple_choice',
   '[{"id":"a","text":"Muay Korat"},{"id":"b","text":"Muay Chaiya"},{"id":"c","text":"Muay Lopburi"},{"id":"d","text":"Muay Thasao"}]',
   'b',
   'Muay Chaiya from southern Thailand is known for its defensive, turtle-like guard and devastating close-range elbows and knees.',
   5),
  ('44444444-1107-0000-0000-000000000004',
   '33333333-1102-0000-0000-000000000004',
   'How many full sparring sessions per week are recommended at Level 4?',
   'multiple_choice',
   '[{"id":"a","text":"Every day"},{"id":"b","text":"Maximum 2"},{"id":"c","text":"Once per month"},{"id":"d","text":"4-5 times"}]',
   'b',
   'Maximum 2 full sparring sessions per week. The body needs 48 hours to recover from high-intensity sparring. Overtraining leads to accumulated damage.',
   6),
  ('44444444-1108-0000-0000-000000000004',
   '33333333-1102-0000-0000-000000000004',
   'Corner advice between rounds should be short, specific, positive, and actionable.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'true',
   'A tired, emotional fighter can only absorb one to two instructions. They must be specific ("throw the body kick after your cross"), positive, and immediately actionable.',
   7),
  ('44444444-1109-0000-0000-000000000004',
   '33333333-1102-0000-0000-000000000004',
   'What is the most important factor in Thai fight scoring?',
   'multiple_choice',
   '[{"id":"a","text":"Total number of strikes thrown"},{"id":"b","text":"Clean strikes that visibly affect the opponent"},{"id":"c","text":"Aggression"},{"id":"d","text":"Ring entrance style"}]',
   'b',
   'Clean strikes that visibly affect the opponent are the most important scoring factor. Volume without accuracy or effect does not score in Thai judging.',
   8),
  ('44444444-1110-0000-0000-000000000004',
   '33333333-1102-0000-0000-000000000004',
   'Muay Boran was originally developed as a sport entertainment system.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'Muay Boran was developed as a battlefield combat system for the Siamese military. It became a sport (modern Muay Thai) in the 1920s-1930s when King Rama VII standardized rules.',
   9)
ON CONFLICT DO NOTHING;

-- ============================================
-- 022: Seed Garuda Certification Course (Level 5)
-- Maps directly to the 10 Garuda skills in
-- lib/certification-levels.ts
-- Requires Hanuman (Level 4) certificate + 60 day wait
-- ============================================

INSERT INTO courses (
  id, org_id, title, slug, description, short_description,
  difficulty, category, certificate_level,
  is_free, price_thb, status, is_featured, display_order,
  total_modules, total_lessons, estimated_hours
) VALUES (
  '11111111-0000-0000-0000-000000000005',
  NULL,
  'Garuda Certification — Level 5',
  'garuda-certification',
  'The pinnacle of Thailand''s national Muay Thai certification system. Demonstrate elite striking, full sparring proficiency, complete clinch mastery, teaching ability, spiritual and cultural connection, Muay Boran technique, mentorship, Ram Muay performance, and pass written and physical assessments. Garuda certifies you as a complete practitioner and guardian of the art.',
  'The pinnacle — elite mastery, teaching, culture, Muay Boran, Ram Muay, and comprehensive assessment.',
  'master',
  'certification',
  'garuda',
  FALSE,
  42000,
  'published',
  TRUE,
  5,
  12, 13, 32.0
) ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- MODULES (12 total — intro + 10 skills + final)
-- ============================================

INSERT INTO course_modules (id, course_id, title, description, module_order) VALUES
  ('22222222-0001-0000-0000-000000000005', '11111111-0000-0000-0000-000000000005',
   'Welcome to Garuda',
   'The Divine Eagle — the meaning of Level 5 and your responsibility as a guardian of Muay Thai.',
   0),
  ('22222222-0002-0000-0000-000000000005', '11111111-0000-0000-0000-000000000005',
   'Elite Speed & Precision Striking',
   'Maximizing speed without sacrificing power, timing mastery, and striking with surgical precision.',
   1),
  ('22222222-0003-0000-0000-000000000005', '11111111-0000-0000-0000-000000000005',
   'Full Sparring Proficiency',
   'Demonstrating composure, strategy, and technical excellence across all sparring formats and intensities.',
   2),
  ('22222222-0004-0000-0000-000000000005', '11111111-0000-0000-0000-000000000005',
   'Advanced Clinch Mastery (All Positions)',
   'Total clinch control — every position, every transition, every weapon from the inside.',
   3),
  ('22222222-0005-0000-0000-000000000005', '11111111-0000-0000-0000-000000000005',
   'Teaching Demonstration (Lead a Drill)',
   'Planning, communicating, and leading a training drill for a group — the bridge from fighter to teacher.',
   4),
  ('22222222-0006-0000-0000-000000000005', '11111111-0000-0000-0000-000000000005',
   'Spiritual & Cultural Connection to Muay Thai',
   'The deeper meaning — Buddhism, animism, the mongkol, pra jiad, and Muay Thai as way of life.',
   5),
  ('22222222-0007-0000-0000-000000000005', '11111111-0000-0000-0000-000000000005',
   'Muay Boran Technique Demonstration',
   'Performing and explaining traditional Muay Boran techniques — preserving the ancient art.',
   6),
  ('22222222-0008-0000-0000-000000000005', '11111111-0000-0000-0000-000000000005',
   'Mentorship — Coach a Beginner Through Basics',
   'One-on-one mentorship: teaching a complete beginner their first stance, jab, cross, and teep.',
   7),
  ('22222222-0009-0000-0000-000000000005', '11111111-0000-0000-0000-000000000005',
   'Ram Muay Performance',
   'Learning and performing the pre-fight dance — its meaning, movements, and spiritual significance.',
   8),
  ('22222222-0010-0000-0000-000000000005', '11111111-0000-0000-0000-000000000005',
   'Written Knowledge Assessment (History, Rules, Culture)',
   'Comprehensive written knowledge covering Muay Thai history, competition rules, and cultural traditions.',
   9),
  ('22222222-0011-0000-0000-000000000005', '11111111-0000-0000-0000-000000000005',
   'Comprehensive Physical Assessment',
   'The final physical test — demonstrating elite-level technique, power, timing, and fight IQ.',
   10),
  ('22222222-0012-0000-0000-000000000005', '11111111-0000-0000-0000-000000000005',
   'Final Assessment',
   'Review all Garuda skills and take the comprehensive knowledge assessment.',
   11)
ON CONFLICT DO NOTHING;

-- ============================================
-- MODULE 1: Welcome to Garuda (2 lessons)
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0101-0000-0000-000000000005',
   '11111111-0000-0000-0000-000000000005',
   '22222222-0001-0000-0000-000000000005',
   'The Garuda — Guardian of the Art',
   'text', 0, TRUE, 12,
   '# The Garuda — Guardian of the Art

## The Final Ascent

You have climbed from Naga to Garuda. The serpent learned to move, the lion learned to fight, the warrior learned to lead. Now the eagle must see everything — from above, with clarity, wisdom, and responsibility.

Garuda is not the end. It is the beginning of a lifelong obligation: to protect, to teach, and to carry Muay Thai forward with integrity.

## What Garuda Demands

This is not simply about being a better fighter. Level 5 requires mastery across **every dimension** of Muay Thai:

- **Technical excellence** — Elite striking speed and precision, complete sparring proficiency, total clinch mastery
- **Teaching ability** — Leading drills, mentoring beginners, communicating technique clearly
- **Cultural depth** — Understanding the spiritual roots, performing Ram Muay, connecting to the art''s soul
- **Knowledge** — History, competition rules, Muay Boran, and the traditions that make Muay Thai unique
- **Physical mastery** — A comprehensive assessment proving you can perform at the highest level

## The 10 Competencies

1. Elite speed and precision striking
2. Full sparring proficiency
3. Advanced clinch mastery (all positions)
4. Teaching demonstration (lead a drill)
5. Spiritual and cultural connection to Muay Thai
6. Muay Boran technique demonstration
7. Mentorship — coach a beginner through basics
8. Ram Muay performance
9. Written knowledge assessment (history, rules, culture)
10. Comprehensive physical assessment

Each competency must be demonstrated in person and signed off by a gym owner or admin. There are no shortcuts at this level.

## The Garuda in Thai Mythology

The Garuda is the king of birds, mount of Vishnu, and the national symbol of Thailand. It represents divine power exercised with wisdom. The Garuda does not destroy — it protects. It does not hoard knowledge — it shares it.

A Garuda-certified practitioner carries this same responsibility. You are not just skilled — you are a guardian of the art.

## Duration and Structure

This course spans approximately **one month** of dedicated study and practice. The 60-day minimum wait after Hanuman ensures you have had time to absorb and practice Level 4 material before attempting the pinnacle.

Price: ฿42,000 — reflecting the comprehensive assessment, extended duration, and the significance of this certification.

Only gym **owners and admins** can issue the Garuda certificate. This is by design — the highest certification carries the highest accountability.'),

  ('33333333-0102-0000-0000-000000000005',
   '11111111-0000-0000-0000-000000000005',
   '22222222-0001-0000-0000-000000000005',
   'Assessment Requirements & Expectations',
   'text', 1, FALSE, 10,
   '# Assessment Requirements & Expectations

## How Garuda Assessment Works

Unlike previous levels where individual skills are signed off independently, Garuda requires a **holistic assessment**. Your evaluator must see not just isolated techniques but how everything connects.

### Assessment Format

Each competency has its own sign-off, but assessors are looking for:

- **Integration** — Can you flow between skills? Does your clinch work connect to your striking? Does your knowledge inform your technique?
- **Teaching quality** — Can you explain *why*, not just *how*? Can you adapt your teaching to different learners?
- **Cultural respect** — Do you understand what you''re doing, not just the movements but the meaning?
- **Composure** — At this level, pressure should reveal character, not create panic

### What Assessors Look For

| Area | Expectation |
|------|-------------|
| Striking | Speed, timing, and accuracy under fatigue — not just power |
| Sparring | Control, strategy adaptation, and composure against different styles |
| Clinch | Seamless transitions between all positions, appropriate weapon selection |
| Teaching | Clear communication, patience, safety awareness, progressive instruction |
| Culture | Genuine understanding and respect, not rehearsed answers |
| Knowledge | Deep understanding of history, rules, and traditions |
| Physical | Sustained performance across all skills without significant degradation |

### Preparation Advice

- Review all previous level material — Garuda assessment may include anything from Naga through Hanuman
- Practice teaching friends or family who don''t train — the hardest student to teach is the complete beginner
- Study Thai boxing history beyond what''s in this course — read books, watch documentaries, talk to Thai trainers
- Train your Ram Muay with a qualified instructor — this is not something to learn from videos alone
- Stay humble — the more you know, the more you realize there is to learn

### Timeline

Most candidates spend 4-6 weeks working through this material, practicing each skill area extensively before requesting assessment. There is no rush. The Garuda waits for those who are ready.');

-- ============================================
-- MODULE 2: Elite Speed & Precision Striking
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0201-0000-0000-000000000005',
   '11111111-0000-0000-0000-000000000005',
   '22222222-0002-0000-0000-000000000005',
   'The Science of Speed',
   'text', 0, FALSE, 15,
   '# The Science of Speed

## Speed vs. Power — The False Choice

At lower levels, you learned to generate power through hip rotation and weight transfer. Now you must learn that **speed creates power** — a fast strike that lands clean is more devastating than a slow strike with full commitment.

The equation: Force = Mass × Acceleration. You cannot add mass, but you can dramatically increase acceleration.

## The Three Types of Speed

### 1. Initiation Speed
How quickly you begin a technique from a neutral position. This depends on:
- **Relaxation** — Tense muscles are slow muscles. Stay loose until the moment of impact
- **Minimal telegraphing** — Eliminate wasted movement that signals your intention
- **First-twitch response** — Training your fast-twitch muscle fibers through explosive drills

### 2. Execution Speed
How fast the technique travels from start to finish:
- **Efficient mechanics** — The shortest path between two points. No loops, no wind-ups
- **Snap vs. push** — A snapping strike retracts instantly; a pushing strike lingers
- **Sequential muscle activation** — Power flows from feet → hips → shoulders → limb. Each segment accelerates the next

### 3. Recovery Speed
How quickly you return to guard after striking:
- **Balance retention** — Never overcommit your weight
- **Immediate retraction** — The hand or leg comes back as fast as it went out
- **Defensive readiness** — You should be able to block during your own recovery

## Precision: Targeting Under Pressure

Speed without accuracy is wasted energy. Elite precision means:
- **Target selection** — Knowing which targets are available at each range
- **Angle recognition** — Seeing openings in real time, not preset combinations
- **Micro-adjustments** — Shifting aim mid-strike based on opponent movement
- **Fatigue-resistant accuracy** — Maintaining precision when exhausted

## Drills for Speed Development

### Mirror Shadow Boxing
Shadow box in front of a mirror at 50% speed, watching for telegraphing. Every movement should be invisible until it explodes. Gradually increase speed while maintaining the stealth.

### Double-End Bag
The double-end bag demands speed, timing, and accuracy simultaneously. Start with single strikes, progress to combinations. The bag''s unpredictable movement trains real-time targeting.

### Speed Bag Pyramid
30 seconds fast → 15 seconds rest → 45 seconds fast → 15 seconds rest → 60 seconds fast. Focus on rhythm and maintaining hand speed without dropping technique.

### Reaction Pads
A partner flashes pads at random angles. You must recognize the target and fire the correct technique within a fraction of a second. This trains initiation speed and target recognition simultaneously.

## Common Speed Killers

1. **Excessive tension** — Holding tension in shoulders, jaw, or hands between strikes
2. **Over-breathing** — Holding breath or breathing erratically slows everything
3. **Heavy feet** — Flat-footed stance kills initiation speed
4. **Visual fixation** — Staring at one point instead of using peripheral vision
5. **Mental hesitation** — Overthinking technique instead of trusting training');

-- Quiz for Module 2
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0201-0000-0000-000000000005',
   '33333333-0201-0000-0000-000000000005',
   'Which type of speed refers to how quickly you begin a technique from a neutral position?',
   'multiple_choice',
   '[{"id":"a","text":"Execution speed"},{"id":"b","text":"Recovery speed"},{"id":"c","text":"Initiation speed"},{"id":"d","text":"Reaction speed"}]',
   'c',
   'Initiation speed is how quickly you begin a technique from a neutral position. It depends on relaxation, minimal telegraphing, and fast-twitch muscle activation.',
   0),
  ('44444444-0202-0000-0000-000000000005',
   '33333333-0201-0000-0000-000000000005',
   'A slow strike with full power is generally more effective than a fast strike that lands clean.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'Speed creates power (Force = Mass × Acceleration). A fast strike that lands clean is more devastating because you can dramatically increase acceleration, creating greater force than a slower, fully committed strike.',
   1)
ON CONFLICT DO NOTHING;

-- ============================================
-- MODULE 3: Full Sparring Proficiency
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0301-0000-0000-000000000005',
   '11111111-0000-0000-0000-000000000005',
   '22222222-0003-0000-0000-000000000005',
   'Sparring at the Highest Level',
   'text', 0, FALSE, 15,
   '# Sparring at the Highest Level

## Beyond Technique — The Art of Fighting

At Garuda level, sparring is no longer about learning techniques. You know the techniques. Now sparring becomes about **applying them intelligently** against resisting opponents who also know what they are doing.

Full sparring proficiency means demonstrating composure, adaptability, and technical excellence across all formats and intensities.

## Sparring Formats You Must Master

### 1. Technical Sparring (Light Contact)
The foundation. Two partners explore technique at 30-40% power:
- Focus on timing and placement, not damage
- Experiment with new combinations and entries
- Develop defensive reflexes in a low-pressure environment
- Practice reading your partner''s patterns

### 2. Conditional Sparring
Sparring with specific constraints that force growth:
- **Body-only sparring** — Develops body kick offense and defense
- **Clinch-only sparring** — Pure inside fighting with knees and sweeps
- **Counter-only sparring** — One partner attacks, the other can only counter
- **Southpaw sparring** — Both switch stance to develop bilateral skill
- **3-weapon limit** — Choose only 3 techniques for the entire round

### 3. Hard Sparring (Controlled Full Contact)
The closest simulation to a real fight:
- 70-80% power with control — hard enough to test real reactions
- Full weapon selection — punches, kicks, knees, elbows (with shin guards and headgear)
- Round-based with rest periods — simulating fight conditions
- Requires mutual trust and respect between partners

### 4. Open Sparring
Mixed format with no pre-set rules:
- Adapting to partners of different sizes, styles, and skill levels
- Demonstrating appropriate power adjustment — harder vs. experienced partners, lighter vs. less experienced
- Showing you can "dial up" or "dial down" without losing technical quality

## What Assessors Look For

### Composure Under Pressure
- Breathing remains controlled even when hit hard
- Guard resets immediately after exchanges
- No emotional reactions — frustration, anger, or panic
- Ability to smile, nod, or reset after taking clean shots

### Strategy Adaptation
- Changing approach when initial strategy isn''t working
- Recognizing and exploiting opponent patterns within the round
- Adjusting range based on opponent''s strengths
- Using feints and setups, not just raw attacks

### Defensive Responsibility
- Never dropping guard during or after combinations
- Checking kicks consistently, not just absorbing them
- Moving head off centerline against punchers
- Clinch defense — knowing when to enter and exit

### Technical Variety
- Using all 8 weapons (punches, kicks, elbows, knees)
- Smooth transitions between ranges (long, medium, clinch)
- Both orthodox and southpaw comfort
- Defensive techniques: blocks, parries, evasions, catches

## The Golden Rule of Sparring

**Match your partner.** A Garuda-level practitioner never bullies a less experienced partner and never backs down from a more experienced one. You adjust your intensity to create the most productive session for both people. This is not weakness — this is mastery.');

-- Quiz for Module 3
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0301-0000-0000-000000000005',
   '33333333-0301-0000-0000-000000000005',
   'What is the primary focus of technical sparring?',
   'multiple_choice',
   '[{"id":"a","text":"Dealing maximum damage to your partner"},{"id":"b","text":"Timing and placement at light contact"},{"id":"c","text":"Testing your cardio under pressure"},{"id":"d","text":"Practicing only defensive techniques"}]',
   'b',
   'Technical sparring operates at 30-40% power and focuses on timing and placement rather than damage. It allows exploration of new techniques in a low-pressure environment.',
   0),
  ('44444444-0302-0000-0000-000000000005',
   '33333333-0301-0000-0000-000000000005',
   'A Garuda-level practitioner should always spar at maximum intensity to prove their skill.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'The golden rule of sparring is to match your partner. A Garuda-level practitioner adjusts intensity to create the most productive session for both people. This ability to dial up or down without losing quality is itself a sign of mastery.',
   1)
ON CONFLICT DO NOTHING;

-- ============================================
-- MODULE 4: Advanced Clinch Mastery (All Positions)
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0401-0000-0000-000000000005',
   '11111111-0000-0000-0000-000000000005',
   '22222222-0004-0000-0000-000000000005',
   'Complete Clinch Mastery',
   'text', 0, FALSE, 18,
   '# Complete Clinch Mastery

## The Clinch Is the Soul of Muay Thai

Many combat sports include clinching, but only Muay Thai treats the clinch as an **art form**. At Garuda level, you must demonstrate complete mastery of every clinch position, transition, and weapon.

## The Five Clinch Positions

### 1. Double Collar Tie (Plum Position)
The dominant position — both hands behind the opponent''s head:
- **Control**: Pull the head down, controlling their posture and vision
- **Weapons**: Straight knees (khao trong), curved knees (khao khong), flying knee
- **Escapes to know**: Frame and push, swim through, level change

### 2. Single Collar Tie (One Hand Behind Head)
The transitional position — one hand controls the head, the other has options:
- **Control**: Angle the opponent with the head hand while the free hand attacks
- **Weapons**: Short elbows, uppercuts, hooks, knees with the free side
- **Transitions**: Pull to double collar, push to long range, or enter body lock

### 3. Body Lock (Over-Under or Double Underhooks)
The wrestling-influenced position:
- **Control**: Hip-to-hip pressure, limiting opponent''s knee strikes
- **Weapons**: Short hooks, uppercuts, trips, and throws
- **Sweeps**: Hip throws, foot sweeps, inside trips

### 4. Arm Tie (Arm Control Position)
Controlling one or both of the opponent''s arms:
- **Control**: Trapping the bicep or wrist to neutralize their weapons
- **Weapons**: Free-side elbows, knees, and spins
- **Purpose**: Defensive — neutralizing a dangerous clinch fighter

### 5. Open Guard (Fighting for Position)
The entry phase — neither fighter has established control:
- **Control**: Hand fighting, frame management, collar grabs
- **Weapons**: Long knees, push kicks to create space
- **Goal**: Establish one of the four dominant positions above

## Transitions — The Key to Mastery

Static clinch positions are Level 3 material. At Garuda level, you must **flow between positions**:

### Transition Chains
1. Open guard → Single collar → Double collar → Knee → Release → Open guard
2. Body lock → Sweep attempt → Single collar → Elbow → Disengage
3. Arm tie → Spin → Back control → Knee to body → Double collar
4. Double collar → Opponent defends → Switch to body lock → Trip → Reset

### Principles of Transitional Clinch
- **Never fight for a dead position** — If your opponent counters your position, transition to the next one rather than fighting harder for the same grip
- **Chain attacks with transitions** — A knee from double collar, into a sweep from body lock, into an elbow from single collar
- **Balance disruption** — Every transition should momentarily break your opponent''s balance
- **Energy management** — The clinch is exhausting. Use leverage and timing, not muscle

## Clinch Offense at Garuda Level

At this level, you should be able to:
- Deliver knees from every position
- Throw short elbows from collar tie and arm tie
- Execute sweeps from body lock and collar tie
- Use the clinch to set up strikes after disengaging
- Control the pace — speed up or slow down the clinch at will

## Clinch Defense at Garuda Level

And defend:
- Prevent the opponent from establishing double collar
- Escape body lock through frames and hip movement
- Neutralize knee strikes through positioning and blocking
- Counter sweeps with weight distribution and timing
- Disengage cleanly when the clinch is not favorable

## The Clinch Assessment

Your assessor will evaluate:
1. Can you enter the clinch from striking range?
2. Can you establish dominant position against resistance?
3. Can you transition fluidly between all five positions?
4. Can you attack effectively from each position?
5. Can you defend and escape from disadvantaged positions?
6. Can you control the pace and energy of the clinch?');

-- Quiz for Module 4
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0401-0000-0000-000000000005',
   '33333333-0401-0000-0000-000000000005',
   'Which clinch position involves both hands behind the opponent''s head?',
   'multiple_choice',
   '[{"id":"a","text":"Single collar tie"},{"id":"b","text":"Body lock"},{"id":"c","text":"Double collar tie (plum position)"},{"id":"d","text":"Arm tie"}]',
   'c',
   'The double collar tie, also called the plum position, involves both hands behind the opponent''s head. It is the dominant clinch position, offering control over the opponent''s posture and vision.',
   0),
  ('44444444-0402-0000-0000-000000000005',
   '33333333-0401-0000-0000-000000000005',
   'At Garuda level, if your opponent counters your clinch position, you should fight harder for the same grip.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'A key principle of transitional clinch is to never fight for a dead position. If your opponent counters your grip, transition to the next position rather than fighting harder for the same one. This fluid movement between positions is what separates Garuda-level clinch from lower levels.',
   1)
ON CONFLICT DO NOTHING;

-- ============================================
-- MODULE 5: Teaching Demonstration (Lead a Drill)
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0501-0000-0000-000000000005',
   '11111111-0000-0000-0000-000000000005',
   '22222222-0005-0000-0000-000000000005',
   'From Fighter to Teacher',
   'text', 0, FALSE, 18,
   '# From Fighter to Teacher

## Why Teaching Matters

Being able to do something is not the same as being able to teach it. The ability to **transfer knowledge** to others is what separates a skilled practitioner from a guardian of the art. Every Garuda must be able to teach.

Teaching also deepens your own understanding. When you must explain *why* a technique works — not just demonstrate it — you discover gaps in your own knowledge.

## The Teaching Assessment

For your Garuda assessment, you will be asked to **lead a drill** for a small group (2-5 people). The drill should:
- Last 10-15 minutes
- Cover a specific technique or combination
- Be appropriate for the students'' skill level
- Include demonstration, explanation, practice time, and correction

## Planning a Drill

### 1. Define the Objective
What specific skill will students walk away with? Be precise:
- ❌ "Practice kicks" (too vague)
- ✅ "Develop the rear round kick with proper hip rotation and follow-through"

### 2. Structure the Progression
Build from simple to complex:
1. **Explain and demonstrate** the technique (2-3 minutes)
2. **Isolate the key movement** — have students practice the hip rotation alone (2 minutes)
3. **Add the full technique** — slow speed, focusing on form (3 minutes)
4. **Partner drill** — practice on pads with feedback (4-5 minutes)
5. **Live application** — light sparring or flow drill incorporating the technique (2-3 minutes)

### 3. Prepare Coaching Cues
Have 2-3 short, memorable phrases ready:
- "Turn the hip over like you''re stubbing out a cigarette"
- "Your hand goes back as your leg goes forward — always balanced"
- "Hit *through* the target, not *at* it"

## Communication Principles

### Demonstrate First, Explain Second
Students learn by watching. Show the complete technique at full speed first, then break it down. Many instructors make the mistake of explaining for 5 minutes before showing anything.

### Use Positive Correction
- ❌ "You''re doing it wrong. Stop dropping your hands."
- ✅ "Good power! Now keep that guard high as you kick — it''ll protect you and make the kick even better."

### Adapt to the Student
Different people learn differently:
- **Visual learners** — Need to see the technique from multiple angles
- **Kinesthetic learners** — Need to feel the movement, possibly with physical guidance
- **Analytical learners** — Need to understand the biomechanics and reasoning

### Safety First
As a teacher, student safety is your primary responsibility:
- Warm up before any impact work
- Ensure proper protective equipment
- Match partners appropriately by size and skill
- Stop immediately if technique is dangerous
- Never push students beyond their physical limits without clear purpose

## Common Teaching Mistakes

1. **Talking too much** — Students came to train, not listen to a lecture. Keep explanations under 2 minutes.
2. **Not watching** — Walking around checking your phone while students drill. You must observe and correct.
3. **Over-correcting** — Fix one thing at a time. Three corrections at once means zero retention.
4. **Ego teaching** — Demonstrating how good *you* are instead of focusing on what the *student* needs.
5. **No progression** — Jumping to advanced combinations before students can throw a basic jab.

## What Assessors Look For

| Area | Expectation |
|------|-------------|
| Preparation | Clear objective, structured progression, appropriate for audience |
| Demonstration | Correct technique shown clearly from multiple angles |
| Communication | Clear, concise, encouraging, adapted to students |
| Observation | Actively watching students and providing individual correction |
| Safety | Proper warm-up, equipment checks, appropriate intensity |
| Time management | Drill fits within the allotted time without rushing or dragging |');

-- Quiz for Module 5
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0501-0000-0000-000000000005',
   '33333333-0501-0000-0000-000000000005',
   'When planning a drill, what is the best way to define the objective?',
   'multiple_choice',
   '[{"id":"a","text":"Keep it general so you can adjust on the fly"},{"id":"b","text":"Be specific about what students will learn — a precise technique or skill"},{"id":"c","text":"Let the students decide what they want to work on"},{"id":"d","text":"Copy a drill from YouTube without modification"}]',
   'b',
   'A well-planned drill has a specific, precise objective — for example, "develop the rear round kick with proper hip rotation" rather than a vague goal like "practice kicks." This clarity guides the entire drill structure.',
   0),
  ('44444444-0502-0000-0000-000000000005',
   '33333333-0501-0000-0000-000000000005',
   'You should explain a technique in detail for several minutes before demonstrating it.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'The principle is demonstrate first, explain second. Students learn by watching. Show the complete technique at full speed first, then break it down. Many instructors make the mistake of explaining for minutes before showing anything.',
   1)
ON CONFLICT DO NOTHING;

-- ============================================
-- MODULE 6: Spiritual & Cultural Connection to Muay Thai
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0601-0000-0000-000000000005',
   '11111111-0000-0000-0000-000000000005',
   '22222222-0006-0000-0000-000000000005',
   'The Soul of Muay Thai',
   'text', 0, FALSE, 20,
   '# The Soul of Muay Thai

## More Than a Sport

Muay Thai is inseparable from Thai culture, spirituality, and national identity. A Garuda-level practitioner must understand and respect these connections — not as academic knowledge but as a living part of their practice.

## Buddhism and Muay Thai

Thailand is a predominantly Buddhist country, and Buddhism permeates every aspect of Muay Thai:

### The Gym as Temple
Traditional Muay Thai gyms operate with a spiritual dimension:
- Students show respect to the gym space when entering and leaving
- The *mongkol* (headband) hangs in a place of honor
- Training begins and ends with the *wai* (prayer-like greeting)
- The *kru* (teacher) holds a role similar to a spiritual guide, not just a coach

### Fighting Without Ego
Buddhist philosophy teaches non-attachment, and this manifests in the fighter''s approach:
- **Accept what comes** — Getting hit is part of fighting. React without emotion.
- **Impermanence** — Each round is new. A bad round does not define the fight.
- **Right intention** — Fighting to test yourself, not to harm your opponent.
- **Mindfulness** — Total presence during combat, not dwelling on past exchanges or future fears.

### Merit and Sacrifice
Many Thai fighters fight to support their families. This act of sacrifice is seen as making merit (*tham bun*) — one of the highest Buddhist virtues. Understanding this context changes how you view the violence of the sport. It is not aggression; it is service.

## Animism and the Supernatural

Older than Buddhism in Thailand, animist beliefs coexist with Buddhist practice:

### The Mongkol (มงคล)
The sacred headband worn during the Wai Kru:
- Traditionally given by the gym master, not purchased
- Believed to carry protective spiritual power (*khwan*)
- Only the trainer or the fighter should touch it — never placed on the ground
- Worn on the head (the highest, most sacred part of the body in Thai culture)
- Removed before the fight begins by the trainer

### The Pra Jiad (ประเจียด)
The armbands worn during fights:
- Originally torn from a mother''s clothing — a symbol of protection and love
- Now often given by the gym, but the symbolism remains
- Worn on one or both arms throughout the fight
- Some contain small prayer scrolls or blessed objects

### Saak Yant (สักยันต์)
Sacred tattoos common among fighters:
- Applied by monks or spiritual masters (*ajarn*)
- Each design carries specific protective properties
- The wearer must follow rules (*khata*) to maintain the power
- Common designs: Hah Taew (five lines), Suea Koo (twin tigers), Hanuman

## The Wai Kru Ram Muay

The pre-fight ritual dance is the most visible expression of Muay Thai''s spiritual dimension:
- **Wai Kru** — Paying respect to teachers past and present
- **Ram Muay** — The dance itself, unique to each gym and fighter
- Demonstrates the fighter''s gym lineage and fighting style
- Serves as mental preparation — entering a meditative state before combat
- Traditionally performed in the direction of the fighter''s birthplace or toward their home gym

(You will study Ram Muay in depth in Module 9.)

## Cultural Respect for Foreign Practitioners

As a non-Thai practitioner (if applicable), understand:
- You are a **guest** in this tradition. Approach with humility.
- Learn Thai terminology. Using proper Thai names for techniques shows respect.
- Understand the *wai* — when and how to perform it appropriately
- Feet are considered the lowest part of the body. Never point your feet at people, the mongkol, or Buddha images.
- The head is sacred. Never touch someone''s head, even playfully.
- Ask permission before photographing shrines, rituals, or ceremonies
- Your certification does not make you Thai or give you authority over Thai customs — it makes you a respectful student of the art

## What Assessors Evaluate

This is not a test of memorization. Assessors want to see **genuine understanding and respect**:
- Can you explain the significance of the mongkol without reading from notes?
- Do you understand why Buddhist philosophy matters to fighting?
- Can you describe the cultural context of Muay Thai beyond technique?
- Do you demonstrate respect in your daily training behavior?
- Can you discuss how spiritual elements enhance rather than conflict with athletic performance?');

-- Quiz for Module 6
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0601-0000-0000-000000000005',
   '33333333-0601-0000-0000-000000000005',
   'What is the mongkol and why is it significant?',
   'multiple_choice',
   '[{"id":"a","text":"A type of punch used in clinch fighting"},{"id":"b","text":"A sacred headband believed to carry protective spiritual power, given by the gym master"},{"id":"c","text":"A training weight worn during conditioning"},{"id":"d","text":"A ranking belt similar to those in karate"}]',
   'b',
   'The mongkol is a sacred headband traditionally given by the gym master, believed to carry protective spiritual power (khwan). It is worn during the Wai Kru and removed by the trainer before the fight begins.',
   0),
  ('44444444-0602-0000-0000-000000000005',
   '33333333-0601-0000-0000-000000000005',
   'In Thai culture, the feet are considered the most sacred part of the body.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'In Thai culture, the head is considered the most sacred part of the body, while the feet are the lowest. You should never point your feet at people, the mongkol, or Buddha images, and never touch someone''s head.',
   1)
ON CONFLICT DO NOTHING;

-- ============================================
-- MODULE 7: Muay Boran Technique Demonstration
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0701-0000-0000-000000000005',
   '11111111-0000-0000-0000-000000000005',
   '22222222-0007-0000-0000-000000000005',
   'The Ancient Art — Muay Boran',
   'text', 0, FALSE, 20,
   '# The Ancient Art — Muay Boran

## What Is Muay Boran?

Muay Boran (มวยโบราณ) translates to "ancient boxing." It is the umbrella term for the traditional fighting arts of Thailand that preceded modern Muay Thai. When the sport was codified with rules, rings, gloves, and weight classes in the 1920s-1930s, many techniques were removed for safety. These techniques live on in Muay Boran.

## Historical Context

### Pre-Modern Era
Before the 20th century, Muay Thai was a battlefield art:
- Fighters used rope bindings (*kaad chuek*) instead of gloves — sometimes dipped in ground glass
- No weight classes, no time limits, no restricted targets
- Techniques included headbutts, throws, joint locks, and ground fighting
- Fights continued until one fighter could not continue

### The Transition to Modern Muay Thai
In the 1920s-1930s, King Rama VII oversaw the modernization:
- Boxing gloves replaced rope bindings
- Weight divisions were introduced
- Time rounds with rest periods
- Rules prohibiting the most dangerous techniques
- Stadiums (Rajadamnern 1945, Lumpinee 1956) formalized the sport

### What Was Lost
Many techniques that were practical on the battlefield became illegal in the ring:
- Strikes to the back of the head and spine
- Small joint manipulation
- Throws from behind
- Ground-and-pound
- Headbutts and eye gouges

## Key Muay Boran Techniques

### Mae Mai (แม่ไม้) — The Master Techniques
There are 15 Mae Mai, the foundational techniques of Muay Boran:

1. **Salab Fan Pla** (สลับฟันปลา) — Cross-switch, deflect and counter with the opposite hand
2. **Paksa Waeg Rang** (ปักษาแหวกรัง) — Bird peeping through the nest, deflect and strike the ribs
3. **Chawa Sad Hok** (ชวาสัดหก) — Javanese throws spear, leaning back elbow or knee counter
4. **Inao Taeng Krit** (อิเหนาแทงกริช) — Inao stabs with kris, upward elbow strike
5. **Yo Khao Phra Sumane** (โยคเขาพระสุเมรุ) — Raising the Sumeru mountain, lifting knee to counter kick

### Look Mai (ลูกไม้) — The Complementary Techniques
There are 15 Look Mai that extend the Mae Mai:

1. **Erawan Suey Nga** (เอราวัณสอยงา) — Erawan raises tusks, double uppercut
2. **Bata Loob Pak** (บาทาลอบภาค) — Foot tricks the face, deceptive kick to the head
3. **Khun Yak Jab Ling** (ขุนยักษ์จับลิง) — Giant catches monkey, catch kick and sweep
4. **Prarama Nao Sorn** (พระรามเหน่าศร) — Rama strings the bow, downward elbow from caught kick

### Muay Boran Styles
Different regions of Thailand developed distinct styles:
- **Muay Chaiya** (South) — Defensive, short-range, emphasizes elbows and knees
- **Muay Korat** (East) — Power-focused, heavy hands, known for the "buffalo punch"
- **Muay Lopburi** (Central) — Technical, clever movement, deceptive techniques
- **Muay Thasao** (North) — Speed-focused, rapid attacks, known for fast kicks

## The Demonstration Assessment

For your Garuda certification, you must:

1. **Perform 3-5 Mae Mai or Look Mai techniques** with a partner
2. **Explain the name, meaning, and application** of each technique
3. **Show the connection** between the Muay Boran technique and its modern Muay Thai equivalent
4. **Demonstrate with respect** — Muay Boran demonstration is not about showing off; it is about preserving heritage

### Preparation Tips
- Learn from a qualified instructor, not YouTube
- Understand the story behind each technique name — many reference Thai mythology (Ramayana)
- Practice both sides of each technique (attacker and defender)
- Focus on 3-5 techniques you can perform well rather than trying to learn all 30');

-- Quiz for Module 7
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0701-0000-0000-000000000005',
   '33333333-0701-0000-0000-000000000005',
   'What does "Muay Boran" translate to?',
   'multiple_choice',
   '[{"id":"a","text":"Sacred fighting"},{"id":"b","text":"Ring boxing"},{"id":"c","text":"Ancient boxing"},{"id":"d","text":"Royal combat"}]',
   'c',
   'Muay Boran (มวยโบราณ) translates to "ancient boxing." It is the umbrella term for the traditional fighting arts of Thailand that preceded the codified modern sport of Muay Thai.',
   0),
  ('44444444-0702-0000-0000-000000000005',
   '33333333-0701-0000-0000-000000000005',
   'The Mae Mai of Muay Boran consists of 30 master techniques.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'There are 15 Mae Mai (master techniques) and 15 Look Mai (complementary techniques), totaling 30 techniques between the two categories. The Mae Mai alone consists of 15 foundational techniques.',
   1)
ON CONFLICT DO NOTHING;

-- ============================================
-- MODULE 8: Mentorship — Coach a Beginner Through Basics
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0801-0000-0000-000000000005',
   '11111111-0000-0000-0000-000000000005',
   '22222222-0008-0000-0000-000000000005',
   'The Art of Mentorship',
   'text', 0, FALSE, 15,
   '# The Art of Mentorship

## Why One-on-One Mentorship?

Module 5 assessed your ability to lead a group drill. This module goes deeper: **can you take a complete beginner and teach them their first techniques from scratch?**

This is the hardest teaching challenge. Group drill leadership allows you to set the pace. One-on-one mentorship requires you to meet the student where they are — their body, their fears, their learning style.

## The Mentorship Assessment

You will be paired with someone who has **never trained Muay Thai** (or has minimal experience). In 30-45 minutes, you must teach them:

1. **Basic stance** (guard position)
2. **Jab and cross** (mat wiang)
3. **Front kick** (teep)
4. **Basic defense** (hands up, check awareness)

These are the Naga (Level 1) fundamentals. If you can''t teach them simply and effectively, you have not internalized them deeply enough for Garuda.

## Teaching a Complete Beginner

### The First 5 Minutes: Building Trust
Before any technique:
- Introduce yourself and ask about their experience and any injuries
- Explain what you''ll cover today — set clear expectations
- Demonstrate that Muay Thai training is safe and controlled
- Establish the *wai* as the greeting between training partners

### Common Beginner Challenges

**Fear of contact**: Many beginners are nervous about getting hit. Address this directly:
- "Today is about technique, not fighting. Nobody hits anybody."
- Start with shadow boxing before introducing pads
- Build contact gradually — light taps, then moderate pad work

**Body awareness**: Beginners often don''t know how to rotate their hips or shift their weight:
- Use analogies: "Pretend you''re squishing a bug with your back foot as you punch"
- Guide their hips with your hands (ask permission first)
- Have them practice the movement slowly before adding the strike

**Overthinking**: Too much instruction causes paralysis:
- Maximum 2 coaching cues at a time
- Repeat the same cue until they get it — don''t pile on new information
- Celebrate small wins: "That was it! Feel the difference?"

**Frustration**: Beginners get frustrated when they can''t replicate what they see:
- Normalize the struggle: "Everyone feels awkward for the first month. You''re doing great."
- Show them your own beginner footage or tell a story about when you struggled
- Break the technique into smaller pieces

### The Session Structure

| Time | Activity |
|------|----------|
| 0-5 min | Introduction, expectations, warm-up |
| 5-10 min | Stance — weight distribution, guard, footwork |
| 10-18 min | Jab and cross — step by step, shadow then pads |
| 18-25 min | Front kick (teep) — chamber, extend, retract |
| 25-32 min | Combining: jab-cross-teep sequence |
| 32-38 min | Basic defense awareness — keeping guard up while striking |
| 38-45 min | Cool down, recap, answer questions, encourage next session |

### What Assessors Look For

1. **Patience** — Never showing frustration with the beginner''s pace
2. **Adaptability** — Adjusting your teaching when something isn''t clicking
3. **Safety awareness** — Ensuring the beginner doesn''t hurt themselves
4. **Encouragement** — Building confidence, not just technique
5. **Accuracy** — Teaching correct fundamentals, not shortcuts
6. **The beginner''s experience** — After the session, the assessor may ask the beginner how they felt. Their feedback matters.

## The Deeper Purpose

This module exists because **Muay Thai grows one student at a time**. Every current champion was once a nervous beginner who needed someone patient to show them their first jab. That person was a mentor.

At Garuda level, you are that mentor. You don''t just carry the art forward through your own training — you carry it forward by creating the next generation of practitioners.');

-- Quiz for Module 8
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0801-0000-0000-000000000005',
   '33333333-0801-0000-0000-000000000005',
   'What should you do in the first 5 minutes of a mentorship session with a complete beginner?',
   'multiple_choice',
   '[{"id":"a","text":"Immediately start teaching the jab to save time"},{"id":"b","text":"Build trust — introduce yourself, ask about experience and injuries, set expectations"},{"id":"c","text":"Have them watch you demonstrate all the techniques first"},{"id":"d","text":"Put on sparring gear and do light contact work"}]',
   'b',
   'The first 5 minutes should focus on building trust: introduce yourself, ask about their experience and injuries, explain what you''ll cover, and demonstrate that training is safe and controlled. This foundation enables effective learning.',
   0),
  ('44444444-0802-0000-0000-000000000005',
   '33333333-0801-0000-0000-000000000005',
   'When a beginner is struggling, you should give them multiple corrections simultaneously to help them improve faster.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'Give a maximum of 2 coaching cues at a time and repeat the same cue until they get it. Piling on new information causes overthinking and paralysis. Fix one thing at a time for better retention.',
   1)
ON CONFLICT DO NOTHING;

-- ============================================
-- MODULE 9: Ram Muay Performance
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-0901-0000-0000-000000000005',
   '11111111-0000-0000-0000-000000000005',
   '22222222-0009-0000-0000-000000000005',
   'The Ram Muay — Pre-Fight Ritual Dance',
   'text', 0, FALSE, 20,
   '# The Ram Muay — Pre-Fight Ritual Dance

## What Is the Ram Muay?

The Ram Muay (รำมวย) is the ritual dance performed before a Muay Thai fight. Combined with the Wai Kru (ไหว้ครู — paying respect to the teacher), it forms the **Wai Kru Ram Muay**, one of the most recognizable and sacred elements of Muay Thai.

## Purpose and Meaning

The Ram Muay serves multiple purposes simultaneously:

### 1. Spiritual Preparation
- Entering a meditative state before combat
- Invoking protective spirits and blessings
- Connecting to the lineage of teachers and fighters who came before
- Sealing the ring — walking the four corners to "claim" the space

### 2. Paying Respect
- To your *kru* (teacher) and *ajarn* (master)
- To the gym that trained you
- To your parents and family
- To the sport itself and all who have fought before you

### 3. Physical Warm-Up
- Loosening the joints and muscles
- Getting the body moving in all planes
- Elevating heart rate gradually
- Practicing balance and coordination

### 4. Mental Warfare
- Demonstrating confidence to your opponent
- Showing your gym''s style and lineage (experienced observers can identify the gym from the Ram Muay)
- Some fighters include movements that reference their fighting style — hinting at what is to come

## The Structure of Wai Kru Ram Muay

### Phase 1: Sealing the Ring (Walking the Corners)
The fighter walks to each corner of the ring, bowing and touching the top rope with their glove. This seals the ring as sacred space and pays respect in all four directions.

### Phase 2: Wai Kru (Three Bows)
The fighter kneels in the center of the ring, facing the direction of their birthplace or gym:
1. **First bow** — Respect to the Earth (touching forehead to canvas)
2. **Second bow** — Respect to the Teacher
3. **Third bow** — Respect to the Mother (in some traditions, to Buddha)

Some fighters perform the bows facing their corner where their trainer sits.

### Phase 3: Ram Muay (The Dance)
The dance itself varies by gym and region:

**Common Movements:**
- **The Bird** — Arms extend like wings, slow sweeping movements showing grace and reach
- **The Giant** — Powerful stomping movements, showing strength and intimidation
- **The Hunter** — Shooting an arrow, drawing a bow — precision and focus
- **The Warrior** — Mimicking combat movements in slow, deliberate form
- **The Prayer** — Hands together in *wai* position, circling and bowing

**Regional Variations:**
- **Southern style** (Muay Chaiya) — Defensive postures, low stances, tight movements
- **Northeastern style** (Isan) — More dramatic, sweeping movements, theatrical
- **Central style** — Balanced between grace and power
- **Each gym** adds its own signature movements that identify the fighter''s lineage

### Phase 4: Removing the Mongkol
After the Ram Muay, the fighter returns to their corner. The trainer recites a brief prayer and removes the mongkol. This is the final transition from ritual to combat.

## Learning Ram Muay

### Essential Principles
- **Slow, deliberate movement** — The Ram Muay is never rushed
- **Breathing coordination** — Deep, controlled breaths synchronize with each movement
- **Eye contact** — Some movements look down (respect), some look forward (confidence)
- **Floor awareness** — Many movements involve kneeling; know your spacing
- **Personal expression** — While structure is traditional, each fighter brings their own spirit

### Practice Guidance
- Learn from your gym''s trainer — the Ram Muay carries your gym''s lineage
- Practice daily in front of a mirror, ideally with Sarama music playing
- Film yourself and compare to traditional performances
- Start with the basic structure and add complexity over time
- Never rush through it — the Ram Muay rewards patience and presence

## The Ram Muay Assessment

For your Garuda certification, you must perform a complete Wai Kru Ram Muay:
1. Seal the ring (or training space) — walk all four sides
2. Perform the three bows
3. Perform a Ram Muay of at least 2 minutes
4. Demonstrate understanding of each movement''s meaning when asked

The assessor evaluates:
- Respect and sincerity (not performance quality)
- Correct structure and sequence
- Understanding of symbolism
- Personal connection to the movements
- Smooth, confident execution');

-- Quiz for Module 9
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-0901-0000-0000-000000000005',
   '33333333-0901-0000-0000-000000000005',
   'What is the purpose of "sealing the ring" during the Wai Kru?',
   'multiple_choice',
   '[{"id":"a","text":"To check the ropes for safety"},{"id":"b","text":"To warm up the legs by walking"},{"id":"c","text":"To claim the space as sacred and pay respect in all four directions"},{"id":"d","text":"To intimidate the opponent by showing dominance"}]',
   'c',
   'Sealing the ring involves walking to each corner, bowing and touching the top rope. This ritual claims the space as sacred and pays respect in all four directions before the Wai Kru and Ram Muay.',
   0),
  ('44444444-0902-0000-0000-000000000005',
   '33333333-0901-0000-0000-000000000005',
   'The Ram Muay should be performed as quickly as possible to avoid delaying the fight.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'The Ram Muay is never rushed. It uses slow, deliberate movements synchronized with deep breathing. The ritual rewards patience and presence — rushing it defeats its purpose as spiritual preparation and demonstrates disrespect.',
   1)
ON CONFLICT DO NOTHING;

-- ============================================
-- MODULE 10: Written Knowledge Assessment (History, Rules, Culture)
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-1001-0000-0000-000000000005',
   '11111111-0000-0000-0000-000000000005',
   '22222222-0010-0000-0000-000000000005',
   'Comprehensive Knowledge Review',
   'text', 0, FALSE, 25,
   '# Comprehensive Knowledge Review

## Preparing for the Written Assessment

The Garuda written assessment covers three areas: **History**, **Competition Rules**, and **Culture**. This lesson reviews the key knowledge areas. Study this material, but also read beyond it — the assessment may include questions that require deeper understanding.

## Part 1: History of Muay Thai

### Ancient Origins
- Muay Thai evolved from battlefield arts used by Siamese armies
- The oldest records date to the Sukhothai period (1238-1438)
- Warriors trained in *Krabi Krabong* (weapons) and *Muay Boran* (empty hands)
- Historical accounts describe fighters using all parts of the body as weapons — "the art of eight limbs"

### Key Historical Figures

**Nai Khanomtom** (1774)
- Considered the father of Muay Thai
- Captured by the Burmese, he defeated 10 consecutive Burmese fighters to win his freedom
- March 17 is celebrated as National Muay Thai Day in his honor
- His story, while possibly embellished, represents the spirit of Muay Thai: courage, skill, and heart

**King Naresuan the Great** (1555-1605)
- Military king who used Muay Thai in battle against the Burmese
- His reign saw Muay Thai become part of military training curriculum
- He is credited with elevating the art from folk practice to royal martial discipline

**King Prachao Sua (Tiger King)** (1662-1709)
- Would disguise himself as a commoner to fight in village festivals
- His reign saw the golden age of Muay Thai as entertainment
- He actively promoted competitions and patronized fighters

### Modernization Timeline
| Period | Development |
|--------|------------|
| Pre-1920s | Bare knuckle or rope bindings, no formal rules |
| 1921 | First permanent ring built at Suan Kulap College |
| 1929 | Introduction of boxing gloves, replacing rope bindings |
| 1930s | Weight divisions, timed rounds, and standardized rules adopted |
| 1945 | Rajadamnern Stadium opens |
| 1956 | Lumpinee Stadium opens |
| 2014 | Sports Authority of Thailand establishes unified scoring criteria |
| 2016+ | International expansion, ONE Championship, global recognition |

## Part 2: Competition Rules

### Scoring System (Rajadamnern/Lumpinee Standard)
- **5 rounds** of 3 minutes each, with 2-minute rest periods
- **10-point must system** — winner of each round gets 10, loser gets 9 (or less for knockdowns/dominance)
- **Round 1 and 2** are generally "feeling out" rounds — Thai judges often score these 10-10
- **Rounds 3, 4, 5** carry the most weight in scoring
- **Judges value**: clean technique, balance, damage effect, ring control

### Legal and Illegal Techniques
**Legal:**
- Punches, kicks, knees, and elbows to legal targets
- Clinch work including sweeps and throws
- Push kicks to the body

**Illegal:**
- Headbutts
- Strikes to the groin
- Strikes to the back of the head or spine
- Throwing an opponent out of the ring
- Biting or spitting
- Holding the ropes while attacking

### Weight Divisions
Standard Thai weight classes range from Mini Flyweight (105 lbs / 47.6 kg) to Super Heavyweight (209+ lbs / 95+ kg), with approximately 17 recognized divisions.

### Knockdown and Stoppage Rules
- **Knockdown**: Fighter touches the canvas with anything other than feet. 8-count mandatory.
- **Three knockdown rule**: Three knockdowns in a single round results in a TKO (varies by promotion)
- **Standing 8-count**: Referee can issue without a knockdown if a fighter appears unable to defend
- **Doctor stoppage**: Ring doctor can stop the fight for cuts or injuries

## Part 3: Culture and Traditions

### The Gym System
Traditional Thai gyms operate as extended families:
- Fighters often live at the gym from a young age
- The kru is a parental figure, not just a coach
- Gym name becomes part of the fighter''s identity (e.g., "Saenchai Sor Kingstar")
- Loyalty to the gym is paramount — switching gyms carries social stigma

### Gambling and Muay Thai
Gambling is deeply intertwined with stadium Muay Thai in Thailand:
- Crowds at Rajadamnern and Lumpinee are predominantly gamblers
- Odds shift round by round, creating dramatic atmosphere
- The gambling culture influences fighting style — fighters who are ahead on points may coast, while fighters behind must increase aggression
- Understanding this dynamic is important for understanding Thai fight strategy

### Music (Sarama)
Live music accompanies every stadium fight:
- **Pi Java** (oboe-like instrument) — leads the melody
- **Klong Khaek** (drums) — two drums played together, controlling tempo
- The music starts slow during the Wai Kru and accelerates as the fight intensifies
- Experienced fighters synchronize their rhythm with the music
- The music is not background — it is an active participant in the fight

### The Mongkol Ceremony
- Traditionally, a fighter receives their mongkol only after the kru deems them ready
- The ceremony marks a milestone — the fighter is now representing the gym
- Some gyms have mongkols that are decades old, passed between generations
- Losing a mongkol or having it fall during the Wai Kru is considered very bad luck

## Study Recommendations
- Watch full stadium fights from Rajadamnern or Lumpinee, not highlight reels
- Read "Muay Thai: The Art of Fighting" by Yod Ruerngsa
- Talk to Thai trainers about their personal experiences and gym histories
- Visit a Thai boxing museum if possible (National Museum of Royal Thai Boxing, Ayutthaya)');

-- Quiz for Module 10
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-1001-0000-0000-000000000005',
   '33333333-1001-0000-0000-000000000005',
   'Who is considered the father of Muay Thai and is honored on March 17, National Muay Thai Day?',
   'multiple_choice',
   '[{"id":"a","text":"King Naresuan the Great"},{"id":"b","text":"King Prachao Sua"},{"id":"c","text":"Nai Khanomtom"},{"id":"d","text":"Saenchai Sor Kingstar"}]',
   'c',
   'Nai Khanomtom is considered the father of Muay Thai. According to legend, he defeated 10 consecutive Burmese fighters in 1774 to win his freedom. March 17 is celebrated as National Muay Thai Day in his honor.',
   0),
  ('44444444-1002-0000-0000-000000000005',
   '33333333-1001-0000-0000-000000000005',
   'In traditional Thai stadium scoring, Rounds 1 and 2 carry the most weight with judges.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'In traditional Thai scoring, Rounds 1 and 2 are generally "feeling out" rounds that judges often score 10-10. Rounds 3, 4, and 5 carry the most weight in scoring, as fighters settle into their strategies and the action intensifies.',
   1)
ON CONFLICT DO NOTHING;

-- ============================================
-- MODULE 11: Comprehensive Physical Assessment
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-1101-0000-0000-000000000005',
   '11111111-0000-0000-0000-000000000005',
   '22222222-0011-0000-0000-000000000005',
   'The Physical Assessment — What to Expect',
   'text', 0, FALSE, 18,
   '# The Physical Assessment — What to Expect

## The Final Physical Test

The comprehensive physical assessment is the last hurdle before Garuda certification. It evaluates your **total physical capacity** as a Muay Thai practitioner — technique, power, endurance, and composure under fatigue.

This is not a fitness test. It is a demonstration that your body can perform at the highest level when it matters most.

## Assessment Components

### 1. Shadow Boxing (5 Rounds × 3 Minutes)
Full shadow boxing with all weapons, demonstrating:
- Variety of techniques — all 8 weapons used naturally
- Footwork and angles — not standing in one spot
- Defensive movement integrated between attacks
- Increasing intensity across rounds
- Clean technique even in round 5

### 2. Pad Work (5 Rounds × 3 Minutes)
Working with a skilled pad holder:
- Responding to called combinations accurately
- Power and speed maintained across rounds
- Defensive reactions between combinations (catching return fire)
- Smooth transitions between all ranges
- Demonstrating fight-like rhythm, not just hitting pads

### 3. Heavy Bag (3 Rounds × 3 Minutes)
Continuous work on the heavy bag:
- Power shots — kicks, knees, and elbows that move the bag
- Combination fluency — 5+ technique combinations
- Clinch entries and knee work on the bag
- No rest periods within rounds — continuous output
- Balance and stance maintained throughout

### 4. Technical Demonstration
Performed fresh, before fatigue sets in:
- **Kick demonstration**: Left and right round kicks (low, body, high), teep, side kick
- **Elbow demonstration**: Horizontal, uppercut, downward, spinning, slashing
- **Knee demonstration**: Straight, curved, flying, from clinch
- **Defensive demonstration**: Blocks, parries, catches, evasions, checks
- Assessor may request specific techniques or combinations on demand

### 5. Sparring Assessment (3 Rounds × 3 Minutes)
Controlled sparring with a skilled partner:
- Round 1: Light technical — showing control and technique selection
- Round 2: Medium contact — showing power management and defense
- Round 3: Hard contact — showing composure and fight IQ under pressure
- Assessor evaluates all criteria from Module 3 (Full Sparring Proficiency)

### 6. Clinch Assessment (2 Rounds × 3 Minutes)
Clinch-only work with a skilled partner:
- Demonstrating all five clinch positions
- Fluid transitions between positions
- Attacking from each position (knees, elbows, sweeps)
- Defending from disadvantaged positions
- Controlling pace and energy

## Physical Benchmarks

While specific numbers are less important than technique quality, assessors look for baseline physical capacity:

| Area | Expectation |
|------|-------------|
| Round kick power | Audible impact on pads at 18+ rounds of work |
| Knee strike | Sustained output in clinch for 2 full rounds |
| Cardio | Maintaining technique quality through all assessment components |
| Recovery | Returning to baseline breathing within 2 minutes between sections |
| Durability | Absorbing clean shots in sparring without losing composure |

## Preparation Timeline

Most candidates prepare over 4-6 weeks:

**Weeks 1-2**: Build cardio base — run, skip rope, extend training rounds
**Weeks 3-4**: Peak training — simulate assessment conditions in training sessions
**Week 5**: Taper — reduce volume, maintain intensity, focus on recovery
**Assessment day**: Arrive rested, hydrated, and mentally prepared

### Day-Of Checklist
- 8+ hours of sleep the night before
- Light meal 2-3 hours before (carbs + protein, nothing heavy)
- Arrive 30 minutes early to warm up at your own pace
- Bring: wraps, gloves (bag and sparring), shin guards, mouthguard, shorts, water
- Mental preparation: this is a demonstration, not a fight. Show what you can do.

## What Failure Looks Like

Candidates fail the physical assessment when:
- Technique degrades significantly under fatigue (wild swinging, dropped guard)
- They cannot maintain output for the required rounds
- Sparring reveals inability to handle pressure (panic, freezing, excessive aggression)
- Clinch work shows gaps in positional knowledge
- They lack variety — relying on only 2-3 techniques throughout

Failure is not permanent. Most assessors will identify specific areas for improvement and invite you to re-test after additional training.');

-- Quiz for Module 11
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-1101-0000-0000-000000000005',
   '33333333-1101-0000-0000-000000000005',
   'How many rounds of shadow boxing are included in the physical assessment?',
   'multiple_choice',
   '[{"id":"a","text":"3 rounds"},{"id":"b","text":"5 rounds"},{"id":"c","text":"2 rounds"},{"id":"d","text":"10 rounds"}]',
   'b',
   'The physical assessment includes 5 rounds of 3-minute shadow boxing. This extended duration tests variety of technique, footwork, defensive integration, and the ability to maintain clean technique even in round 5.',
   0),
  ('44444444-1102-0000-0000-000000000005',
   '33333333-1101-0000-0000-000000000005',
   'The physical assessment is primarily a fitness test measuring how many push-ups and sit-ups you can do.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'The physical assessment is not a fitness test. It is a demonstration of total physical capacity as a Muay Thai practitioner — technique, power, endurance, and composure under fatigue. It evaluates sport-specific performance, not general fitness metrics.',
   1)
ON CONFLICT DO NOTHING;

-- ============================================
-- MODULE 12: Final Assessment
-- ============================================

INSERT INTO lessons (id, course_id, module_id, title, content_type, lesson_order, is_preview, estimated_minutes, text_content) VALUES
  ('33333333-1201-0000-0000-000000000005',
   '11111111-0000-0000-0000-000000000005',
   '22222222-0012-0000-0000-000000000005',
   'Garuda Final Review',
   'text', 0, FALSE, 15,
   '# Garuda Final Review

## The Journey Complete

You have studied all 10 Garuda competencies:

1. **Elite Speed & Precision Striking** — Speed creates power. Initiation, execution, and recovery speed. Precision under fatigue.
2. **Full Sparring Proficiency** — Composure, strategy adaptation, defensive responsibility, and technical variety across all formats.
3. **Advanced Clinch Mastery** — All five positions, fluid transitions, offense and defense from every angle.
4. **Teaching Demonstration** — Planning drills, clear communication, adapting to students, and leading with safety.
5. **Spiritual & Cultural Connection** — Buddhism, animism, the mongkol, pra jiad, and cultural respect.
6. **Muay Boran Technique** — Mae Mai and Look Mai, regional styles, and the connection to modern Muay Thai.
7. **Mentorship** — Teaching a complete beginner their first stance, jab, cross, and teep with patience and skill.
8. **Ram Muay Performance** — The Wai Kru, sealing the ring, the three bows, and the dance with understanding and sincerity.
9. **Written Knowledge** — History from Nai Khanomtom to the modern era, competition rules, and cultural traditions.
10. **Physical Assessment** — Shadow boxing, pads, bag work, technical demonstration, sparring, and clinch under assessment conditions.

## What Garuda Means

Garuda certification is not an endpoint. It is a declaration that you will:

- **Protect the art** — By practicing with integrity and respect
- **Teach the art** — By sharing knowledge with the next generation
- **Honor the culture** — By understanding and respecting the traditions
- **Continue learning** — By recognizing that mastery is a lifelong pursuit
- **Represent Muay Thai** — In your behavior, your teaching, and your character

## The Final Knowledge Quiz

The following quiz covers all 10 modules. You need to demonstrate comprehensive understanding across every competency area.

Take your time. Read each question carefully. This is the last step before your in-person Garuda assessment.

## After the Quiz

Once you pass the final quiz:
1. **Schedule your in-person assessment** with a gym owner or admin
2. **Prepare your Ram Muay** — practice daily
3. **Review all previous levels** — the assessor may test anything from Naga through Garuda
4. **Arrange a mentorship session** — find a beginner to coach before your assessment
5. **Rest and recover** — arrive at your assessment fresh and confident

The Garuda waits for those who are ready. You have done the work. Trust your training.');

-- Final Assessment Quiz — 10 comprehensive questions
INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, options, correct_answer, explanation, question_order) VALUES
  ('44444444-1201-0000-0000-000000000005',
   '33333333-1201-0000-0000-000000000005',
   'Which type of speed can be improved by eliminating telegraphing and staying relaxed?',
   'multiple_choice',
   '[{"id":"a","text":"Recovery speed"},{"id":"b","text":"Execution speed"},{"id":"c","text":"Initiation speed"},{"id":"d","text":"Footwork speed"}]',
   'c',
   'Initiation speed — how quickly you begin a technique from neutral — depends on relaxation (tense muscles are slow muscles) and minimal telegraphing (eliminating wasted movement that signals your intention).',
   0),
  ('44444444-1202-0000-0000-000000000005',
   '33333333-1201-0000-0000-000000000005',
   'In sparring, a Garuda-level practitioner should always match their intensity to their partner''s level.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'true',
   'The golden rule of sparring is to match your partner. Adjust intensity to create the most productive session for both people — never bully a less experienced partner, never back down from a more experienced one.',
   1),
  ('44444444-1203-0000-0000-000000000005',
   '33333333-1201-0000-0000-000000000005',
   'What is the plum position in Muay Thai clinch work?',
   'multiple_choice',
   '[{"id":"a","text":"Both hands controlling the opponent''s arms"},{"id":"b","text":"One hand behind the head, one free"},{"id":"c","text":"Both hands behind the opponent''s head (double collar tie)"},{"id":"d","text":"Hip-to-hip body lock with underhooks"}]',
   'c',
   'The plum position (double collar tie) involves both hands behind the opponent''s head. It is the dominant clinch position, offering control over posture and vision, with straight and curved knees as primary weapons.',
   2),
  ('44444444-1204-0000-0000-000000000005',
   '33333333-1201-0000-0000-000000000005',
   'When teaching, you should explain a technique verbally for several minutes before demonstrating it.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'The principle is demonstrate first, explain second. Students learn best by watching. Show the complete technique at full speed first, then break it down. Long verbal explanations before any demonstration reduce engagement and retention.',
   3),
  ('44444444-1205-0000-0000-000000000005',
   '33333333-1201-0000-0000-000000000005',
   'What is the mongkol and who traditionally removes it before the fight?',
   'multiple_choice',
   '[{"id":"a","text":"An armband removed by the fighter themselves"},{"id":"b","text":"A sacred headband removed by the trainer after the Wai Kru Ram Muay"},{"id":"c","text":"A belt ranking removed by the referee"},{"id":"d","text":"A protective amulet removed by a monk"}]',
   'b',
   'The mongkol is a sacred headband believed to carry protective spiritual power. It is traditionally given by the gym master and removed by the trainer after the Wai Kru Ram Muay, just before the fight begins.',
   4),
  ('44444444-1206-0000-0000-000000000005',
   '33333333-1201-0000-0000-000000000005',
   'Muay Boran''s Mae Mai consists of 15 master techniques.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'true',
   'The Mae Mai (master techniques) consists of 15 foundational techniques. Combined with the 15 Look Mai (complementary techniques), they form the 30 core techniques of Muay Boran.',
   5),
  ('44444444-1207-0000-0000-000000000005',
   '33333333-1201-0000-0000-000000000005',
   'When mentoring a complete beginner, what should you focus on in the first 5 minutes?',
   'multiple_choice',
   '[{"id":"a","text":"Teaching the jab immediately to make good use of time"},{"id":"b","text":"Having them watch a professional fight for inspiration"},{"id":"c","text":"Building trust — introductions, asking about injuries, setting expectations"},{"id":"d","text":"Testing their fitness level with push-ups and sit-ups"}]',
   'c',
   'The first 5 minutes should build trust: introduce yourself, ask about experience and injuries, explain what you''ll cover, and demonstrate that training is safe and controlled. This foundation enables effective learning throughout the session.',
   6),
  ('44444444-1208-0000-0000-000000000005',
   '33333333-1201-0000-0000-000000000005',
   'During the Wai Kru Ram Muay, the fighter seals the ring by walking to each corner. This is purely for physical warm-up purposes.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'Sealing the ring is a spiritual ritual — the fighter walks to each corner, bowing and touching the top rope to claim the space as sacred and pay respect in all four directions. While it does serve as a physical warm-up, its primary purpose is spiritual.',
   7),
  ('44444444-1209-0000-0000-000000000005',
   '33333333-1201-0000-0000-000000000005',
   'Who is considered the father of Muay Thai?',
   'multiple_choice',
   '[{"id":"a","text":"King Prachao Sua"},{"id":"b","text":"King Naresuan the Great"},{"id":"c","text":"Nai Khanomtom"},{"id":"d","text":"Buakaw Banchamek"}]',
   'c',
   'Nai Khanomtom is considered the father of Muay Thai. In 1774, he reportedly defeated 10 consecutive Burmese fighters while captive, winning his freedom. March 17 is celebrated as National Muay Thai Day in his honor.',
   8),
  ('44444444-1210-0000-0000-000000000005',
   '33333333-1201-0000-0000-000000000005',
   'The Garuda physical assessment is primarily a general fitness test focused on push-ups, sit-ups, and running.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   'false',
   'The physical assessment evaluates total capacity as a Muay Thai practitioner — technique, power, endurance, and composure under fatigue through sport-specific tests: shadow boxing, pad work, heavy bag, technical demonstration, sparring, and clinch work.',
   9)
ON CONFLICT DO NOTHING;
