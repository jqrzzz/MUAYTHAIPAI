# Decision record: separating the Muay Thai Pai site from OckOck

**Status:** PROPOSED — decision pending (do not act on this yet)
**Date:** 2026-06-04
**Context owner:** Juan
**Related:** `docs/brand-architecture.md`, `docs/ockock-multi-tenant-readiness.md`

This is a decision record, not an instruction. It captures *why* we'd split,
*what* a split actually costs, and the *options* — so the call can be made with
eyes open. Nothing in here has been built.

---

## 1. The question

> "Should the Muay Thai Pai site and OckOck be separated — without breaking the
> system that currently takes Muay Thai Pai's payments?"

The honest reframe, after reading the code: **they're already separated where it
counts (two domains, two brands, a clean routing boundary). The open question is
whether to also separate them *physically* — separate repos / deployments — and
the answer hinges on one thing the split can't change: there is only one database,
and it must stay that way.**

## 2. What we have today

One Next.js app, one repo, one Supabase project, one Stripe account, one Vercel
deployment — serving **two domains** via host-based routing in `middleware.ts`:

| | **muaythaipai.com** | **ockock.app** |
|---|---|---|
| Role | Pai gym site **+** the network/discovery portal | The SaaS product gyms pay for |
| Homepage | Bespoke Pai page (`app/client.tsx`) | Rewrites to `/for-gyms` |
| Routes | `/classes`, `/gym`, `/train-and-stay`, `/book`, `/certificate-programs` | `/admin`, `/signup`, `/onboarding`, `/pricing`, `/promoter`, `/fights` |
| Auth | none (redirects to ockock.app) | all auth lives here |
| Chrome | Pai marketing header/footer | `OckOckLayoutShell` |

The middleware already enforces a real brand boundary: OckOck paths hit on
muaythaipai.com 301 to ockock.app, and vice-versa. This part is well built —
see `docs/brand-architecture.md` for the conceptual three-way split (Pai gym
site / the MUAYTHAIPAI network / the OckOck product).

### The numbers (probed 2026-06-04)

| Metric | Value | So what |
|---|---|---|
| API routes (`app/api/**/route.ts`) | **218** | This is a backend, not a brochure |
| …touching the shared DB (service-role) | **125** | Deeply data-coupled |
| Shared `lib/` modules | 34 files + 8 subdirs | Stripe, email, auth, notifications, AI, discovery — all shared |
| Shared UI (`components/ui`) | 58 | One design system feeds both brands |
| Databases | **1** | Must stay 1 (see §3) |
| Cron jobs (`vercel.json`) | 7 | **All OckOck** (discovery, invites, digests, trial nudges, signals) |

## 3. The insight that decides everything

**"MTP vs OckOck" is not a boundary that exists in the data.** muaythaipai.com is
three concerns wearing one domain:

1. **Pai's bespoke gym site** — `/`, `/gym`, `/classes`, `/train-and-stay`
   (`app/client.tsx`). *Genuinely MTP-specific.*
2. **Pai's booking flow** — `/book` → `/api/bookings` → writes to the **same
   `bookings` table the OckOck `/admin` dashboard reads.** Pai-the-gym is
   **tenant #1 of the OckOck backend.** Its money path runs *through* the product.
3. **The network discovery portal** — `/gyms`, `/gyms/[slug]` renders **any gym
   in the network** from the shared DB. This is a **pure OckOck product feature**
   that lives on the muaythaipai.com domain *by design* (the network is what
   OckOck sells gyms a listing on).

Because the network portal must read every gym, and Pai's bookings live in the
shared tenant tables, **the database cannot be split.** Therefore any "split"
really means: *split the frontends; someone still owns the one shared backend
and DB.* That ownership question is the whole decision.

## 4. The three honest options

### Option A — Monorepo: two apps, shared core *(this is what "full split" really is)*

```
apps/mtp        → muaythaipai.com (bespoke Pai pages)
apps/ockock     → ockock.app + the network portal + all 218 routes + crons + webhooks
packages/core   → supabase, stripe, email, env, types
packages/ui     → the 58 shared components
```

- **Gain:** two independently-built frontends; a clean mental model; lint can stop
  cross-brand imports.
- **Cost:** **high** — extract 34 lib modules + 58 components, decide where 218
  routes live, rewire every import. Realistically **2–4 focused weeks.**
- **Payment risk:** **medium** — you relocate the booking API + Stripe webhook.
- **Note:** one DB still shared; the portal-on-MTP-domain seam still exists (§5).

