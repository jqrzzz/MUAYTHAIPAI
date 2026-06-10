# `scripts/` — frozen migration history

These numbered SQL files (`001-create-tables.sql` … `078-gym-ai-persona.sql`)
plus the `RUN-*.sql` bundles are the **historical** record of how the schema was
built, applied by hand in the Supabase SQL editor.

**Do not add new migrations here.** New schema work goes through the Supabase
CLI — see [`docs/MIGRATIONS.md`](../docs/MIGRATIONS.md).

This directory is kept (not deleted) for two reasons:

1. It's the audit trail of the pre-CLI schema history.
2. Several admin screens still reference specific files by name as
   operator instructions (e.g. "run `scripts/042-add-audit-log.sql`"), so the
   paths must stay valid until those references are migrated.

Also here:

- `RUN-MISSING-MIGRATIONS.sql` — idempotent catch-up bundle; run it once to
  bring a drifted database current **before** baselining with the CLI.
- `RUN-PLATFORM-ADMIN.sql`, `RUN-ALL-COURSES.sql` — inlined bundles of the
  platform-admin (023–026) and course-system (013) migrations.
- `validate-seo.ts` — a standalone SEO checker (excluded from the app typecheck).
