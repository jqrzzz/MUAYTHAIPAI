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
  "/courses": "/certificate-programs",
  "/certification": "/certificate-programs",
  "/levels": "/certificate-programs",
  "/belts": "/certificate-programs",

  // Accommodation and packages
  "/stay": "/train-and-stay",
  "/packages": "/train-and-stay",
  "/stay-and-train": "/train-and-stay",
  "/booking": "/train-and-stay",
  "/book": "/train-and-stay",
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

  // FAQ and support
  "/faq": "/faq",
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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname.toLowerCase()

  // Handle redirects first
  if (redirects[pathname]) {
    const url = request.nextUrl.clone()
    url.pathname = redirects[pathname]
    return NextResponse.redirect(url, 301)
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
