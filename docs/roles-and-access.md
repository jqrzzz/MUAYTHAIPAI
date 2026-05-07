# Roles and access — source of truth

Last updated: Wave 10 (role-model cleanup).

This is the canonical reference for who can do what across MUAYTHAIPAI.
If you're adding a new feature, gate it against the matrix here, not by
inventing a new role.

---

## The four tiers

```
                 ┌─────────────────────┐
                 │   MASTER ADMIN      │  users.is_platform_admin = TRUE
                 │   (network-wide)    │  → /platform-admin
                 └─────────────────────┘
                          │
        owns / curates    │
                          ▼
        ┌──────────────────────────────────────┐
        │   GYMS (one organization per gym)    │
        └──────────────────────────────────────┘
            │              │            │
       ┌────┴───┐     ┌────┴───┐    ┌───┴────┐
       │ OWNER  │     │ ADMIN  │    │TRAINER │       org_members rows
       │ /admin │     │ /admin │    │/trainer│       (role + status)
       └────────┘     └────────┘    └────────┘
                          │
                          │ provides services to
                          ▼
                    ┌──────────┐
                    │ STUDENTS │   signed-in users (no org_members row)
                    │ /student │   their gym relationships live in `bookings`
                    └──────────┘
```

## What each tier can do

| Capability | Master | Owner | Admin | Trainer | Student |
|---|:-:|:-:|:-:|:-:|:-:|
| **Master admin** |  |  |  |  |  |
| Sign in to `/platform-admin` | ✅ | — | — | — | — |
| Add new gyms (manual, not via /signup) | ✅ | — | — | — | — |
| Edit network curriculum (the canonical Muay Thai courses) | ✅ | — | — | — | — |
| See every gym's data | ✅ | — | — | — | — |
| Approve / suspend gym subscriptions | ✅ | — | — | — | — |
| Run platform-wide AI command | ✅ | — | — | — | — |
| Discover + outreach to off-network gyms | ✅ | — | — | — | — |
| **Gym admin** (owner + admin) |  |  |  |  |  |
| Sign in to `/admin` | ✅ | ✅ | ✅ | — | — |
| Manage own gym's services, hours, settings | ✅ | ✅ | ✅ | — | — |
| Invite trainers + admins | ✅ | ✅ | ✅ | — | — |
| Author own gym's courses (gym-specific extras) | ✅ | ✅ | ✅ | — | — |
| Read network curriculum (read-only) | ✅ | ✅ | ✅ | ✅ | — |
| Issue all 5 cert levels (Naga → Garuda) | ✅ | ✅ | ✅ | — | — |
| Connect channels (LINE / WhatsApp / IG / FB) | ✅ | ✅ | ✅ | — | — |
| Use Owner-AI (drafts, announcements, propose actions) | ✅ | ✅ | ✅ | — | — |
| **Owner-only** (subset of admin) |  |  |  |  |  |
| Transfer ownership / delete the gym | ✅ | ✅ | — | — | — |
| Top-level Stripe subscription changes | ✅ | ✅ | — | — | — |
| **Trainer** |  |  |  |  |  |
| Sign in to `/trainer` | — | — | — | ✅ | — |
| Sign off student skills (own gym) | ✅ | ✅ | ✅ | ✅ | — |
| Issue cert levels 1–3 (Naga, Phayra Nak, Singha) | ✅ | ✅ | ✅ | ✅ | — |
| Issue cert levels 4–5 (Hanuman, Garuda) | ✅ | ✅ | ✅ | — | — |
| Read own gym's inbox | ✅ | ✅ | ✅ | ✅ | — |
| Approve / send AI drafts | ✅ | ✅ | ✅ | — | — |
| **Student / member** |  |  |  |  |  |
| Sign in to `/student` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Book at any gym in the network | ✅ | ✅ | ✅ | ✅ | ✅ |
| Track cert progress across gyms | ✅ | ✅ | ✅ | ✅ | ✅ |
| Take network curriculum courses | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chat with a gym's OckOck (public widget) | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## How a role is assigned

| Role | How it's set |
|---|---|
| Master admin | `UPDATE users SET is_platform_admin = TRUE WHERE email = '…'` (SQL, no UI) |
| Owner | Created via `/signup` — the first member of a new gym. |
| Admin | Invited by an existing owner/admin from `/admin → Members`. |
| Trainer | Invited by an existing owner/admin. The accept route also creates a `trainer_profiles` row. |
| Student | No assignment. Anyone who signs in via `/student/login` is a student. They become attached to a gym only by booking there. |

---

## Routes and gates

All gates enforced **server-side** in the page's `page.tsx` (Next.js
RSC) or in the API route handler. Client-side hides are cosmetic only.

| Route | Required |
|---|---|
| `/platform-admin/**` | `users.is_platform_admin = TRUE` |
| `/admin/**` | `org_members.role IN ('owner', 'admin')` (trainers redirect to `/trainer`, others to `/student`) |
| `/trainer/**` | active `trainer_profiles` row |
| `/student/**` | signed-in user |
| `/onboarding` | `org_members.role IN ('owner', 'admin')` (trainers redirect to `/admin`) |
| `/signup` | open (anyone can sign up a new gym) |
| `/login`, `/admin/login`, `/student/login`, `/trainer/login` | open |
| `/gyms/[slug]`, `/for-gyms`, `/pricing`, `/`, `/blog`, etc. | open |

---

## API helpers (use these instead of hand-rolling role checks)

In `lib/auth-helpers.ts`:

- `getOrgMember()` — returns `{ supabase, user, membership }` with no
  gating. Use when you need access to the membership shape but the
  caller decides what to do with it.
- `requireGymAdmin()` — returns `{ ok, status, error, supabase, user,
  orgId, role }`. Use for routes that should reject trainers + students.
- `requireGymStaff()` — same shape, includes trainers.
- `requireGymOwner()` — same shape, owner only (no admins). Use for
  destructive actions (transfer ownership, delete gym).
- `getPlatformAdmin()` — returns `{ supabase, user, isPlatformAdmin }`.
  Use in `/platform-admin/**` routes.

Pattern in a route handler:

```ts
import { requireGymAdmin } from "@/lib/auth-helpers"

export async function POST(request: Request) {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId, role } = auth
  // ... do the work, scoped to orgId
}
```

---

## Three concepts that have caused confusion

### 1. "Course" means three different things

- **Cert ladder** (Naga → Garuda) — hardcoded in `lib/certification-levels.ts`. Not editable. Five fixed levels by design.
- **Network curriculum** (`/platform-admin → Curriculum`) — the canonical
  Muay Thai courses. Master admin only edits these. Every gym sees them
  read-only. Stored in `courses` with `org_id IS NULL`.
- **Gym courses** (`/admin → Gym courses`) — extras a single gym
  authors for their own students (e.g. "Wisarut's Wai Kru workshop").
  Owner/admin of that gym edits. Stored in `courses` with `org_id` set.

### 2. Students are not org members

A user can train at five different gyms across Thailand and earn certs
from all of them. They never have an `org_members` row. Their
relationship to each gym lives in `bookings.user_id` and
`certificates.user_id`. The cert ladder is portable across gyms by
design — that's the network's value prop.

### 3. The `student` role on `org_members.role` was removed (Wave 10)

Earlier the role enum allowed `'student'` but nothing wrote it after
real students moved to `/student/login` (no membership). The Wave 10
migration tightened the enum to `('owner', 'admin', 'trainer')` and
removed dead `can_manage_*` columns.

If you're tempted to add a new role: don't. Add a permission column
back (and read it everywhere), or build it as a separate `org_members`
extension table. New top-level roles fragment the model.
