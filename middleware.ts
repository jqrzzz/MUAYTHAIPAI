import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

// Comprehensive Wix to Next.js URL redirects based on SEO analysis
const redirects: Record<string, string> = {
  // Homepage variations
  "/home": "/",
  "/index": "/",

  // Main Wix pages to Next.js equivalents
  "/our-story": "/gym",
  "/the-experience": "/classes",
  "/licensing-and-accreditation": "/certificate-programs",
  "/gym-schedule-pricing": "/classes",
  "/accommodation": "/train-and-stay",
  "/book-online": "/train-and-stay",
  "/library": "/blog",
  "/muay-thai-for-kids": "/classes",
  "/th/online-training": "/certificate-programs",
  "/online-training": "/certificate-programs",
  "/black-label": "/train-and-stay",
  "/events": "/blog",

  // Common page variations
  "/about": "/gym",
  "/about-us": "/gym",
  "/story": "/gym",
  "/training": "/classes",
  "/muay-thai-classes": "/classes",
  "/private-lessons": "/classes",
  "/group-classes": "/classes",
  "/schedule": "/classes",
  "/pricing": "/classes",
  "/rates": "/classes",
  "/timetable": "/classes",

  // Programs and certification
  "/programs": "/certificate-programs",
  "/certification": "/certificate-programs",
  "/levels": "/certificate-programs",
  "/belts": "/certificate-programs",

  // Accommodation and packages
  "/stay": "/train-and-stay",
  "/packages": "/train-and-stay",
  "/stay-and-train": "/train-and-stay",
  "/booking": "/train-and-stay",
  "/reserve": "/train-and-stay",

  // Location and contact
  "/contact-us": "/contact",
  "/get-in-touch": "/contact",
  "/location": "/contact",
  "/pai": "/pai-thailand",
  "/about-pai": "/pai-thailand",
  "/thailand": "/pai-thailand",

  // Fighters and team
  "/trainers": "/fighters",
  "/instructors": "/fighters",
  "/our-team": "/fighters",
  "/team": "/fighters",
  "/staff": "/fighters",
  "/coaches": "/fighters",

  // Visas and careers
  "/visa": "/education-visas",
  "/visas": "/education-visas",
  "/ed-visa": "/education-visas",
  "/education-visa": "/education-visas",
  "/jobs": "/careers",
  "/work-with-us": "/careers",
  "/employment": "/careers",
  "/career": "/careers",

  // Blog and content
  "/news": "/blog",
  "/articles": "/blog",
  "/posts": "/blog",

  // Gallery and media
  "/gallery": "/fighters",
  "/photos": "/fighters",
  "/images": "/fighters",
  "/media": "/fighters",

  // FAQ aliases (the real page lives at /faq)
  "/help": "/faq",
  "/support": "/faq",
  "/questions": "/faq",

  // Facilities
  "/facilities": "/gym",
  "/our-gym": "/gym",
  "/equipment": "/gym",

  // All 404 URLs from Google Search Console
  // Wix service-page URLs - redirect to classes/booking
  "/service-page/private-session": "/classes",
  "/service-page/morning-session": "/classes",
  "/service-page/afternoon-session": "/classes",
  "/service-page/1-year-membership": "/classes",
  "/service-page/naga-2-beginner-level-1": "/certificate-programs",
  "/service-page/naga-muay-thai-certification": "/certificate-programs",
  "/service-page/ratchasi-muay-thai-accreditation": "/certificate-programs",
  "/service-page/garuda-muay-thai-accreditation-thailand": "/certificate-programs",
  "/service-page/level-4-phaya-nak-certification": "/certificate-programs",
  "/service-page/lv-3-hanuman-accreditation": "/certificate-programs",
  "/service-page/hanuman-muay-thai-accreditation": "/certificate-programs",
  "/service-page/phaya-nak-muay-thai-accreditation": "/certificate-programs",

  // Wix event-details URLs - redirect to blog
  "/event-details/core-movement-workshop": "/blog",
  "/event-details/meditation-for-life": "/blog",

  // Old Wix pages
  "/communityvision": "/gym",
  "/schedule-and-pricing": "/classes",
  "/accessibility-statement": "/contact",
  "/muaythai-for-kids": "/classes",
  "/blank": "/",
  "/th/blank": "/",
  "/general-7": "/gym",
  "/copy-of-about-1": "/gym",

  // Wix system URLs - redirect to homepage
  "/members-area": "/",
  "/booking-calendar": "/train-and-stay",
}

// OckOck consumer surfaces. Internally they live under /ockock/* so they
// don't collide with Pai gym routes (Pai has its own /fighters etc. at
// the root). On ockock.app the middleware rewrites the clean URL onto
// the internal path; on muaythaipai.com it 301s the old /ockock/* URL
// over to the clean one on ockock.app. One list keeps both sides in sync.
const OCKOCK_CONSUMER_PATHS = [
  { clean: "/fights", internal: "/ockock/fights" },
  { clean: "/fighters", internal: "/ockock/fighters" },
  { clean: "/promoter", internal: "/ockock/promoter" },
] as const

