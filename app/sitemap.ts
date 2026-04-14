import type { MetadataRoute } from "next"

const BASE_URL = "https://muaythaipai.com"

type Route = {
  path: string
  changeFrequency: "weekly" | "monthly" | "yearly"
  priority: number
}

// Public marketing routes. Admin, trainer, student, ockock, and api routes are
// intentionally excluded — they're either authenticated flows or not part of the
// gym's public site.
const routes: Route[] = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/classes", changeFrequency: "monthly", priority: 0.9 },
  { path: "/gym", changeFrequency: "monthly", priority: 0.8 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.8 },
  { path: "/fighters", changeFrequency: "monthly", priority: 0.8 },
  { path: "/certificate-programs", changeFrequency: "monthly", priority: 0.7 },
  { path: "/apprenticeship", changeFrequency: "monthly", priority: 0.7 },
  { path: "/train-and-stay", changeFrequency: "monthly", priority: 0.7 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.7 },
  { path: "/pai-thailand", changeFrequency: "monthly", priority: 0.6 },
  { path: "/education-visas", changeFrequency: "monthly", priority: 0.6 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
  { path: "/careers", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms-conditions", changeFrequency: "yearly", priority: 0.3 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }))
}
