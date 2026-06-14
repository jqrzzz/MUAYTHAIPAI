# MUAYTHAIPAI / OckOck — contributor & agent guide

Orientation for anyone (human or AI) working in this repo. Read this first.

## What this is

One product, two faces:

- **OckOck** — the software a Muay Thai gym runs on: bookings, students,
  trainers, certifications, an AI receptionist, courses, a public gym page.
- **MUAYTHAIPAI** — the network those gyms join: the portable Naga→Garuda
  certification ladder, a fighter/promoter + ticketing layer, and the operator
  console that runs it all.

Built alongside the Wisarut Family Gym in Pai, Thailand. The business model is
**pure SaaS** — ฿999/mo per gym, **0% commission on bookings** (see "Money").

## Stack

- **Next.js 14** (App Router) · React 18 · TypeScript (strict).
- **Supabase** (Postgres + Auth + RLS) via `@supabase/ssr`.
- **Stripe** (Checkout Sessions + a single webhook router).
- **AI** via the Vercel AI SDK → **OpenAI gpt-4o-mini** (`lib/ai-models.ts`).
- **Resend** for email. Tailwind + Radix/shadcn UI.

## Layout

```
app/                 routes (221 API routes, 68 pages)
  admin/             GYM admin console (one big client.tsx + tabs)
  platform-admin/    OPERATOR console (network-wide) + boardroom deck
  ockock/            OckOck product surfaces (promoter, fights, marketing)
  api/               route handlers
  (public marketing: /, /gyms/[slug], /enroll, /courses, /verify/[cert], …)
  student/ trainer/  student + trainer portals
components/           173 components; admin/ and platform-admin/ mirror the tabs
lib/                  70 modules — the real logic lives here
  supabase/          server.ts (RLS client), client.ts (browser)
  chat/              the AI concierge: engine, knowledge, adapters, ai/
  ockock/            product facts (product.ts) — single source for pricing
  certification-levels.ts   the Naga→Garuda ladder (code-defined)
scripts/             FROZEN SQL history (see docs/MIGRATIONS.md)
supabase/migrations/ NEW migrations go here (CLI)
```

## Auth & data access — the most important conventions

Three client types. **Pick the right one — it's a security boundary:**

1. **`createClient()` from `lib/supabase/server`** — anon/cookie client, **RLS
   enforced**. Default for anything acting as the logged-in user.
2. **`createServiceClient()` from `lib/supabase/service`** — the service-role
   client, **bypasses RLS**. Use only when you genuinely need cross-tenant or
   unauthenticated admin access (webhooks, the public chat loading any gym's KB,
   cron, operator queries). It's the single audited chokepoint — never construct
   a service client by hand with `SUPABASE_SERVICE_ROLE_KEY`. (The
   `serviceRoleClient()` wrapper in `lib/supabase/service-role.ts` is the same
   client with operator-specific guidance attached.)
3. **Browser client** (`lib/supabase/client`) — client components.

Auth helpers (`lib/auth-helpers.ts`):
- **`requireGymAdmin()`** → `{ ok, supabase, orgId }` — gym owner/admin, scoped
  to their org. Returns `{ ok:false, error, status }` on failure.
- **`getPlatformAdmin()`** → `{ user, isPlatformAdmin, role }`. `role` is
  `"full" | "partner"` — **partners see everything except money/billing**.

**RLS is on every table.** New tables MUST `ENABLE ROW LEVEL SECURITY` + add
policies. A table with RLS off is exposed to every authenticated user.

Cross-cutting: `logAudit()` (`lib/audit-log`) for sensitive operator actions;
`checkLimit()` (`lib/rate-limit`) for public/abusable routes.

## The consoles

- **Gym admin** (`/admin`): today, students, trainers, certificates, courses,
  time-slots, packages, services, payments, payouts, retention, marketing,
  social, website, inbox, channels, **ockock** (chat) + **train-ockock** (voice
  + FAQs), settings, profile.
- **Operator** (`/platform-admin`): network, gyms, students, trainers,
  customers, team, campaigns, adoption, bookings, subscriptions, payouts,
  finance, support, audit, curriculum, certificates (registry), command bar,
  OckOck assistant, boardroom + partner deck.

