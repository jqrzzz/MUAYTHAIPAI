# Tenant-purity audit — is Muay Thai Pai a clean tenant?

**Status:** Read-only assessment — **no code changed.** A catalog, not a patch.
**Date:** 2026-06-04
**Lens:** Every place the code names Muay Thai Pai is labelled **KEEP** (legitimate
bespoke storefront, or the network acting as itself) or **LEAK** (MTP-the-gym
identity sitting in a tenant-level path that *every* gym flows through).
**Related:** `docs/brand-architecture.md` (the 3-identity model),
`docs/ockock-multi-tenant-readiness.md` (broader readiness — RLS, billing, signup;
not re-litigated here), `docs/mtp-ockock-separation-decision.md`.

---

## The headline (the reassurance you asked for)

**The money path has zero MTP hardcoding.** No query hardcodes an org UUID
(`eq("org_id", "<uuid>")` → no matches anywhere), and the Stripe charge path is
env-driven, not gym-specific. **MTP is already a generic tenant where it counts.**
So onboarding gym #2 cannot break MTP's payments — there's nothing gym-specific
left in the charge path to collide with. The leaks below are all in the
**identity layer** (what emails/UI *say*), never the **transaction layer**.

## The rule for reading this (3 identities, not 2)

Per `brand-architecture.md` there are **three** brands sharing the code:

| Identity | Legit owner of… | In code looks like |
|---|---|---|
| **Muay Thai Pai (the gym)** | the bespoke storefront + tenant #1's data | `"Muay Thai Pai"`, `info@paimuaythai.com`, `wisarut-family-gym`, Wisarut/family content |
| **MUAYTHAIPAI (the network)** | certs, the directory, network outreach | `MUAYTHAIPAI`, `noreply@muaythaipai.com`, `hello@muaythaipai.com` |
| **OckOck (the product)** | dashboards, billing, support | `OckOck`, ockock.app |

A `MUAYTHAIPAI <noreply@muaythaipai.com>` sender on a **certificate** email is the
*network* acting as itself → **KEEP**. The string `"Muay Thai Pai"` or
`info@paimuaythai.com` baked into a **booking confirmation** is *the gym* leaking
into a tenant path → **LEAK**. Same-looking strings, opposite verdicts — that's
why this needs a per-site read, not a find-and-replace.

## Already fixed since the 2026-05-25 readiness audit ✅

