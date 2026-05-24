# Courses ↔ Certification — Strategy (item 1.7)

**Source:** Owner priority (1.7) + a grounded audit of the live code & database (2026-05-24).
**Status:** Strategy / decisions — **no code changes.** Decisions here unblock 1.3 (Kids / Muay Thai for All) and 1.6 (Certifications).

---

## The big finding: it's built, scaffolded, and empty

The online-course and certification systems are **fully built** — this is not a "build a platform" problem, it's a **content + positioning** problem.

What exists today (verified in code + DB):
- **5 published courses that map 1:1 to the 5 certification levels** — Naga, Phayra Nak, Singha, Hanuman, Garuda (beginner → master), all `category=certification`.
- **51 modules and 95 lessons** already scaffolded across them.
- A working **lesson player** (video / text / drill / quiz content types), **progress tracking** (`lesson_progress`, resume position, quiz scoring), and a **paywall** (free vs paid → Stripe).
- A solid **certification system**: trainer-issued, skills-gated, level-progression-enforced, with a **public verification page** (QR, shareable, SEO/Schema.org).
- A **one-way bridge already wired**: completing a course with a `certificate_level` auto-creates a `certification_enrollments` record and notifies the gym ("ready for cert?").

What's missing (the actual gaps):
- **Content:** `0` of 95 lessons have a video. The shells (titles/structure) exist; the teaching content does not. This is the "missing a lot of content."
- **Pricing is broken:** every course is `is_free=false` but `price_thb=0`. No real pricing decision has been made.
- **Usage:** 1 enrollment, 0 lesson-progress rows, 0 certificates issued. Effectively unused.
- **No badges / lightweight online recognition.**
- **Positioning:** nothing on the site explains what the courses *are* or how online + in-person fit together.

---

## Recommended model: "Study online, prove it in person"

A two-part credential that plays to the gym's real advantage (authentic in-person Muay Thai) while capturing online revenue:

1. **Online course = the knowledge half.** Theory, technique breakdowns, drills, quizzes for each level. Anyone, anywhere can do it.
2. **In-person at the gym = the skills half.** Trainers sign off the physical skills (already enforced today).
3. **Certificate = both halves.** Online completion makes a student "cert-ready" (the bridge already does this); the trainer issues the verified certificate after in-person signoff.

This keeps the certificate **valuable and authentic** (can't be fully bought online), while the courses **stand alone as paid education** for people who may never visit.

### Answers to your five key questions
1. **Only educational?** No — they're the study half of certification *and* standalone education.
2. **Connected to cert levels?** Already 1:1. Lean all the way in (the course *is* the level's study track).
3. **Recognition / badges / progress?** Progress: already tracked. Recognition: the completion→cert-enrollment bridge exists. Badges: **recommended to add** — a lightweight "completed the Naga course online" badge, clearly *distinct* from the in-person-verified certificate.
4. **Audience — tourists / serious / remote?** All three, tiered:
   - **Tourists / curious:** a free taster (e.g., Naga module 1) → funnels to a Train & Stay trip.
   - **Remote learners:** buy the full level course; earn online badges; option to come earn the real cert later.
   - **Serious / in-gym students:** the course is their study companion before/after sessions.
5. **Long-term gym support?** Revenue decoupled from physical capacity (sell worldwide), a top-of-funnel that converts to trips + certification, content ownership/authority on the MTP brand (Kru Wisarut's lineage), and retention between visits.

---

## What's actually needed (prioritized — mostly not code)

1. **Content (the gating work, owner-led):** record lesson videos + write text/drills/quizzes. Suggest starting with **Naga (Level 1)** end-to-end as the template, then repeat. I can generate a per-lesson content outline/script template from the existing 95-lesson scaffold to make filming turnkey.
2. **Pricing decision (small code):** fix `is_free`/`price_thb`. Proposal: **Naga course free** (funnel) or first-module-free, **Levels 2–5 paid**. Needs your numbers.
3. **Positioning copy (small code):** add "how it works — study online, certify in person" to the Courses and Certifications pages (1.6 already got a starter explainer that references courses).
4. **Optional connective features (small code):** online completion **badges**; tighten the completion→"cert-ready" messaging; surface "earns the X certificate" on each course.

The point: a few small code changes + **content** turns an unused, empty-but-complete system into a real product. No platform build required.

---

## Decisions I need from you
- **A. Model:** confirm "study online + prove in person = certificate." Or do you also want a **fully-online credential** for people who will never visit (more reach/revenue, but dilutes the in-person value)?
- **B. Pricing/tiers:** which levels are free vs paid, and the prices? (Today everything is ฿0.)
- **C. Badges:** add lightweight online-completion badges, separate from the formal certificate? (Recommended: yes.)
- **D. Content:** who films/writes the lessons, and do you want me to produce a per-level content outline/script template to make it turnkey? Which level first (suggest Naga)?
- **E. Kids / "Muay Thai for All" (ties to 1.3):** should that program get its own lightweight course + recognition track in this same system, or stay separate?
