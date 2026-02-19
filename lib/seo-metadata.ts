// Centralized SEO Metadata Management System
// This file provides a single source of truth for all page metadata

export interface PageMetadata {
  title: string
  description: string
  keywords: string[] | string
  canonical?: string
  openGraph: {
    title: string
    description: string
    url: string
    images?: Array<{
      url: string
      width: number
      height: number
      alt: string
    }>
    type?: string
    locale?: string
  }
  twitter: {
    card: "summary" | "summary_large_image" | "app" | "player"
    title: string
    description: string
    images?: string[]
    creator?: string
    site?: string
  }
  robots?: string
  alternates?: {
    canonical: string
    languages?: Record<string, string>
  }
}

// Global site metadata (inherited by all pages)
export const SITE_METADATA = {
  siteName: "Muay Thai Pai",
  siteUrl: "https://muaythaipai.com",
  defaultImage: "/images/muay-thai-logo-og.png",
  twitterHandle: "@muaythaipai", // Update if Twitter account exists
  ogType: "website",
  locale: "en_US",
}

// Page-specific metadata
export const PAGE_METADATA: Record<string, PageMetadata> = {
  home: {
    title: "Muay Thai Pai | Traditional Thai Boxing Training in Pai, Thailand",
    description:
      "Train authentic Muay Thai with Kru Wisarut at Muay Thai Pai. Third-generation family gym featured in National Geographic. Traditional training, accommodation, and certification programs in Pai, Thailand.",
    keywords:
      "muay thai pai, thai boxing pai, muay thai thailand, traditional muay thai, kru wisarut, muay thai training, pai thailand gym, authentic muay thai",
    openGraph: {
      title: "Muay Thai Pai | Traditional Thai Boxing Training in Pai, Thailand",
      description:
        "Train authentic Muay Thai with Kru Wisarut at Muay Thai Pai. Third-generation family gym featured in National Geographic.",
      url: `${SITE_METADATA.siteUrl}`,
      images: [
        {
          url: "/images/pai-hero-main.jpeg",
          width: 1200,
          height: 630,
          alt: "Muay Thai Pai - Traditional Thai Boxing Gym in the mountains of Northern Thailand",
        },
      ],
      type: "website",
      locale: SITE_METADATA.locale,
    },
    twitter: {
      card: "summary_large_image",
      title: "Muay Thai Pai | Traditional Thai Boxing Training",
      description: "Train authentic Muay Thai with Kru Wisarut in Pai, Thailand. Featured in National Geographic.",
      images: ["/images/pai-hero-main.jpeg"],
    },
  },

  classes: {
    title: "Muay Thai Classes & Schedule | Training Programs in Pai",
    description:
      "Flexible Muay Thai training schedule at Muay Thai Pai. Morning and afternoon sessions, private training, beginner to advanced classes. Train traditional Thai boxing in Pai, Thailand.",
    keywords:
      "muay thai classes, muay thai schedule, thai boxing training, muay thai sessions pai, private muay thai lessons, group training pai",
    openGraph: {
      title: "Muay Thai Classes & Schedule | Training Programs in Pai",
      description:
        "Flexible training schedule with morning and afternoon Muay Thai sessions. Private and group classes available.",
      url: `${SITE_METADATA.siteUrl}/classes`,
      images: [
        {
          url: "/images/group-training-pads.jpeg",
          width: 1200,
          height: 630,
          alt: "Muay Thai group training session with pads at Muay Thai Pai",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Muay Thai Classes in Pai, Thailand",
      description: "Morning and afternoon training sessions. Private and group classes for all levels.",
      images: ["/images/group-training-pads.jpeg"],
    },
  },

  fighters: {
    title: "Muay Thai Fighters | Active & Retired Champions from Pai",
    description:
      "Meet the fighters of Muay Thai Pai. Active competitors and retired champions from our third-generation family gym in Pai, Thailand.",
    keywords:
      "muay thai fighters pai, thai boxing champions, kru wisarut fighters, muay thai gym fighters, thai boxers pai",
    openGraph: {
      title: "Muay Thai Fighters | Champions from Muay Thai Pai",
      description: "Meet our active and retired Muay Thai fighters from the Wisarut family gym in Pai, Thailand.",
      url: `${SITE_METADATA.siteUrl}/fighters`,
      images: [
        {
          url: "/images/fighters-slideshow/group-ringside.jpeg",
          width: 1200,
          height: 630,
          alt: "Muay Thai fighters from Muay Thai Pai gym ringside",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Meet Our Muay Thai Fighters",
      description: "Active and retired champions from the Wisarut family gym in Pai.",
      images: ["/images/fighters-slideshow/group-ringside.jpeg"],
    },
  },

  gym: {
    title: "About Muay Thai Pai | Third-Generation Family Gym in Thailand",
    description:
      "Meet Kru Wisarut and the Muay Thai Pai family. Featured in National Geographic, our third-generation gym preserves traditional Thai boxing culture in Pai, Thailand since 1975.",
    keywords:
      "kru wisarut, muay thai pai gym, traditional muay thai gym, national geographic muay thai, family muay thai gym thailand, pai gym history",
    openGraph: {
      title: "About Muay Thai Pai | Third-Generation Family Gym",
      description:
        "Meet Kru Wisarut and the family behind Muay Thai Pai. Featured in National Geographic, preserving traditional Muay Thai since 1975.",
      url: `${SITE_METADATA.siteUrl}/gym`,
      images: [
        {
          url: "/images/gym-exterior.jpeg",
          width: 1200,
          height: 630,
          alt: "Muay Thai Pai gym exterior in Pai, Thailand",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "About Muay Thai Pai Gym",
      description: "Third-generation family gym featured in National Geographic.",
      images: ["/images/gym-exterior.jpeg"],
    },
  },

  certificatePrograms: {
    title: "Muay Thai Certificate Programs | 5 Levels of Mastery",
    description:
      "Earn official Muay Thai certifications at Muay Thai Pai. Five progressive levels from Naga to Garuda, each with authentic Thai recognition and traditional training.",
    keywords: [
      "Muay Thai certification",
      "Muay Thai courses Thailand",
      "Muay Thai training programs",
      "Thai boxing certificate",
      "Pai Thailand training",
    ],
    openGraph: {
      title: "Muay Thai Certificate Programs | 5 Levels of Mastery",
      description: "Earn official certifications through our 5-level progressive Muay Thai program in Pai, Thailand.",
      url: `${SITE_METADATA.siteUrl}/certificate-programs`,
      images: [
        {
          url: "/images/naga-certificate.png",
          width: 1200,
          height: 630,
          alt: "Muay Thai certification programs at Muay Thai Pai",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Muay Thai Certification Programs",
      description: "5 progressive levels of authentic Muay Thai certification.",
      images: ["/images/naga-certificate.png"],
    },
  },

  apprenticeship: {
    title: "Muay Thai Apprenticeship Program | Live & Train in Pai",
    description:
      "Join the Muay Thai Pai apprenticeship program. Live and train with the Wisarut Family for 6-12 months in authentic traditional Muay Thai immersion.",
    keywords: [
      "Muay Thai apprenticeship",
      "Live-in Muay Thai training",
      "Thailand martial arts apprenticeship",
      "Pai Muay Thai program",
    ],
    openGraph: {
      title: "Muay Thai Apprenticeship | Live & Train in Pai",
      description: "6-12 month immersive apprenticeship with the Wisarut family. Live and breathe Muay Thai.",
      url: `${SITE_METADATA.siteUrl}/apprenticeship`,
      images: [
        {
          url: "/images/apprentice-training.jpeg",
          width: 1200,
          height: 630,
          alt: "Muay Thai apprenticeship training at Muay Thai Pai",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Muay Thai Apprenticeship Program",
      description: "Live and train with the Wisarut family for 6-12 months.",
      images: ["/images/apprentice-training.jpeg"],
    },
  },

  trainAndStay: {
    title: "Train & Stay | Accommodation Near Muay Thai Pai",
    description:
      "Find the perfect accommodation near Muay Thai Pai gym in Pai, Thailand. Recommended hostels, resorts, and guesthouses within walking distance.",
    keywords: [
      "Pai accommodation",
      "Muay Thai training accommodation",
      "Pai Thailand hostels",
      "Stay near Muay Thai gym",
    ],
    openGraph: {
      title: "Train & Stay | Accommodation in Pai",
      description: "Recommended places to stay near Muay Thai Pai gym. Hostels, resorts, and guesthouses.",
      url: `${SITE_METADATA.siteUrl}/train-and-stay`,
      images: [
        {
          url: "/images/society-house-hostel.png",
          width: 1200,
          height: 630,
          alt: "Recommended accommodation near Muay Thai Pai gym",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Accommodation Near Muay Thai Pai",
      description: "Find the perfect place to stay while training in Pai.",
      images: ["/images/society-house-hostel.png"],
    },
  },

  educationVisas: {
    title: "Education Visas for Muay Thai Training | Thailand Visa Guide",
    description:
      "Learn about visa options for training Muay Thai in Thailand. Student visas, digital nomad visas, and long-term stay options for Muay Thai students.",
    keywords: [
      "Thailand visa",
      "Education visa Thailand",
      "Muay Thai visa",
      "Student visa Thailand",
      "Digital nomad visa",
    ],
    openGraph: {
      title: "Education Visas | Train Muay Thai in Thailand Legally",
      description: "Comprehensive guide to visa options for Muay Thai training in Thailand.",
      url: `${SITE_METADATA.siteUrl}/education-visas`,
      images: [
        {
          url: "/images/thailand-visa-guide.jpeg",
          width: 1200,
          height: 630,
          alt: "Thailand education visa information for Muay Thai training",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Thailand Visa Guide for Muay Thai",
      description: "Everything you need to know about visas for training in Thailand.",
      images: ["/images/thailand-visa-guide.jpeg"],
    },
  },

  paiThailand: {
    title: "About Pai, Thailand | Your Guide to This Mountain Paradise",
    description:
      "Discover Pai, Thailand - where adventure meets serenity. Explore food, wellness, culture, and nature in this beautiful mountain town near our Muay Thai gym.",
    keywords: [
      "Pai Thailand",
      "Pai travel guide",
      "Pai attractions",
      "Northern Thailand",
      "Mae Hong Son",
      "Pai nature",
      "Pai culture",
    ],
    openGraph: {
      title: "About Pai, Thailand | Mountain Paradise",
      description: "Explore Pai's food, culture, wellness, and natural beauty. The perfect place to train Muay Thai.",
      url: `${SITE_METADATA.siteUrl}/pai-thailand`,
      images: [
        {
          url: "/images/pai-slideshow/rainbow-field.jpeg",
          width: 1200,
          height: 630,
          alt: "Beautiful Pai, Thailand mountain scenery",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Discover Pai, Thailand",
      description: "Mountain paradise in Northern Thailand. Where adventure meets serenity.",
      images: ["/images/pai-slideshow/rainbow-field.jpeg"],
    },
  },

  blog: {
    title: "Muay Thai Blog | Training Tips, Stories & Thai Culture",
    description:
      "Read stories, training tips, and insights from the Muay Thai Pai family. Articles about Muay Thai technique, Thai culture, and life in Pai.",
    keywords: ["Muay Thai blog", "Thai boxing articles", "Pai Thailand stories", "Muay Thai training tips"],
    openGraph: {
      title: "Muay Thai Blog | Stories from Pai",
      description: "Training tips, cultural insights, and stories from the Wisarut family gym.",
      url: `${SITE_METADATA.siteUrl}/blog`,
      images: [
        {
          url: "/images/blog-header.jpeg",
          width: 1200,
          height: 630,
          alt: "Muay Thai Pai blog - Training tips and cultural stories",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Muay Thai Pai Blog",
      description: "Training tips, stories, and insights from Pai, Thailand.",
      images: ["/images/blog-header.jpeg"],
    },
  },

  faq: {
    title: "FAQ | Frequently Asked Questions | Muay Thai Pai",
    description:
      "Frequently asked questions about Muay Thai Pai. Training programs, pricing, visas, accommodation, and everything you need to know about training in Pai, Thailand.",
    keywords: [
      "Muay Thai FAQ",
      "Pai Thailand training questions",
      "Muay Thai visa questions",
      "Training costs Thailand",
    ],
    openGraph: {
      title: "FAQ | Muay Thai Pai",
      description: "Your questions answered. Training programs, visas, pricing, and more.",
      url: `${SITE_METADATA.siteUrl}/faq`,
      images: [
        {
          url: "/images/faq-header.jpeg",
          width: 1200,
          height: 630,
          alt: "Muay Thai Pai frequently asked questions",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Muay Thai Pai FAQ",
      description: "Everything you need to know about training in Pai, Thailand.",
      images: ["/images/faq-header.jpeg"],
    },
  },

  careers: {
    title: "Careers | Join the Muay Thai Pai Team",
    description:
      "Join the Muay Thai Pai family. Opportunities for instructors, staff, and passionate individuals who want to share authentic Muay Thai with the world.",
    keywords: ["Muay Thai jobs", "Trainer positions Pai", "Work at Muay Thai gym", "Careers Thailand"],
    openGraph: {
      title: "Careers at Muay Thai Pai",
      description: "Join our team and help share authentic Muay Thai with students from around the world.",
      url: `${SITE_METADATA.siteUrl}/careers`,
      images: [
        {
          url: "/images/team-photo.jpeg",
          width: 1200,
          height: 630,
          alt: "Muay Thai Pai team and instructors",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Join Muay Thai Pai",
      description: "Career opportunities at our traditional Muay Thai gym in Pai.",
      images: ["/images/team-photo.jpeg"],
    },
  },

  contact: {
    title: "Contact Muay Thai Pai | Book Training & Get in Touch",
    description:
      "Get in touch with Muay Thai Pai. Book your training sessions, ask questions, or plan your visit to our gym in Pai, Thailand.",
    keywords: ["Contact Muay Thai Pai", "Book Muay Thai training", "Pai Thailand gym contact"],
    openGraph: {
      title: "Contact Muay Thai Pai",
      description: "Book training, ask questions, or plan your visit. We're here to help.",
      url: `${SITE_METADATA.siteUrl}/contact`,
      images: [
        {
          url: "/images/contact-gym.jpeg",
          width: 1200,
          height: 630,
          alt: "Contact Muay Thai Pai - Get in touch with our gym",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Contact Muay Thai Pai",
      description: "Book training or get in touch with our team in Pai, Thailand.",
      images: ["/images/contact-gym.jpeg"],
    },
  },

  privacyPolicy: {
    title: "Privacy Policy | Muay Thai Pai",
    description: "Privacy policy for Muay Thai Pai. How we collect, use, and protect your personal information.",
    keywords: ["privacy policy", "data protection", "Muay Thai Pai privacy"],
    openGraph: {
      title: "Privacy Policy | Muay Thai Pai",
      description: "How we handle your personal information.",
      url: `${SITE_METADATA.siteUrl}/privacy-policy`,
    },
    twitter: {
      card: "summary",
      title: "Privacy Policy | Muay Thai Pai",
      description: "How we handle your personal information.",
    },
    robots: "noindex, nofollow",
  },

  termsConditions: {
    title: "Terms & Conditions | Muay Thai Pai",
    description: "Terms and conditions for using Muay Thai Pai services and website.",
    keywords: ["terms and conditions", "terms of service", "Muay Thai Pai terms"],
    openGraph: {
      title: "Terms & Conditions | Muay Thai Pai",
      description: "Terms for using our services.",
      url: `${SITE_METADATA.siteUrl}/terms-conditions`,
    },
    twitter: {
      card: "summary",
      title: "Terms & Conditions | Muay Thai Pai",
      description: "Terms for using our services.",
    },
    robots: "noindex, nofollow",
  },

  login: {
    title: "Login | Muay Thai Pai",
    description: "Login to your Muay Thai Pai account",
    keywords: ["login", "account", "sign in"],
    openGraph: {
      title: "Login | Muay Thai Pai",
      description: "Access your account",
      url: `${SITE_METADATA.siteUrl}/login`,
    },
    twitter: {
      card: "summary",
      title: "Login | Muay Thai Pai",
      description: "Access your account",
    },
    robots: "noindex, nofollow",
  },
}

// Helper function to get metadata for a page
export function getPageMetadata(pageName: keyof typeof PAGE_METADATA): PageMetadata {
  return PAGE_METADATA[pageName]
}

// Helper to generate full URLs
export function getFullUrl(path: string): string {
  return `${SITE_METADATA.siteUrl}${path}`
}
