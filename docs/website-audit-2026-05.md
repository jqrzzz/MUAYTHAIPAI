# Muay Thai Pai — Website Audit & Work Plan

**Source:** Owner manual pass of the live site (2026-05-24).
**Status:** Planning only — **no fixes applied yet** (except the already-shipped removal of "Kru Fom" from the family slider).

Each item below has: the owner's note → what's actually in the code today (with file refs) → the gap / root cause → a proposed approach → effort/risk → decisions needed. The items are grouped into phases at the end.

---

## 1.1 Homepage family slider — can't smoothly browse members
- **Note:** The main page doesn't let users smoothly scroll through / view the other family members. Make it smoother, cleaner, more professional.
- **Now:** Data is clean (`lib/family-data.ts`, 11 members). Rendered **three times** inside `app/client.tsx`: a desktop right-rail that shows **only 4 at a time** with up/down chevron paging (`app/client.tsx:751`), and a mobile/tablet "Meet the Fam" button → bottom-sheet grid (`:616`). The whole homepage returns `null` until JS mounts (`:156`); responsive layout comes from JS `window.innerWidth` (`:58-69`), not CSS.
- **Gap / root cause:** The desktop 4-at-a-time paging is the "can't smoothly scroll" pain. Card markup is duplicated 3×. JS-driven breakpoints blank the first paint (hurts LCP/SEO).
- **Approach:** Extract a `<FamilySlider/>`; one shared `<MemberAvatar/>` + `<MemberDetail/>`; drive layout with Tailwind breakpoints (so it renders server-side); replace desktop paging with a smooth horizontal rail / scroll-snap carousel showing everyone (the repo already has `components/ui/carousel.tsx` / embla). Make cards real `<button>`s and the detail a proper dialog.
- **Effort:** M · **Risk:** M (high-visibility homepage; must verify visually).
- **Decisions:** Keep bottom-sheet on mobile? Desktop = horizontal rail vs. responsive grid?

## 1.2 OCK OCK mobile widget — transparent/clean, rate-limited, no footer overlap
- **Note:** Mobile OCK OCK layout should be transparent and clean, AI rate-limited where appropriate, and must not overlap the fixed footer menu.
- **Now:** `components/public/ockock-chat-widget.tsx` — bubble is `fixed bottom-6 right-6 z-50` (`:129`); the open panel is full-screen on mobile (`bottom-0 right-0`, `:144`). The bottom nav is also `fixed bottom-0 z-50`. No rate limiting in the widget or its `/api/public/chat` route (only a `loading` flag blocks double-sends).
- **Gap / root cause:** Bubble at `bottom-6` collides with the fixed bottom nav; full-screen panel covers it. No server-side rate limit on the chat API (cost/abuse exposure).
- **Approach:** Offset the bubble above the bottom nav on mobile (e.g. `bottom-24`), confirm z-order, and have the open panel leave room for / sit above the nav. Add IP/session rate limiting to `/api/public/chat`. Polish transparency/contrast.
- **Effort:** S–M · **Risk:** L.
- **Decisions:** Rate-limit thresholds (per session / per IP / per day)? Should the widget hide while the bottom-sheet family overlay is open?

## 1.3 Classes — structure "Muay Thai Kids" + "Muay Thai for All" (Govt of Thailand) as a real program
- **Note:** Classes page is clean. Kids section says "Book Now Free." Want Muay Thai Kids + the Government-of-Thailand-sponsored "Muay Thai for All" to be their own structured offering: kids participating, recognition for completion, certificates/acknowledgment, and a dedicated section/page.
- **Now:** `app/classes/client.tsx` has GROUP / PRIVATE / KIDS (≈500 THB/session, `:553-702`) / ONLINE / BLACK LABEL sections; pricing is hardcoded; each section embeds `<BookingSection/>`. No "Muay Thai for All" or Government-of-Thailand content exists yet. (Note: owner saw "Book Now Free" on Kids — need to reconcile with the 500 THB in code; may be a variant/stale copy.)
- **Gap:** "Muay Thai for All" is a net-new program concept with no page, data model, or recognition flow.
- **Approach (needs brainstorm first):** Define the program (eligibility, what "participation/completion" means, what recognition is granted). Likely a dedicated `/muay-thai-for-all` page + tie completion into the existing certificate system (see 1.6/1.7). Decide if kids get a lightweight certificate variant.
- **Effort:** M–L (content + possibly cert plumbing) · **Risk:** L.
- **Decisions:** Is "Muay Thai for All" free? Who certifies completion? Does it reuse the Naga→Garuda cert system or get its own kids track?