### Option B — Two separate repos talking over HTTP *(the trap — avoid)*

MTP repo = static-ish site calling OckOck's public API; OckOck repo = everything
else.

- **Cost:** **very high** — you now version a public API contract, CORS,
  cross-origin auth; the booking flow crosses a network hop.
- **Payment risk:** **high.** For a solo operator this is building a distributed
  system to solve a tidiness problem. **Recommended against.**

### Option C — One repo, *hardened* code-level boundary *(cheapest clarity)*

Keep the single deploy + DB. Formalize what `middleware.ts` already implies:
top-level `mtp/`, `ockock/`, and a shared `core/`, with **lint rules that forbid
MTP code importing OckOck product code and vice-versa.**

- **Gain:** ~80% of the *clarity* of a split; nothing leaks across; you can finally
  see the seams.
- **Cost:** **low** — days.
- **Payment risk:** **near zero** — no deploy or DB change.
- **Bonus:** this is literally Phase 0–1 of Option A, so it's never wasted.

## 5. If we pick A — the phased migration plan

Sequenced so the money path is protected first and nothing goes dark.

- **Phase 0 — Freeze & fence the money (do regardless of option).**
  End-to-end smoke test of booking → Stripe → webhook → DB → email against a test
  PaymentIntent, plus a one-page "do not disturb" note on that flow. Any later
  phase that breaks it then fails loudly.
- **Phase 1 — Carve `packages/core` + `packages/ui`.**
  Move `lib/supabase`, `lib/stripe*`, `lib/email-service`, `lib/notifications`,
  `lib/env`, shared types, and `components/ui` into packages. *No behavior change* —
  imports only. Ship on the current single deploy; confirm green.
- **Phase 2 — Stand up `apps/ockock`.**
  Owns the backend: all 218 routes, 7 crons, Stripe + channel webhooks, the
  dashboards, **and the network portal (`/gyms`)**. ockock.app points here.
- **Phase 3 — Stand up `apps/mtp`.**
  Just the bespoke Pai pages. Its booking form calls `core`. muaythaipai.com points
  here — **but `/gyms` must still be served to muaythaipai.com from the OckOck app**
  (rewrite/proxy), because it's product living on the gym domain. *This is the seam
  B can't solve and A papers over.*
- **Phase 4 — Cut over & clean up.**
  Flip DNS, remove the middleware host-juggling, retire dead routes.

**What A gains:** independent frontends + a clean model.
**What A does NOT gain:** independence from the shared DB; freedom from the
portal-on-MTP-domain seam. Those are inherent to the network *being* the product.

## 6. Recommendation

**Do Option C now; keep Option A as this documented, ready-to-execute plan.**

Reasoning: the confusion driving this isn't structural — it's **scope sprawl**
(OckOck currently spans bookings, a cert ladder, course authoring, fight-event
promotion + ticketing, social posting, an omnichannel inbox, an AI receptionist,
a gym-website builder, and payouts — ~9 products in one trench coat). A physical
split does **not** fix that; it spreads it across two repos. C buys the clarity in
days with no payment risk, and is the first two phases of A anyway — so committing
to C costs nothing if we later go all the way to A.

The highest-value work after C is almost certainly a **scope keep/park/cut pass on
OckOck**, not plumbing.

## 7. Decision

**OPEN.** Options on the table:

- [ ] **C now, A documented** (recommended)
- [ ] **Commit to full split A** (start at Phase 0)
- [ ] **Scope cut first** (inventory OckOck, keep/park/cut, before any split)

---

## Appendix — raw probe (2026-06-04, on `claude/setup-dual-brand-nextjs-PGtyG`)

- `find app/api -name route.ts | wc -l` → **218**
- routes referencing `SUPABASE_SERVICE_ROLE_KEY`/`createClient` → **125**
- `lib/` top-level modules → 34 files; subdirs: `supabase`, `stripe`(via files),
  `ockock`, `chat`, `courses`, `platform-admin`, `campaigns`, `discovery`
- `components/ui` → **58** components
- `vercel.json` crons → 7 (all OckOck product jobs)
- muaythaipai.com root routes incl. `/gyms` (network portal) + `/gym` (Pai's own)
- `app/api/bookings/route.ts` is the shared write path used by both the Pai public
  booking form and the owner dashboard's "New Booking" dialog
  (`app/trainer/client.tsx`).