## The cert system (the moat)

- Five levels Naga→Garuda in `lib/certification-levels.ts` (code-defined:
  name, price, icon, Tailwind gradient, `skills[]`).
- **Skill sign-offs are keyed by integer `skill_index`** (position in the
  level's skill list). This is load-bearing: **never reorder/remove skills** —
  it would misalign every historical sign-off. Skill *text* is DB-editable
  (`cert_level_skills`, reword-only) via the operator Curriculum tab; readers use
  `lib/cert-skills.ts` (DB + code fallback).
- Tables: `skill_signoffs`, `certificates`, `certification_enrollments`.
  Public verification at `/verify/[certNumber]`.

## Money (pure SaaS, 0% on bookings)

- **`PLATFORM_BOOKING_COMMISSION_RATE = 0`** in `lib/ockock/product.ts` is the
  single source of truth. The Stripe webhook stamps it on every booking.
- Everything priced charges online via **Stripe Checkout Sessions** routed by a
  `metadata.kind` in **one webhook** (`app/api/webhooks/stripe/route.ts`):
  `ticket`, `cert_enrollment`, `course_enrollment`, + the classic booking path.
  The webhook is the **source of truth** for "paid" (idempotent; tolerates
  retries and a slow redirect).
- Bookings are **USD**; cert/course enrollments are **THB**. Finance/payouts
  bucket the two separately — they don't sum.

## The AI concierge

- Public chat widget on gym pages → `app/api/public/chat` → `runConciergeAI`
  (`lib/chat/ai/concierge.ts`). Bilingual (Thai-first), grounded in **that
  gym's** services/schedule/FAQs/trainers (`lib/chat/knowledge.ts`) + a per-gym
  **persona** (`gym_ai_persona`, set in Train OckOck).
- Channels with real adapters/webhooks: **LINE, WhatsApp, Telegram, web**.
  Instagram/Facebook are *not* built (shown as "coming soon").
- Owner-approval flow for DM replies; nothing auto-sends except the web widget.
- `product.ts` is the single source of pricing/feature facts the landing chat
  may state — keep it accurate, the deck + marketing read from it.

## Build, types, CI

- **Package manager is pnpm** (`pnpm-lock.yaml` committed; `node_modules` uses
  the `.pnpm` layout, so plain `npm install` will fail — use `pnpm install`).
- **`npx tsc --noEmit` must be green.** `next.config.mjs` no longer sets
  `ignoreBuildErrors` (it was masking 190 errors). CI (`.github/workflows/ci.yml`)
  runs tsc + tests + build on every PR.
- **Tests:** Vitest unit tests over the pure logic in `lib/` (money math, cert
  ladder, concierge prompt rendering) — `pnpm test`, blocking in CI. Tests live
  next to their module (`lib/foo.test.ts`). No integration/E2E yet.
- **Lint** is wired (`.eslintrc.json`) but non-blocking — `@typescript-eslint`
  isn't installed yet, so its `eslint-disable` directives don't resolve.
- The Supabase clients are **untyped**, hence ~150 `as any` casts. Generating
  DB types (`supabase gen types`) is the planned fix (needs the migration
  baseline first).

## Working in this repo

- **Verify with `npx tsc --noEmit` and `pnpm test`** before every commit. A full `npx next build`
  (dummy env is fine) additionally catches Next route-contract errors tsc misses
  — route files may only export handlers (`GET`/`POST`/…) + config, never
  arbitrary values.
- Match surrounding style. Keep money/auth/webhook code careful and idempotent —
  it's the most important code here.
- **Schema changes** go through `supabase/migrations/` — see
  [`docs/MIGRATIONS.md`](docs/MIGRATIONS.md). `scripts/` is frozen history that
  several admin screens still reference by name; don't move it.
- Big files to know (and to avoid growing): `app/ockock/promoter/events/
  editor-client.tsx` (~4k LOC), `app/trainer/client.tsx`, `app/platform-admin/
  client.tsx`, `lib/email-service.ts`.
