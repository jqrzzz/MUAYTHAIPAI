import type { MetadataRoute } from "next"

const BASE_URL = "https://muaythaipai.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/student/",
          "/trainer/",
          "/platform-admin/",
          "/ockock/",
          "/onboarding/",
        ],
        crawlDelay: 1,
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
