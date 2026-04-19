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
