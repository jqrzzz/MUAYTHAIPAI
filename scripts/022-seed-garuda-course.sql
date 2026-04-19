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
