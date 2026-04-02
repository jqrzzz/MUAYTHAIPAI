# CLAUDE.md - Project Context for AI Assistants

## Project

MuayThaiPai / ScootScoot - A Muay Thai gym management platform built with Next.js and Supabase.

## Supabase Databases

There are two Supabase MCP connections. **Always use the correct one.**

### Nomadex (USE THIS ONE)
- **Host:** `mdamwgtdtrvvnskqdoon.supabase.co`
- **Purpose:** Muay Thai / ScootScoot application database
- **This is the database for this project.** All queries should target this database.

### SOS (DO NOT USE)
- **Host:** `jnbxkvlkqmwnqlmetknj.supabase.co`
- **Purpose:** SOS medical/insurance platform (cases, patients, providers, payers, claims)
- **Do not query or modify this database from this project.**

## Tech Stack

- **Framework:** Next.js (App Router)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (SSR via `@supabase/ssr`)
- **Styling:** Tailwind CSS
- **Payments:** Stripe
- **Package Manager:** pnpm

## Key Directories

- `app/` - Next.js App Router pages and API routes
- `components/` - React components
- `lib/supabase/` - Supabase client utilities (client.ts, server.ts, middleware.ts)
- `hooks/` - Custom React hooks
- `scripts/` - Utility scripts
- `docs/` - Architecture documentation

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
