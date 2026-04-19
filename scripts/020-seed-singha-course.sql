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