// OckOck marketing pages that already render at clean root URLs via the
// (ockock) route group — no rewrite needed; we just 301 the
// muaythaipai.com host over to ockock.app so search engines and
// bookmarks converge there.
const OCKOCK_MARKETING_PATHS = [
  "/for-gyms",
  "/vision",
  "/terms",
  "/privacy",
] as const

// OckOck SaaS product surfaces — login, dashboards, onboarding, invites,
// magic-link callback. These only live on ockock.app. On muaythaipai.com
// they 301 over so the brand boundary is real: muaythaipai.com is the
// Pai gym + network site; ockock.app is the product. Putting auth on one
// host also keeps magic-link redirects self-contained (no more confusion
// from a shared Supabase project trying to bounce users between hosts).
const OCKOCK_PRODUCT_PATHS = [
  "/admin",
  "/trainer",
  "/student",
  "/onboarding",
  "/invite",
  "/auth/callback",
  "/platform-admin",
  "/signup",
  "/login",
] as const

function isOckOckProductPath(pathname: string): boolean {
  return OCKOCK_PRODUCT_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  )
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname.toLowerCase()
  const host = request.headers.get("host") ?? ""
  const onOckOckApp = host.endsWith("ockock.app")
  const onMuayThaiPai = host.endsWith("muaythaipai.com")

  // ────────────────────────────────────────────────────────────────────
  // ockock.app — the OckOck product domain
  // ────────────────────────────────────────────────────────────────────
  // Internally the OckOck consumer surfaces live under /ockock/* (so they
  // don't collide with Pai gym routes on muaythaipai.com). On ockock.app
  // we expose them at clean root URLs by rewriting incoming requests —
  // /fights stays in the address bar but Next renders /ockock/fights.
  // Update OCKOCK_CONSUMER_PATHS to add a new surface in one place; the
  // muaythaipai.com → ockock.app redirect below uses the same list.
  if (onOckOckApp) {
    // Homepage shows the gym-owner pitch.
    if (pathname === "/") {
      const url = request.nextUrl.clone()
      url.pathname = "/for-gyms"
      return NextResponse.rewrite(url)
    }
    for (const { clean, internal } of OCKOCK_CONSUMER_PATHS) {
      if (pathname === clean || pathname.startsWith(clean + "/")) {
        const url = request.nextUrl.clone()
        url.pathname = internal + pathname.slice(clean.length)
        return NextResponse.rewrite(url)
      }
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // muaythaipai.com — Pai gym domain; OckOck has moved out
  // ────────────────────────────────────────────────────────────────────
  // OckOck pages used to live here at /ockock/*, /for-gyms, /vision,
  // /terms, /privacy. Those URLs 301 over to ockock.app so search
  // engines + bookmarks converge on the new home. We deliberately leave
  // /pricing and /about alone here — the legacy Wix map below points
  // them at Pai's /classes and /gym, which is the right answer for a
  // visitor on muaythaipai.com who types those generic paths.
  if (onMuayThaiPai) {
    // /ockock/fights etc → /fights etc on ockock.app
    for (const { clean, internal } of OCKOCK_CONSUMER_PATHS) {
      if (pathname === internal || pathname.startsWith(internal + "/")) {
        const target = `https://ockock.app${clean}${pathname.slice(internal.length)}${request.nextUrl.search}`
        return NextResponse.redirect(target, 301)
      }
    }
    // /ockock (consumer hub landing) keeps its URL on the new host.
    if (pathname === "/ockock") {
      return NextResponse.redirect(`https://ockock.app/ockock${request.nextUrl.search}`, 301)
    }
    // Marketing pages — same path on both sides, just a host swap.
    if ((OCKOCK_MARKETING_PATHS as readonly string[]).includes(pathname)) {
      return NextResponse.redirect(`https://ockock.app${pathname}${request.nextUrl.search}`, 301)
    }
    // Product surfaces (login, dashboards, invites, auth callback) —
    // 301 to ockock.app so all auth stays on one host. Preserves the
    // path + query string, so magic-link callbacks (?code=...&next=...)
    // and ?redirect=... values arrive intact on the other side.
    if (isOckOckProductPath(pathname)) {
      return NextResponse.redirect(
        `https://ockock.app${pathname}${request.nextUrl.search}`,
        301,
      )
    }
  }

  // Paths owned by the OckOck product. On ockock.app these always
  // serve the OckOck route; we skip the legacy Pai gym redirects
  // below (e.g. /pricing → /classes was a legacy redirect from Wix
  // when "pricing" meant class rates; on ockock.app it's the OckOck
  // SaaS pricing page and the legacy redirect would hijack it).
  // Note: on muaythaipai.com the OckOck-branded paths above have
  // already been redirected to ockock.app, so this set is effectively
  // only used for ockock.app traffic + preview deployments.
  const isOckOckOwned =
    onOckOckApp || pathname.startsWith("/ockock/") || isOckOckProductPath(pathname)

  // Handle redirects first. Skip self-redirects so a stale entry can't
  // create an infinite 301 loop that takes the page down. Also skip
  // redirects for OckOck-owned paths so the legacy Wix map can't
  // hijack the new product pages.
  if (!isOckOckOwned) {
    const target = redirects[pathname]
    if (target && target !== pathname) {
      const url = request.nextUrl.clone()
      url.pathname = target
      return NextResponse.redirect(url, 301)
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
