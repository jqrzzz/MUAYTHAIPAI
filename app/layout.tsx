import type React from "react"
import "./globals.css"
import { Cinzel } from "next/font/google"
import Script from "next/script"
import { ThemeProvider } from "@/components/theme-provider"
import type { Metadata, Viewport } from "next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/react"
import { SOCIAL_LINKS } from "@/lib/socials"
import OckOckChatWidget from "@/components/public/ockock-chat-widget"

const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#f97316",
}

export const metadata: Metadata = {
  metadataBase: new URL("https://muaythaipai.com"),
  title: "Muay Thai Pai | Authentic Training in Thailand",
  description:
    "Experience authentic Muay Thai training in Pai, Thailand with the legendary Wisarut Family. Traditional techniques, modern facilities, and immersive cultural experience in the heart of Northern Thailand.",
  keywords:
    "Muay Thai, Thai Boxing, Pai Thailand, Martial Arts Training, Wisarut Family, Traditional Muay Thai, Thailand Training Camp, Authentic Thai Boxing, Muay Thai Classes, Fight Training",
  authors: [{ name: "Wisarut Family" }],
  creator: "Muay Thai Pai",
  publisher: "Wisarut Family Gym",
  robots: "index, follow",
  alternates: {
    canonical: "https://muaythaipai.com",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://muaythaipai.com",
    title: "Muay Thai Pai | Authentic Training in Thailand",
    description: "Experience authentic Muay Thai training in Pai, Thailand with the legendary Wisarut Family.",
    siteName: "Muay Thai Pai",
    images: [
      {
        url: "/images/pai-hero-main.jpeg",
        width: 1200,
        height: 630,
        alt: "Muay Thai Pai - Traditional Muay Thai training with the Wisarut Family in Pai, Thailand",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Muay Thai Pai | Authentic Training in Thailand",
    description: "Experience authentic Muay Thai training in Pai, Thailand with the legendary Wisarut Family.",
    images: ["/images/pai-hero-main.jpeg"],
  },
  verification: {
    google: "7ZBHOghQ2JU9BhnOmTuC2hcJY52ZQg78UwNzFL3HNqQ", // Updated to new Google verification code
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "icon", url: "/favicon.ico" }],
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://www.youtube-nocookie.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />

        {/* Organization Schema - Tells Google exactly who you are */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Muay Thai Pai",
              alternateName: "Wisarut Family Gym",
              url: "https://muaythaipai.com",
              logo: "https://muaythaipai.com/images/muay-thai-logo-og.png",
              description:
                "Third-generation family-owned Muay Thai gym in Pai, Thailand, offering authentic traditional training",
              foundingDate: "1990",
              founder: {
                "@type": "Person",
                name: "Wisarut Family",
              },
              address: {
                "@type": "PostalAddress",
                streetAddress: "Pai District",
                addressLocality: "Pai",
                addressRegion: "Mae Hong Son",
                postalCode: "58130",
                addressCountry: "TH",
              },
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer service",
                availableLanguage: ["English", "Thai"],
                email: "help@muaythaipai.com",
              },
            }),
          }}
        />

        {/* LocalBusiness Schema - Better for map display in Google/Bing */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SportsActivityLocation",
              "@id": "https://muaythaipai.com/#gym",
              name: "Muay Thai Pai - Wisarut Family Gym",
              description:
                "Authentic Muay Thai training gym in Pai, Thailand, run by the legendary Wisarut Family. Third-generation masters teaching traditional Thai boxing.",
              url: "https://muaythaipai.com",
              email: "help@muaythaipai.com",
              image: [
                "https://muaythaipai.com/images/muay-thai-logo-og.png",
                "https://muaythaipai.com/images/gym-exterior.jpeg",
                "https://muaythaipai.com/images/group-training-pads.jpeg",
              ],
              address: {
                "@type": "PostalAddress",
                streetAddress: "Pai District",
                addressLocality: "Pai",
                addressRegion: "Mae Hong Son",
                postalCode: "58130",
                addressCountry: "TH",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: 19.3617,
                longitude: 98.4403,
              },
              hasMap: SOCIAL_LINKS.maps,
              openingHoursSpecification: [
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                  opens: "07:00",
                  closes: "18:00",
                },
              ],
              priceRange: "$$",
              currenciesAccepted: "THB, USD",
              paymentAccepted: "Cash, Credit Card, Stripe",
              sport: "Muay Thai",
              amenityFeature: [
                {
                  "@type": "LocationFeatureSpecification",
                  name: "Traditional Muay Thai Training",
                  value: true,
                },
                {
                  "@type": "LocationFeatureSpecification",
                  name: "Professional Instruction",
                  value: true,
                },
                {
                  "@type": "LocationFeatureSpecification",
                  name: "All Equipment Provided",
                  value: true,
                },
                {
                  "@type": "LocationFeatureSpecification",
                  name: "Group Classes",
                  value: true,
                },
                {
                  "@type": "LocationFeatureSpecification",
                  name: "Private Lessons",
                  value: true,
                },
                {
                  "@type": "LocationFeatureSpecification",
                  name: "Kids Classes",
                  value: true,
                },
              ],
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                reviewCount: "86",
                bestRating: "5",
                worstRating: "1",
              },
              sameAs: [SOCIAL_LINKS.instagram, SOCIAL_LINKS.facebook, SOCIAL_LINKS.tripAdvisor],
            }),
          }}
        />
      </head>
      <body className={`${cinzel.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <OckOckChatWidget orgSlug="wisarut-family-gym" />
        </ThemeProvider>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-KM47GH0T7J"
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-KM47GH0T7J', { page_path: window.location.pathname });
          `}
        </Script>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
