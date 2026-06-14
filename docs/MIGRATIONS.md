# Database migrations

## Why this doc exists

For the project's first stretch, schema changes were hand-written numbered SQL
files in [`scripts/`](../scripts) (`001-create-tables.sql` … `078-gym-ai-persona.sql`),
applied by pasting them into the Supabase SQL editor. There was **no record of
which files had actually run on which database**, and the live DB drifted from
the repo at least once — that's what `scripts/RUN-MISSING-MIGRATIONS.sql` exists
to patch up.

Going forward we use the **Supabase CLI** so that "what ran where" is tracked
automatically (in the `supabase_migrations.schema_migrations` table) and applied
deterministically in CI/locally.

> **`scripts/` is not going away.** Those files are the historical record, and
> several admin screens still point operators at specific ones (e.g. the
> Audit-log tab says "run `scripts/042-add-audit-log.sql`"). Treat `scripts/` as
> **frozen history**. All *new* schema work goes through `supabase/migrations/`.

---

## One-time setup (per machine)

```bash
# 1. Install nothing globally — the repo's npm scripts call `npx supabase`.
#    (Optional, for speed: npm i -D supabase)

# 2. Authenticate the CLI with your Supabase account.
npx supabase login

# 3. Link THIS repo to the hosted project (do this once; it writes the ref to
#    supabase/.temp, which is gitignored).
npx supabase link --project-ref <your-project-ref>
```

Find `<your-project-ref>` in the dashboard URL (`app.supabase.com/project/<ref>`)
or **Project Settings → General → Reference ID**.

---

## One-time **baseline** (do this ONCE, by someone with prod access)

**Status (verified live, 2026-06-10):** the remote's migration history
(`supabase_migrations.schema_migrations`) is **empty** — the CLI has never
tracked this database. That makes the baseline simple: the repo carries an
explicit **no-op baseline marker**
(`supabase/migrations/20260610000000_baseline_existing_schema.sql`) that
declares "everything before this came from `scripts/`". Because the remote
history is empty, there is no `migration repair` dance — a plain push applies
the marker (a `select 1`) plus everything after it, in order:

```bash
npm run db:push        # applies the baseline marker + all later migrations
npm run db:status      # sanity check — should show local and remote in sync
```

Alternatively, with a **write-enabled Supabase MCP connection** an agent can
apply each pending file via `apply_migration` (same name + content) — identical
result, no CLI needed.

> Note: this marker approach deliberately does **not** snapshot the current
> schema into the repo. If you ever want that (it helps spinning up local dev
> DBs), run `npm run db:pull` any time after baselining — it's an optional
> extra, not a prerequisite for anything above.

---

## Day-to-day: making a schema change

```bash
# 1. Create an empty, timestamped migration.
npm run db:new add_widget_table       # → supabase/migrations/<ts>_add_widget_table.sql

# 2. Write your SQL in that file. Make it idempotent where practical
#    (CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS, DROP POLICY IF EXISTS …)
#    and ALWAYS enable RLS on new tables + add policies — every table in this
#    project is RLS-protected.

# 3. Preview what will change against the linked remote.
npm run db:diff

# 4. Apply to the remote.
npm run db:push

# 5. Commit the migration file with the code that needs it.
git add supabase/migrations app && git commit -m "..."
```

The migration file is committed **with the feature PR**, so reviewers see the
schema change alongside the code, and anyone can reproduce it.

---

## Rules

- **Never edit a migration that's been pushed.** It's already applied on the
  remote (and maybe other clones). To change it, write a *new* migration.
- **One logical change per migration.** Easier to review and to roll forward.
- **New tables: `ENABLE ROW LEVEL SECURITY` + policies, always.** A table with
  RLS off is exposed to every authenticated user via the anon key. App routes
  that need to bypass RLS use the service-role client deliberately.
- **Migrations run in version (timestamp) order.** Don't hand-rename them.
- **CI does not touch your database.** The CI build uses throwaway env and never
  connects to Supabase; `db:push` is a human action against a linked project.

---

## Future: generated types

Once the baseline lands, the project's ~150 `as any` casts on Supabase queries
can be largely eliminated by generating types from the schema:

```bash
npx supabase gen types typescript --linked > lib/supabase/database.types.ts
```

…then typing the clients with `createClient<Database>(...)`. That's a separate,
larger change tracked in the audit — but the baseline above is its prerequisite.
