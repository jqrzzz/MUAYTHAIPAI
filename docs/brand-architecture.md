# Brand architecture

Three distinct things share this codebase. Keep them separate in your head — and
on the right domains.

## 1. The Pai gym site — `paimuaythai.com` / `muaythaipai.com`

One real gym's public marketing site: `/`, `/classes`, `/gym`, `/fighters`,
`/apprenticeship`, `/train-and-stay`, `/pai-thailand`, `/blog`,
`/certificate-programs`, etc. This is *not* OckOck and *not* "the network" — it's
just one gym that happens to be the project's origin. Leave it alone.

## 2. MUAYTHAIPAI — the network (currently rides on `muaythaipai.com`)

The public credential + directory layer:

- the Naga–Garuda 5-level cert ladder
- `/verify/[certNumber]` — public credential verification
- `/gyms/[slug]` — public gym profiles / directory
- `/p/[handle]`, `/practitioners` — practitioner profiles
- `/i/[handle]`, `/instructors` — instructor profiles

`NEXT_PUBLIC_SITE_URL` (= `muaythaipai.com`) drives all of this — verify links,
certificate PDFs, invite emails, cron digests. It stays put. Credentials and the
directory belong to *the network*, not to a product domain. (Whether the network
eventually gets its own neutral domain instead of riding on a single gym's domain
is a separate, later question.)

## 3. OckOck — the product — `ockock.app`

The thing a gym owner pays for. OckOck is its **own brand**, not a feature of
MUAYTHAIPAI:

- the AI assistant (two brains: owner-side in `lib/chat/ai/owner.ts`,
  customer concierge in `lib/chat/ai/concierge.ts`)
- the admin dashboard — bookings, students, the "Train OckOck" tab, channels/inbox
- `/for-gyms` (marketing), `/pricing`, `/signup`, `/login`, `/admin/*`
- mascot: the water buffalo (`public/images/ockock-avatar.png`); Thai: อ๊อกอ๊อก

`ockock.app/` rewrites to `/for-gyms` (see `middleware.ts`). "Listed on the
MUAYTHAIPAI network" is a *feature* OckOck sells — the dependency points that way,
not the other way around.

### Cold-visitor rule

"OckOck" means nothing to someone who's never heard of it. Any OckOck surface
must say "Muay Thai gym" loudly and immediately — in the H1, not three scrolls
down. The name is the brand; the tagline does the explaining.

## Domain map

| Domain | Serves | `/` shows |
| --- | --- | --- |
| `paimuaythai.com` / `muaythaipai.com` | Pai gym site + the network | Pai gym homepage |
| `ockock.app` | the OckOck product | `/for-gyms` (rewrite) |

Same Vercel project, same deployment — routing is host-based in `middleware.ts`.
All routes resolve on all domains; the table above is just what's *canonical*
where. Making `ockock.app` canonical for the product pages (canonical tags, 301s
from the old domain, Supabase redirect-URL config, a `NEXT_PUBLIC_APP_URL`) is a
deliberate follow-up, not done yet.