## 1.4 Mobile menu bug — bottom nav only behaves correctly on the homepage
- **Note:** Mobile menu isn't working correctly after navigating into the Classes page; it's fixed/correct on the homepage only. Fix across all pages.
- **Now / root cause:** The bottom nav is **added manually per page** (12+ call sites). On the homepage it's a direct child of a plain wrapper (`app/client.tsx:972`). On Classes it's rendered **inside** the splash/`AnimatePresence` content branch and a `<PageBackground>` wrapper (`app/classes/client.tsx:999`), so its presence is gated by splash state and it re-runs its 1.1s entrance animation on client-side navigation. This per-page placement is inconsistent and fragile.
- **Approach (clean, fixes 1.4 + 1.10 together):** Hoist `<MarketingBottomNav/>` into a **shared marketing layout** so it renders once at a stable top level, identical on every page, outside per-page animation/splash wrappers. Derive the active tab from `usePathname()` instead of the per-page `active` prop, and remove the 12+ manual call sites.
- **Effort:** M · **Risk:** M (touches every marketing page's layout; verify nav + active state on each).
- **Decisions:** Introduce an `app/(marketing)/` route group for the shared layout, or a wrapper component every page renders?

## 1.5 Our Gym page — upgrade identity / credibility / story / team / facilities / culture
- **Note:** Upgrade the Our Gym page to better communicate the gym's identity, credibility, story, team, facilities, and culture.
- **Now:** `app/gym/client.tsx` is minimal (~5.6KB): hero, a 4-image carousel, an 8-item emoji amenities grid, CTA links. National Geographic is mentioned only in metadata, not on the page. No story, family history, Kru Wisarut bio, or team roster.
- **Approach:** Content-led redesign: story/lineage section, credibility (Nat Geo, certifications, years), team (can reuse family-data / trainers API), facilities gallery, culture. Build reusable sections.
- **Effort:** M–L (mostly content + layout) · **Risk:** L.
- **Decisions:** Source copy/photos from owner. Reuse the family/trainers data or curate a separate gym-team list?

## 1.6 Certifications page — upgrade explanation of the system & its value
- **Note:** Upgrade Certifications to better explain the certification system, the levels, the value of recognition, and how it ties into the broader training structure.
- **Now:** `app/certificate-programs/client.tsx` lists 5 levels (Naga → Phayra Nak → Singha → Hanuman → Garuda) with skills counts + prices (hardcoded array, `:20-130`); good Schema.org markup in `page.tsx`. Explanation of *why it matters* and how it connects to courses/training is thin.
- **Approach:** Add a "how the system works" narrative (progression, what each level proves, how to earn it), connect to courses (1.7) and verification (`app/verify/...`), surface the value of recognition. Possibly visualize the level ladder.
- **Effort:** M · **Risk:** L.
- **Decisions:** Finalize pricing for Hanuman/Garuda (currently TBD). How tightly to couple to courses?

## 1.7 Courses / online course strategy — major priority, lots of missing content
- **Note:** Courses must stay on the MTP site (gym keeps credit/ownership) but are missing a lot of content. Brainstorm what online courses mean and how they tie to certification. Key questions: educational only? linked to cert levels? unlock badges/progress? audience (tourists / serious students / remote)? how does it support the gym long-term?
- **Now:** `app/courses/client.tsx` fetches `/api/public/courses`; courses carry `certificate_level`, `is_free`, `price_thb`, module/lesson counts, category & difficulty filters. The plumbing exists; the **content and the strategy connecting courses ↔ certs ↔ recognition are missing**.
- **Approach (brainstorm/architecture first, then build):** Decide the model — e.g., courses = educational content that maps to certificate levels and unlocks progress/badges; serve tourists (taster), remote learners (full curriculum), and in-gym students (pre/post-trip study). Define progress tracking + how online completion contributes to (but may not fully grant) a cert. Then design content structure + UI.
- **Effort:** L (strategy + data model + content + UI) · **Risk:** M.
- **Decisions:** The five "Key questions" in the note are the agenda for a dedicated brainstorm session.

## 1.8 Back-button UI — warped / inconsistent
- **Note:** Back buttons on some pages are warped/messy/unprofessional; clean them up.
- **Now:** No shared back-button component — each page rolls its own (`app/book/client.tsx`, `app/gyms/[slug]/client.tsx`, `app/admin/students/[id]/client.tsx` all use ad-hoc `ArrowLeft` + text). The specific "warped" ones weren't pinned down in this pass and need a targeted visual audit (likely on marketing sub-pages).
- **Approach:** Audit every back button, create one shared `<BackButton/>` (consistent size/spacing/hit-area), replace ad-hoc instances.
- **Effort:** S–M · **Risk:** L.
- **Decisions:** Which pages have the warped ones (owner to point out, or audit page-by-page)?

## 1.9 Fighters page — auto-populate from OCK OCK profiles + social feed
- **Note:** Update Fighters. Ideally OCK OCK app users' fighter profiles appear here automatically (no manual updates). Should account for the OCK OCK social-feed side; OCK OCK helps fighters get profiles/fights/content online.
- **Now:** `app/fighters/client.tsx` already fetches from the DB (`/api/public/trainers?gym=wisarut-family-gym`) — not hardcoded — and renders an accordion. No social-feed integration. (Also note: this page is missing the bottom nav entirely — see 1.10.)
- **Approach (architecture):** Define how an OCK OCK fighter profile flows to the public page automatically (which table, opt-in flag, gym association), then render fights/updates from the OCK OCK feed. Largely a data-model/integration question tied to 1.11.
- **Effort:** L · **Risk:** M.
- **Decisions:** What is the canonical fighter-profile source in OCK OCK? Opt-in vs automatic? What feed content is public?

## 1.10 Fighters page mobile menu — missing
- **Note:** The fighters page fixed mobile menu isn't working; fix consistently sitewide.
- **Now / root cause:** `app/fighters/client.tsx` **does not render `<MarketingBottomNav/>` at all** (confirmed — it's absent from the file). So the menu is simply missing here.
- **Approach:** Fixed automatically by the 1.4 solution (hoist the nav into a shared marketing layout so every page — including Fighters — gets it). If we don't do the layout refactor, the minimal fix is to add `<MarketingBottomNav/>` to this page.
- **Effort:** S (or free, if 1.4 is done as a layout) · **Risk:** L.

## 1.11 Account access — gym owner / student / OCK OCK structure
- **Note:** Decide what to do with account access. A clean structure may let gym owners and students use their own webpage; if not, students/owners may need the OCK OCK app. Needs product-architecture planning.
- **Now:** Roles live in `org_members` (owner / admin / trainer); `/admin` and `/trainer` dashboards exist; students can book as guests and there are `/student/login` and `/trainer/login` entry points; OCK OCK has its own profile/credit layer. (See `docs/roles-and-access.md`.)
- **Approach (architecture):** This is a decision, not a bug. Map the three audiences (owners, students, fighters/trainers) to surfaces (own gym webpage vs. OCK OCK app) and define what each can do where. Feeds 1.9.
- **Effort:** L (planning) · **Risk:** — (decision-led).
- **Decisions:** Do students get accounts on the gym site, the OCK OCK app, or both? Where do owners manage everything?

---

## Suggested phasing

**Phase A — Quick technical fixes (clear root cause, low/medium risk, high polish payoff):**
- 1.4 + 1.10 Mobile nav → hoist to a shared marketing layout, derive active from pathname (fixes both at once).
- 1.8 Back buttons → shared `<BackButton/>`.
- 1.2 OCK OCK widget → offset above the nav + rate-limit the chat API.

**Phase B — Frontend upgrades (medium, content + layout, verify visually):**
- 1.1 Family slider refactor.
- 1.5 Our Gym page.
- 1.6 Certifications page.

**Phase C — Product/strategy + architecture (brainstorm & decide before building):**
- 1.7 Courses / online course strategy ↔ certification (the big one).
- 1.3 Muay Thai Kids / "Muay Thai for All" program.
- 1.9 Fighters auto-profiles + social feed.
- 1.11 Account access architecture.

Phase A is the recommended starting point: contained, verifiable, and it removes the most visible "feels unprofessional" issues. Phases B and C should each start with a short decisions pass (the "Decisions" lines above) before any code.
