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
