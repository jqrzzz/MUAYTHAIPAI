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
