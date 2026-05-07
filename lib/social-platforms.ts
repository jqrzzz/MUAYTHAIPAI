/**
 * Social platform definitions — the shape each platform accepts.
 *
 * Used by the composer (form fields), the AI generator (output schema),
 * and the queue UI (rendering platform-specific previews).
 */
import type { LucideIcon } from "lucide-react"
import { Facebook, Instagram, MessageSquare, Music2, Twitter } from "lucide-react"

export type Platform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "line_oa"
  | "threads"
  | "twitter"

export interface PlatformDef {
  id: Platform
  label: string
  icon: LucideIcon
  /** Tailwind color shorthand for the platform brand pill */
  color: string
  /** Soft max for caption / body. Soft = AI tries to stay under, UI warns if exceeded. */
  maxChars: number
  /** Whether the platform supports inline hashtags */
  supportsHashtags: boolean
  /** Whether the platform supports image attachments */
  supportsImages: boolean
}

export const PLATFORMS: Record<Platform, PlatformDef> = {
  instagram: {
    id: "instagram",
    label: "Instagram",
    icon: Instagram,
    color: "from-pink-500 to-purple-500",
    maxChars: 2200,
    supportsHashtags: true,
    supportsImages: true,
  },
  facebook: {
    id: "facebook",
    label: "Facebook",
    icon: Facebook,
    color: "from-blue-600 to-blue-700",
    maxChars: 5000,
    supportsHashtags: true,
    supportsImages: true,
  },
  tiktok: {
    id: "tiktok",
    label: "TikTok",
    icon: Music2,
    color: "from-zinc-200 to-zinc-400",
    maxChars: 2200,
    supportsHashtags: true,
    supportsImages: false,
  },
  line_oa: {
    id: "line_oa",
    label: "LINE OA",
    icon: MessageSquare,
    color: "from-emerald-500 to-emerald-600",
    maxChars: 1000,
    supportsHashtags: false,
    supportsImages: true,
  },
  threads: {
    id: "threads",
    label: "Threads",
    icon: MessageSquare,
    color: "from-zinc-300 to-zinc-500",
    maxChars: 500,
    supportsHashtags: true,
    supportsImages: true,
  },
  twitter: {
    id: "twitter",
    label: "X / Twitter",
    icon: Twitter,
    color: "from-zinc-100 to-zinc-300",
    maxChars: 280,
    supportsHashtags: true,
    supportsImages: true,
  },
}

export const PLATFORM_LIST: PlatformDef[] = Object.values(PLATFORMS)

export interface InstagramContent {
  caption?: string
  hashtags?: string[]
  image_urls?: string[]
  reel?: boolean
}

export interface FacebookContent {
  body?: string
  image_urls?: string[]
}

export interface TikTokContent {
  caption?: string
  hashtags?: string[]
}

export interface LineContent {
  body?: string
}

export interface ThreadsContent {
  body?: string
  image_urls?: string[]
}

export interface TwitterContent {
  body?: string
  image_urls?: string[]
}

export interface SocialPostContent {
  instagram?: InstagramContent
  facebook?: FacebookContent
  tiktok?: TikTokContent
  line_oa?: LineContent
  threads?: ThreadsContent
  twitter?: TwitterContent
}

export interface SocialPost {
  id: string
  org_id: string
  status: "draft" | "scheduled" | "published" | "archived"
  platforms: Platform[]
  content: SocialPostContent
  scheduled_for: string | null
  published_at: string | null
  source: "manual" | "ai_compose" | "ai_batch"
  source_intent: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

/**
 * Pull the displayable text for a post on a given platform. Falls back
 * across "caption", "body", etc. — used by the queue list to render a
 * one-line preview without knowing the platform.
 */
export function platformPreview(content: SocialPostContent, platform: Platform): string {
  const c = content[platform] as Record<string, unknown> | undefined
  if (!c) return ""
  const text = (c.caption || c.body || "") as string
  return text.slice(0, 120)
}
