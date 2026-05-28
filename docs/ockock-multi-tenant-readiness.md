# OckOck Multi-Tenant Readiness Audit

**Source:** Four parallel deep audits (signup/onboarding, tenant isolation + leakage, platform-admin/super-admin, OckOck product site).
**Status:** Read-only assessment — **no code changes**. Saved as a planning artifact like the prior audits.
**Date:** 2026-05-25.

---

## One-line verdict

**OckOck is NOT multi-tenant ready today.** The foundations are genuinely good (B+) — RLS pattern, impersonation, the onboarding wizard, observability surfaces, the brand structure. But three systemic gaps make it unsafe to open to other gyms right now: **two open-door RLS / trigger bugs sitting in prod**, **a marketing site that promises self-serve billing the system literally cannot deliver**, and **the test gym (Muay Thai Pai) hardcoded into ~10 shared code paths**. None require a rebuild — they're a focused cleanup pass.

## Overall grade: **C−** (Foundation B+ / Experience D+)

| Area | Grade | One-line |
|---|---|---|
| Tenant isolation + MTP leakage | **D+** | Two BLOCKERs live in prod; 90% of tables are properly walled |
| Signup + onboarding | **D** | Wizard is great, signup endpoint missing `trial_ends_at` + no self-serve checkout |
| Platform-admin / super-admin | **C−** | Observability A−; sensitive actions C; one typo breaks the Mark-Paid flow |
| OckOck product site | **C−** | Vision page is A−; pricing advertises a self-serve plan that doesn't exist |

---

## Headline BLOCKERs (these are real bugs sitting in prod right now)

### 1. `social_posts` RLS policy is wide-open
A policy named `"Authenticated users can manage social posts"` is `qual=true, with_check=true, cmd=ALL, roles=authenticated`. **Any logged-in user from any gym can read AND modify any other gym's social posts** — drafts, scheduled, published. The other org-scoped policies are useless because Postgres OR-merges them. **Drop the policy.**

### 2. `make_wisarut_owner` trigger is a latent footgun
A trigger on `public.users` looks up `wisarut-family-gym` and auto-promotes a new user to *owner* if the owners table is empty. No-op today (you exist), but the moment that row is cleared (data wipe, owner re-key) the **very next signup from any gym silently becomes owner of MTP**. **Drop the trigger.**

### 3. `JSON.JSONStringify` typo breaks Mark-Paid
`app/platform-admin/client.tsx:285` — invalid method name. The catch swallows it, so the most important money action in platform-admin silently fails. One-character fix.

### 4. `/pricing` makes a promise the system can't keep
Advertises ฿999/mo with "Start free trial" → `components/admin/billing-card.tsx:71-93` shows trial gyms with no Stripe customer can't self-serve upgrade; they're routed to `mailto:hello@muaythaipai.com`. There is **no `/api/admin/subscriptions/checkout` endpoint** anywhere. Combined with: **`trial_ends_at` is never set at signup** (`app/api/signup/route.ts:159-163`), so the trial silently never expires and `TrialCountdownCard` shows `"NaN days left"`.

### 5. Pricing has three contradictory sources of truth
- `lib/ockock/product.ts:19` — ฿999/month
- `app/api/platform-admin/subscriptions/route.ts:57` — $29 USD/month
- `app/api/platform-admin/gyms/route.ts:41` — `price_thb: 999`
None of them used by the public signup, which writes `price_thb: 0`.

### 6. The global chat widget pretends every visitor is at MTP
`app/layout.tsx:287` mounts `<OckOckChatWidget orgSlug="wisarut-family-gym" />` *site-wide*. Visitors to ockock.app are chatting with the MTP concierge; a new gym's owner browsing OckOck's marketing is training MTP's chatbot. Should be host-conditional (render only on muaythaipai.com).

### 7. Seven+ public endpoints default `gymSlug` → `wisarut-family-gym`
Drop the param and you silently get MTP's data:
- `app/api/public/services/route.ts:13`, `trainers/route.ts:6`
- `app/book/client.tsx:11`, `app/enroll/client.tsx:33`
- `app/certificate-programs/client.tsx:175`, `app/fighters/client.tsx:35`
- `components/booking-section.tsx:56`
- `public/manifest.json` (PWA name)
- `lib/email-service.ts:13-17` (`DEFAULT_ORG` fallback in 5 templates)

