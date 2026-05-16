import type { MetadataRoute } from "next"

const BASE_URL = "https://muaythaipai.com"

// Routes that should never be crawled. Includes authenticated
// dashboards (admin / trainer / student / platform-admin / onboarding)
// and /api endpoints. The PUBLIC product surfaces under /ockock are
// allowed — those are the consumer pages (fights, fighters, verify,
// passport) that we explicitly want AI engines + search engines to
// surface for tourists searching "Muay Thai certification Thailand."
//
// Promoter dashboard paths are authenticated; the page redirects to
// login for unauthed users, so leaving them crawlable just means search
// engines see a login redirect — harmless. We list both /promoter/
// (the clean URL on ockock.app) and /ockock/promoter/ (the legacy
// muaythaipai.com URL that 301s away) so the disallow holds wherever
// this robots.txt is served.
const DISALLOWED = [
  "/admin/",
  "/api/",
  "/student/",
  "/trainer/",
  "/platform-admin/",
  "/onboarding/",
  "/promoter/",
  "/ockock/promoter/",
]

// LLM / AI crawlers we explicitly welcome. Listed so they can be
// uncommented if Anthropic or OpenAI ever ship a more restrictive
// default. Right now they all crawl unless told no — but being
// explicit is a clean signal to engineering teams reviewing logs.
const AI_CRAWLERS = [
  "GPTBot", // OpenAI's web crawler — feeds ChatGPT browsing + GPT-4 training data
  "OAI-SearchBot", // ChatGPT's search-grounding bot
  "ChatGPT-User", // OpenAI's "Browse with Bing" / ChatGPT actions
  "ClaudeBot", // Anthropic's web crawler
  "Claude-Web", // Anthropic's older bot name (legacy)
  "anthropic-ai", // Anthropic training crawler
  "PerplexityBot", // Perplexity
  "Perplexity-User", // Perplexity user-triggered fetches
  "Google-Extended", // Gemini training data
  "CCBot", // Common Crawl — most LLMs pretrain on this
  "Applebot-Extended", // Apple Intelligence
  "Bytespider", // ByteDance (Doubao)
  "DuckAssistBot", // DuckDuckGo's AI assist
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default rule for all bots — including search engines.
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED,
        crawlDelay: 1,
      },
      // Explicit allow rules for AI crawlers. Same disallow list as
      // the default, but stating it explicitly signals intent and
      // makes the policy obvious in server access logs.
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOWED,
      })),
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
