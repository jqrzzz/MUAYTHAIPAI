/**
 * Gym website section types.
 *
 * Each section is a discriminated union by `type`. The editor + the
 * public renderer + the AI tool layer all share these definitions so
 * adding a section type is a single-file change.
 */

export type SectionType =
  | "hero"
  | "about"
  | "hours"
  | "contact"
  | "classes"
  | "trainers"
  | "photos"
  | "testimonials"
  | "cta"
  | "rich_text"

export interface HeroSection {
  id: string
  type: "hero"
  props: {
    title: string
    subtitle?: string
    image_url?: string | null
    cta_label?: string | null
    cta_href?: string | null
    overlay?: "dark" | "light" | "none"
  }
}

export interface AboutSection {
  id: string
  type: "about"
  props: {
    heading?: string
    body: string
    image_url?: string | null
    image_position?: "left" | "right"
  }
}

export interface HoursSection {
  id: string
  type: "hours"
  props: {
    heading?: string
    /** Map of weekday → "open-close" string or "closed". null = use organization_settings.operating_hours */
    overrides?: Record<string, string | "closed"> | null
  }
}

export interface ContactSection {
  id: string
  type: "contact"
  props: {
    heading?: string
    show_address?: boolean
    show_phone?: boolean
    show_email?: boolean
    show_socials?: boolean
    map_embed_url?: string | null
  }
}

export interface ClassesSection {
  id: string
  type: "classes"
  props: {
    heading?: string
    subtitle?: string
    /** When true, only show services with show_on_website=true */
    featured_only?: boolean
  }
}

export interface TrainersSection {
  id: string
  type: "trainers"
  props: {
    heading?: string
    subtitle?: string
  }
}

export interface PhotosSection {
  id: string
  type: "photos"
  props: {
    heading?: string
    layout?: "grid" | "carousel"
    image_urls: string[]
  }
}

export interface TestimonialsSection {
  id: string
  type: "testimonials"
  props: {
    heading?: string
    items: Array<{
      quote: string
      author: string
      meta?: string
    }>
  }
}

export interface CtaSection {
  id: string
  type: "cta"
  props: {
    heading: string
    body?: string
    primary_label: string
    primary_href: string
    secondary_label?: string
    secondary_href?: string
  }
}

export interface RichTextSection {
  id: string
  type: "rich_text"
  props: {
    heading?: string
    /** Plain text. Line breaks preserved. Markdown later. */
    body: string
  }
}

export type WebsiteSection =
  | HeroSection
  | AboutSection
  | HoursSection
  | ContactSection
  | ClassesSection
  | TrainersSection
  | PhotosSection
  | TestimonialsSection
  | CtaSection
  | RichTextSection

export interface WebsiteTheme {
  primary_color?: string
  accent_color?: string
  font?: "inter" | "cinzel" | "system"
  logo_url?: string | null
  favicon_url?: string | null
  hero_image_url?: string | null
}

export interface GymWebsite {
  id: string
  org_id: string
  status: "draft" | "published" | "archived"
  sections: WebsiteSection[]
  theme: WebsiteTheme
  seo_title?: string | null
  seo_description?: string | null
  seo_image_url?: string | null
  created_at: string
  updated_at: string
  published_at?: string | null
}

/**
 * Default sections for a brand-new gym website. These get inserted on
 * first edit if no row exists yet, so the operator never starts at a
 * blank page — they always have a working draft to refine.
 */
export function defaultSections(args: {
  gymName: string
  city?: string | null
  description?: string | null
}): WebsiteSection[] {
  const { gymName, city, description } = args
  const newId = () => Math.random().toString(36).slice(2, 10)
  return [
    {
      id: newId(),
      type: "hero",
      props: {
        title: gymName,
        subtitle: city
          ? `Authentic Muay Thai training in ${city}`
          : "Authentic Muay Thai training",
        image_url: null,
        cta_label: "Book a session",
        cta_href: `/book?gym=${gymName.toLowerCase().replace(/\s+/g, "-")}`,
        overlay: "dark",
      },
    },
    {
      id: newId(),
      type: "about",
      props: {
        heading: "About us",
        body:
          description ||
          `Welcome to ${gymName}. We train with discipline, respect, and the spirit of Muay Thai. Whether you're a complete beginner or training for a fight, we'll meet you where you are.`,
      },
    },
    {
      id: newId(),
      type: "classes",
      props: {
        heading: "What we offer",
        subtitle: "Daily training, private lessons, and certification programs",
        featured_only: false,
      },
    },
    {
      id: newId(),
      type: "hours",
      props: {
        heading: "Training hours",
        overrides: null,
      },
    },
    {
      id: newId(),
      type: "contact",
      props: {
        heading: "Visit us",
        show_address: true,
        show_phone: true,
        show_email: true,
        show_socials: true,
      },
    },
    {
      id: newId(),
      type: "cta",
      props: {
        heading: "Train with us",
        body: "Your first session is on us. Book now.",
        primary_label: "Book a session",
        primary_href: `/book?gym=${gymName.toLowerCase().replace(/\s+/g, "-")}`,
      },
    },
  ]
}

export function newSectionId(): string {
  return Math.random().toString(36).slice(2, 10)
}