### 8. `/api/public/courses` has no org filter at all
Returns every published course from every gym. Today benign (all 5 are MTP's); breaks the moment a second gym ships courses.

---

## Tiered cleanup plan (in order)

### Tier 0 — Safety: fix before another gym sees the platform

1. **Drop the open `social_posts` RLS policy.** One SQL line.
2. **Drop the `make_wisarut_owner` trigger + function.** One SQL line.
3. **Fix `JSON.JSONStringify` → `JSON.stringify`** in `app/platform-admin/client.tsx:285`. One char.
4. **Tighten `bookings` + `payments` anon INSERT** RLS — `WITH CHECK true` is too permissive.
5. **Make the global chat widget mount host-conditional** in `app/layout.tsx:287` (only on muaythaipai.com host).
6. **Eliminate the `wisarut-family-gym` defaults** in the 7+ shared client/API paths above. Require explicit `?gym=` and 400 if missing.
7. **Add `org_id` filter to `/api/public/courses`** — or document it as a network catalog if that's the intent.

### Tier 1 — Money: must work before charging anyone

8. **Set `trial_ends_at` (30 days), `monthly_price_usd_cents: 2900`, and a `plan` field at signup** in `app/api/signup/route.ts:159`. Largest functional gap in the whole audit — without it, the trial cron + admin countdown + master digest all silently skip new gyms.
9. **Build `/api/admin/subscriptions/checkout`** — mirror the platform-admin route but auth as the gym owner. Wire `TrialCountdownCard` CTA to it. Replace every `mailto:hello@muaythaipai.com` upgrade prompt.
10. **Consolidate pricing to one source of truth.** Decide ฿999 or $29, and have all three sites read from one constant.
11. **Fix the OckOck product site:**
    - `/pricing` H1 must say "Muay Thai gym" (cold-visitor rule fail).
    - Fix `BreadcrumbSchema` URLs on `/for-gyms` and `/pricing` — they hardcode `muaythaipai.com` (should be `ockock.app`).
    - Remove fabricated social proof (`for-gyms:322`, `vision:311` claim "most gyms" when N=1).
    - Add a named founder on `/about` + at least one product screenshot.

### Tier 2 — Operating: must work to run 5+ gyms

12. **Real subscription management in platform-admin:** cancel (via Stripe), change tier, comp/pause, with reason capture and audit log. Replace the binary toggle that bypasses Stripe.
13. **Booking-level refund:** "Refund" button → `stripe.refunds.create` → update `bookings.refunded_amount_cents` → audit-log.
14. **Audit log coverage to ≥90% of write endpoints.** Sub toggle, gym-create, blacklist-remove, curriculum edits. Lint rule: any `POST/PATCH/DELETE` under `/api/platform-admin/` must import `logAudit`.
15. **Impersonation cookie → `httpOnly: true`** + expose impersonation state via a `/api/me` endpoint instead of letting the banner read the cookie directly.
16. **Fix MRR mismatch** on Overview tab (`client.tsx:626`) — hardcoded `activeSubscriptions * 999` contradicts the Subscriptions tab. Read from `gym_subscriptions.monthly_price_usd_cents` like the subs tab does.
17. **Fix `gym_id` vs `gym.id`** copy-statement references in platform-admin client (lines 339, 895, 900) — the "Copied" badge currently never lights up.

### Tier 3 — Signup hardening

18. **Create `users` + `org_members` rows at signup** (not at invite-accept). Today a OAuth (LINE/Google) signup creates an orphaned auth user with no gym; they bounce off `/admin/login?error=no_access`.
19. **Either wire OAuth signup end-to-end OR remove `<SocialSignupButtons next="/admin" />`** from `/signup` (currently visually promising a flow that doesn't work).
20. **Add `organizations.onboarded_at`** flag. Today `/onboarding` and `/admin` ping-pong on `services.count > 0`, so an owner who deletes services to redo them gets force-redirected back to onboarding.
21. **Validate `gym_subscriptions.status` against an enum** in `/api/platform-admin/gyms/subscription/route.ts` — currently accepts any string.
22. **Slug collision UX** — let the owner pick their permanent URL instead of appending `-lt8h2k4`.
23. **Fix `/api/platform-admin/gyms/route.ts:62`** — falls back to a dev env var (`NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`) and a hardcoded `pai-muay-thai.vercel.app` for the invite host. Will email customers dead links.

### Tier 4 — Polish & doc hygiene

24. Misleading "Continue with WhatsApp" button on `/signup` — it's actually a sales `mailto:`, not signup. Rename or remove.
25. Update `docs/roles-and-access.md:83` — says `is_platform_admin` is "SQL, no UI" but the invite-accept route lets existing platform admins promote anyone.
26. Promote `/platform-admin/onboard` to a first-class flow on `/today` (a "New gym from sales call" button).
27. Clean up the duplicate `profiles` RLS policies referencing `ramos.is_firm_user()` (cross-product leak).
28. Tighten the boardroom-vs-operations split in `/platform-admin?full=1` — 16 tabs, 4 are graveyard.

---

## What is genuinely strong (don't touch)

- **The `/verify` credential page** (B+/A−): per-skill signoffs, QR, OG image, JSON-LD, revoked-state handling.
- **The printable study pack** — cover, TOC, drills, self-quiz with withheld answers. Genuinely close to professional.
- **The onboarding wizard** (`/onboarding/conversation`) — AI service-suggest, hours, cert ladder preview, channels. Solid wizard.
- **The impersonation system** — view-as picker, server-side re-verification, audit-logged start/stop.
- **Platform observability** — `/platform-admin/today`, `/finance` (NetworkAnalytics + StripeFinance + PlatformNet), `/api/platform-admin/health` (probes 14 deps). A-minus work.
- **The RLS pattern itself** — `has_org_role(org_id, [...])` consistently applied; ~30 tables properly walled.
- **The OckOck `/vision` page** — best-written marketing page on the site (A−).
- **The brand-architecture doc** — the three-layer model (OckOck product / MUAYTHAIPAI network / Muay Thai Pai gym) is clean and right.

---

## Bottom line

A focused **Tier 0 + Tier 1** pass (mostly small SQL fixes + one new Stripe-checkout endpoint + cleaning up the wisarut-default fallbacks) takes this from "demo with leaks" to "safe to invite a second gym and actually charge them." Tier 2 is the work that lets you scale past ~5 gyms without a Stripe Dashboard + Supabase SQL session per support ticket. None of it is a rebuild.
