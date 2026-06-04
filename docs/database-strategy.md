# Decision record: shared database, for now

**Status:** ACCEPTED — active decision (revisit at the trigger below)
**Date:** 2026-06-04
**Related:** `docs/mtp-ockock-separation-decision.md`, `docs/ockock-multi-tenant-readiness.md`

## Decision (one line)

**Keep all apps on the one shared Supabase project for now; give OckOck its own
project the day it signs its first _paying_ external gym.** Split on that trigger,
not on a calendar.

## What's actually shared

One Supabase project (`mdamwgtdtrvvnskqdoon`) hosts several of our apps:

- **MTP / OckOck** — the `public` schema (bookings, organizations, gym_*, etc.).
- **Scoot** — its own `scoot` schema (the *good* kind of sharing).
- **Northcrest, shop, rides, SOSCOMMAND (`sc_*`), factory…** — tables dumped into
  `public` alongside ours (the *messy* kind; `social_posts` literally exists in
  both `public` and `scoot`).

One project ⇒ **one anon key, one service-role key, one `auth.users` table**,
shared by every app in it.

## Why this is the right call right now

- **Cost.** One Pro project (~$25/mo) instead of ~7 (~$175/mo) of mostly-idle DBs.
  Pre-revenue, that's the rational spend.
- **Load is trivial.** MTP has ~176 bookings total. A single instance is nowhere
  near stressed.
- **Reversible.** Splitting later is a known migration — easiest for schema-isolated
  apps (`pg_dump --schema=…` → restore into a new project).

## The risks, calibrated

| Risk | Now | Trajectory |
|---|---|---|
| **Availability (blast radius)** — one DB is one failure domain; a runaway query / locking migration / connection-limit hit in *any* app can take down *all*, including MTP payments. | **Low** (everything is pre-traction) | Grows with traffic |
| **Security (shared keys)** — isolation is RLS-only, and the shared service key means our payment data is **only as safe as the least-careful co-tenant app.** The advisor shows some co-tenants have open RLS (`scoot.social_posts`) / a security-definer view (`northcrest`). | **Real, watch it** — our own `public.*` tables are properly locked (verified 2026-06-04), so no open cross-read of our data today; but the shared key couples our risk to theirs | Constant until split |

The security coupling is the one to keep eyes on: **on a shared project your
security travels with your messiest neighbour.**

## The split trigger

> **OckOck signs its first paying external gym → OckOck moves to its own Supabase
> project.**

By then OckOck holds a paying customer's data, so a co-tenant bug becomes churn +
reputation, not just annoyance — and there's revenue to fund the ~$25/mo. Revenue
pays for separation. Clean story.

## Guardrails to keep meanwhile (no new spend)

1. **Service-role key = crown jewels.** Server-only, never in a client bundle, in
   *any* app. One leak exposes everything across all schemas.
2. **New apps get their own schema, never `public`.**
3. **Know the restore story.** One DB = one blast radius — confirm backups are on
   and point-in-time recovery is understood. That's the insurance.
4. **Co-tenant open RLS** (`scoot.social_posts`, the `northcrest` definer view) is
   partly our problem via the shared keys — close it in those apps' own codebases
   eventually. Not in this repo, not urgent.

## Note

This is the *database* dimension of the same theme as the MTP/OckOck separation
decision: today multiple distinct products share not just a codebase pattern but
one datastore. That's a bigger data-isolation surface than the tenant-purity audit
assumed — fine for a bootstrap, deliberately revisited at the trigger above.
