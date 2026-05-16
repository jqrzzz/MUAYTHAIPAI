/**
 * Canonical host for the OckOck product. Pages live at clean URLs on
 * ockock.app — `/fights`, `/fighters`, `/promoter`. Internally Next
 * routes them under `/ockock/*` so they don't collide with Pai gym
 * routes on muaythaipai.com; the middleware handles the rewrite.
 *
 * Use `ockockUrl(path)` when you need an absolute URL that always
 * points at ockock.app:
 *   - server-side URL construction for emails, Stripe, sitemap, JSON-LD
 *   - hrefs in components rendered on either host (admin/trainer
 *     dashboards, the 404 page) so the link lands on ockock.app
 *     regardless of which domain the user opened
 *
 * Don't use this for hrefs INSIDE the OckOck route tree (app/ockock/*
 * and components/ockock/*) — those should be bare paths (`/fights`,
 * `/fighters/123`) so client-side nav stays inside the current host
 * without an extra cross-origin hop.
 */
export const OCKOCK_HOST =
  process.env.NEXT_PUBLIC_OCKOCK_URL ?? "https://ockock.app"

export function ockockUrl(path: string): string {
  return `${OCKOCK_HOST}${path}`
}
