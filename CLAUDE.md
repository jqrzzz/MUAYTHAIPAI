# CLAUDE.md - Project Context for AI Assistants

## Project

MuayThaiPai / ScootScoot - A Muay Thai gym management platform built with Next.js and Supabase.

## Nomadex Ecosystem

This project is part of the **Nomadex** tourist ecosystem — multiple intertwined products sharing one database.

### Products (all share the Nomadex Supabase database)

| Product | Repo | Status | Purpose |
|---------|------|--------|---------|
| **MuayThaiPai** | `jqrzzz/MUAYTHAIPAI` (this repo) | Active | Gym SaaS, booking, certification standard for Thailand |
| **OckOck** | `jqrzzz/OCKOCK` | Active | Fighter/promoter registry, events, matchmaking, tickets |
| **ScootScoot** | TBD | Future | Scooter/transport tourism product |
| **Shadow Checking** | TBD | Future | TBD |

### Shared Resources
- **Database:** Nomadex Supabase (see below)
- **Auth:** Supabase Auth — one user account across all products
- **AI Assistant:** OckOck (water buffalo) — shared AI personality across all products
- **Users table:** Shared — a user can be a gym student, a fighter, a promoter, etc.
- **Organizations table:** Shared — an org can be a gym, a promotion company, etc.

### Architecture Principles
- **One database, clean separation** — product-specific tables are prefixed or clearly named
- **No spaghetti** — products connect through shared `users` and `organizations` tables only
- **Brick by brick** — add tables/features incrementally, don't over-engineer
- **Each product owns its domain** — MuayThaiPai owns gym/booking/certification, OckOck owns fighters/events/bouts

## Supabase Databases

There are two Supabase MCP connections. **Always use the correct one.**

### Nomadex (USE THIS ONE)
- **Host:** `mdamwgtdtrvvnskqdoon.supabase.co`
- **MCP ID:** `01a40bce-6898-4fde-b9c8-085c3f3d2ed2`
- **Purpose:** All Nomadex ecosystem products (MuayThaiPai, OckOck, ScootScoot, etc.)
- **This is the database for this project.** All queries should target this database.

### SOS (DO NOT USE)
- **Host:** `jnbxkvlkqmwnqlmetknj.supabase.co`
- **MCP ID:** `29ec0a3a-db26-4468-94b0-2742d0dc88bc`
- **Purpose:** SOS medical/insurance platform (cases, patients, providers, payers, claims)
- **Do not query or modify this database from this project.**

## Tech Stack

- **Framework:** Next.js (App Router)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (SSR via `@supabase/ssr`)
- **Styling:** Tailwind CSS
- **Payments:** Stripe
- **AI:** OckOck assistant (currently OpenAI via `ai` lib, migrating to Vercel AI)
- **Package Manager:** pnpm

## Key Directories

- `app/` - Next.js App Router pages and API routes
- `components/` - React components
- `lib/supabase/` - Supabase client utilities (client.ts, server.ts, middleware.ts)
- `hooks/` - Custom React hooks
- `scripts/` - SQL migration scripts (numbered 001-012+)
- `docs/` - Architecture documentation

## Database Table Ownership

### Shared (all products)
- `users` — all users across the ecosystem
- `organizations` — gyms, promotion companies, etc.
- `org_members` — user-to-org relationships with roles
- `activity_logs` — audit trail

### MuayThaiPai (gym SaaS)
- `services`, `time_slots` — what gyms offer
- `bookings`, `payments` — booking and payment flow
- `trainer_profiles` — gym trainer profiles (includes fight record for display)
- `certificates` — Muay Thai certification system
- `student_credits`, `credit_transactions` — credit/package system
- `student_notes` — trainer notes on students
- `org_settings` — per-gym configuration
- `invites` — member invitation system
- `gym_subscriptions` — SaaS billing for gyms
- `gym_payouts` — commission/payout tracking
- `gym_faqs` — AI knowledge base per gym
- `blacklist`, `blacklist_comments` — safety system

### OckOck (fight platform)
- `fighters` — standalone fighter registry
- `events` — fight nights, tournaments, exhibitions
- `event_bouts` — individual matchups within events

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