- **Global chat widget is now host-conditional.** `app/layout.tsx:96-97,295` —
  derives `isOckOckProduct = host.endsWith("ockock.app")` and only mounts the MTP
  concierge when `!isOckOckProduct`. (Was readiness BLOCKER #6.)
- **`/api/public/courses` now requires `gym` + filters by `org_id`.**
  `route.ts:18-19,44`. (Was readiness BLOCKER #8.)
- **The public services/trainers endpoints no longer default to MTP** — the
  `wisarut-family-gym` fallback is gone from `app/api/**` (search returns no hits;
  the remaining slug defaults are all storefront client code — see KEEP).

Good signal: the cleanup is already underway and trending the right way.

---

## LEAKs — MTP-the-gym in tenant/operational paths (fix these)

### HIGH — customer-facing wrong identity

| # | Location | What leaks | Fix |
|---|---|---|---|
| L1 | `lib/email-service.ts:13-17` `DEFAULT_ORG` | `orgName:"Muay Thai Pai"`, `orgEmail:"info@paimuaythai.com"` used as fallback in **booking confirmation, staff notification, contact form** (`org = data.org \|\| DEFAULT_ORG` at lines 163, 201, 398, 450, 708) | Require org context; on missing, fall back to the **network** identity, never MTP-the-gym. Or throw — a tenant email with no tenant is a bug, not a default. |
| L2 | `lib/env.ts:101` | `staffNotification` defaults to `info@paimuaythai.com` — gym #2's staff alerts could land in MTP's inbox if its `notification_email` is unset | Default to the org's own email (already resolved in `lib/notifications.ts`); drop the MTP literal. |
| L3 | `lib/email-service.ts:168,208,408` | `fromEmail = org.orgEmail \|\| "info@paimuaythai.com"` — same MTP fallback on three send paths | Same as L1 — fall back to network sender, not the gym. |

These three are the exact bug-class you felt this session (emails wearing MTP's
address). They're identity-only — **none touch the charge.**

### MEDIUM — brand bleed in shared product UI / templates

| # | Location | What leaks | Fix |
|---|---|---|---|
| L4 | `lib/email-service.ts:908,935,996,1019` | Footer hardcodes `Muay Thai Pai` in cert / booking templates, even though "Issued By" correctly uses `${data.gymName}` two lines up | Use `${data.gymName}` (tenant) or the network name; never the literal. |
| L5 | `components/admin/website-tab.tsx:369` | Placeholder shown to **every** gym owner: *"Train with the legendary Wisarut family"* | Generic placeholder ("Train with our team in …"). |
| L6 | `lib/chat/seed-faqs.ts` | **Confirmed leak** (investigated 2026-06-04): all 18 `SEED_FAQS` are MTP content (Wisarut family, Pai, MTP's prices/hours/ED-visa), and `POST /api/admin/faqs/seed` writes them into the *logged-in owner's* gym — surfaced by the "Seed from website FAQ" button in the Train OckOck tab (`components/admin/train-ockock-tab.tsx:277`), shown to every gym owner. A non-MTP owner who clicks it teaches their AI concierge MTP's facts. | **DEFERRED — intentional.** Decision 2026-06-04: keep the one-click seed feature; the long-term shape is per-tenant seed packs (each gym's onboarding pre-populates its own canonical FAQs). Acceptable today because MTP is the only live tenant; revisit before gym #2 has access to the Seed button. |

### LOW — cosmetic / global

| # | Location | What leaks | Fix |
|---|---|---|---|
| L7 | `public/manifest.json:2-3` | PWA name `"Muay Thai Pai - Wisarut Family Gym"` served on **both** hosts → installing from ockock.app says "Muay Thai Pai" | Host-aware manifest, or accept (the PWA is really the MTP storefront app). |
| L8 | `components/admin/trainers-tab.tsx:419` | Placeholder `e.g. Kru Wisarut` in shared admin | Generic ("e.g. Head Coach"). Borderline — an example, not an assertion. |

### Network identity hardcoded to the gym's domain (resolve when the network gets its own home)

Not MTP-gym leaks, but the **network** using `paimuaythai.com`/`muaythaipai.com`
literally instead of a named constant — they'll all need one touch the day the
network moves to a neutral domain:

- `lib/email-service.ts:1082,1087` — `support@paimuaythai.com` (product support)
- `lib/email-service.ts:1148` — `noreply@paimuaythai.com` fallback
- `app/api/platform-admin/gyms/route.ts:76` — `noreply@paimuaythai.com` (network outreach)
- `lib/ockock/product.ts:11`, billing/settings cards — `hello@muaythaipai.com`
- `from: MUAYTHAIPAI <noreply@muaythaipai.com>` ×7 (cert, course, ticket, fight, invite emails)

**Fix as one move:** extract `lib/network-identity.ts` →
`{ name, fromEmail, supportEmail, url }` and point all network-level sends at it.
Then a re-domain is a one-line change, not a 15-file sweep.

---

## KEEP — legitimately MTP, do **not** "fix"

- **All storefront `wisarut-family-gym` defaults** — these render on muaythaipai.com
  where defaulting to MTP is *correct*: `app/enroll/client.tsx:33`,
  `app/fighters/client.tsx:35`, `app/book/client.tsx:11`, `app/courses/client.tsx:67`,
  `app/certificate-programs/client.tsx:175`, `app/layout.tsx:295` (chat widget, now
  host-gated), `app/llms.txt/route.ts:65`.
- **`lib/family-data.ts`** — MTP founder/family content, imported only by
  `app/client.tsx` + `app/gym/client.tsx` (storefront). Clean.
- **`components/blog/article-schema.tsx`** — `muaythaipai.com` in blog JSON-LD; the
  blog is MTP storefront content.
- **`lib/payment-config.ts:1`** — just a comment; trivial.

## VERIFY — storefront-safe default, latent if reused on another gym's surface

- `components/booking-section.tsx:56` — `gymSlug = "wisarut-family-gym"` default.
  Fine **iff** every non-MTP caller passes an explicit slug. Audit its callers;
  if any render for another gym without a slug, make the prop required.
- `components/admin/embed-snippet-card.tsx:12` — `SITE_ORIGIN =
  "https://muaythaipai.com"`. A non-MTP gym's booking embed routes through the
  network domain. Likely intended (network booking) — confirm that's the model.

---

## Recommended fix order (all tiny, all payment-safe)

None of these touch `create-payment-intent`, the Stripe webhook charge logic, or
the `bookings` upsert. They are identity-string changes only.

1. **L1–L3** — kill the `DEFAULT_ORG` MTP fallback; require org context or fall
   back to network identity. *Highest value — closes the wrong-sender bug class.*
2. **Extract `lib/network-identity.ts`** and route all network-level sends + the
   footer (L4) through it. Folds in the "network domain hardcoded" list.
3. **L5, L8** — de-MTP the admin placeholders.
4. **L6** — **DEFERRED** (decision 2026-06-04). Investigated and confirmed as a
   real leak (the Seed button writes MTP's facts into any gym's `gym_faqs`), but
   the seed feature itself is healthy product behavior — every future client will
   want a one-click "populate my AI's knowledge" affordance. Long-term shape:
   per-tenant seed packs. Acceptable today because MTP is the only live tenant;
   revisit before another gym gains access to the Seed button (gate it behind the
   gym's onboarding state, or replace `SEED_FAQS` with a per-org pack lookup).
5. **L7** — decide manifest policy.

---

## Shipped (running tally)

- ✅ **L1–L3** — tenant email identity, network as fallback (`dbf9735`, 2026-06-04)
- ✅ **L4 + `lib/network-identity.ts`** — network identity centralized; cert/course
  footers fixed (`31892f5`, 2026-06-04)
- ✅ **L5/L8 (full sweep)** — six MTP-specific admin placeholders neutralized
  across website/trainers/settings/channels/marketing tabs (`2f5c1f9`, 2026-06-04)
- 🅿️ **L6** — deferred by design (see #4 above)
- ⬜ **L7** — open
- ⬜ **Network-domain follow-ups** — `platform-admin/gyms` invite (name
  inconsistency: "Muay Thai Network" vs "MUAYTHAIPAI" in body), `product.ts`
  (OckOck-product identity, distinct from network), UI `mailto:` links.

**Net:** MTP stays a fully bespoke storefront (KEEP list untouched), but every
*operational* path stops asserting "Muay Thai Pai" and starts reading the tenant —
which is exactly "MTP is the founding tenant, not a special case in the code."

For the non-purity readiness gaps (RLS open-door policies, `trial_ends_at` at
signup, self-serve checkout, pricing single-source-of-truth), see
`docs/ockock-multi-tenant-readiness.md` Tiers 0–1 — still the authoritative list.
