# Database performance — advisor backlog

A read of the live Supabase **performance advisors** (2026-06-10) scoped to the
MUAYTHAIPAI/OckOck tables. The database is shared with other apps, so the raw
advisor output (1,555 findings) is mostly noise from elsewhere; this doc keeps
only what's ours and says what to do about each.

> **Scale caveat.** As of this writing the network has 2 orgs and ~176
> bookings. Most of these findings have **near-zero impact today** — they
> matter at scale. They're captured here so they're not lost, prioritized by
> when they start to bite, not done speculatively now.

## Done now — `supabase/migrations/20260610000005_index_core_foreign_keys.sql`

**Unindexed foreign keys** on the core, growth-bound tables (28 of them:
bookings, certificates, skill_signoffs, credit_transactions, payouts,
support, …). This is the one class worth doing pre-traffic because:

- it's **strictly safe** — an index never changes query results, only speed;
- unindexed FKs make **cascade deletes seq-scan** the child table (deleting an
  org touches every child), and the app does many "by parent" lookups;
- it's cheap insurance that gets more disruptive to add later.

The advisor flagged ~135 unindexed FKs across the whole DB; we indexed only the
core tables. The rest are on empty/peripheral tables where an index is just
write-overhead until they're used.

## Deferred — do as dedicated, *verified* passes when there's traffic

These are real but premature, and the impactful ones are **security-critical
bulk rewrites** that should not be done blind (the MCP connection that surfaced
them is read-only — they can't be verified against the DB from here).

### 1. `auth_rls_initplan` — ~103 policies on our tables  ·  HIGH value at scale
Policies call `auth.uid()` / `auth.role()` directly, so Postgres re-evaluates
the function **per row**. Wrapping the call so it's evaluated **once per
statement** is the canonical Supabase fix and is semantically identical:

```sql
-- before:  USING (user_id = auth.uid())
-- after:   USING (user_id = (select auth.uid()))
```

Why deferred: ~100 policies across ~48 tables, each a `DROP`/`CREATE POLICY`
that must reproduce the existing logic exactly (roles, `USING`, `WITH CHECK`).
A subtle reproduction error is a data-exposure bug. Do it as **one focused PR**
with the policy bodies generated from `pg_policies`, reviewed, and applied with
write access so the advisors can confirm the finding clears.

### 2. `multiple_permissive_policies` — ~545 on our tables  ·  MED value
Multiple *permissive* policies for the same `{role, action}` are OR-ed, so
Postgres evaluates **all** of them on every access. Consolidating into one
policy per `{role, action}` cuts that. Unlike #1 this is **not** mechanical —
it changes which predicates exist, so each consolidation needs a deliberate
access-equivalence check. Audit per-table; don't batch.

### 3. `unused_index` — ~101 on our tables  ·  LOW value, do NOT act yet
The advisor marks indexes with zero scans as unused — but on a near-idle DB
**everything** looks unused. Dropping based on these stats now would remove
indexes that real traffic will need. Re-evaluate only after sustained
production load, and even then keep anything backing a unique/PK constraint.

### 4. `duplicate_index` — 1 on our tables  ·  LOW value
One redundant index pair. Drop the duplicate opportunistically; trivial.

## How to refresh this

```bash
# via the Supabase MCP (read-only is fine for advisors):
#   get_advisors(type: "performance")  /  get_advisors(type: "security")
# or the dashboard: Advisors → Performance / Security
```
Re-run after applying the deferred passes so each cleared finding is confirmed.
