/**
 * Public renderer for a gym's dynamic website (sections + theme).
 *
 * Server component — runs on the public /gyms/[slug] route. Pulls the
 * gym's services + trainers + hours so sections like "classes" /
 * "trainers" / "hours" can render without separate fetches inside the
 * client.
 *
 * Theme: primary_color drives the accent across hero CTA, links, and
 * any "primary" buttons. We use CSS custom properties so tailwind
 * classes can hook into them.
 */
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  Calendar,
  Globe,
  Instagram,
  Facebook,
  Mail,
  MapPin,
  Phone,
} from "lucide-react"
import type {
  WebsiteSection,
  WebsiteTheme,
  HeroSection,
  AboutSection,
  HoursSection,
  ContactSection,
  ClassesSection,
  TrainersSection,
  PhotosSection,
  TestimonialsSection,
  CtaSection,
  RichTextSection,
} from "@/lib/website-sections"

interface Service {
  id: string
  name: string
  description: string | null
  duration_minutes: number | null
  price_thb: number | null
  category: string | null
}

interface Trainer {
  id: string
  display_name: string | null
  bio: string | null
  image_url: string | null
  specialties?: string[] | null
}

interface OrgInfo {
  name: string
  slug: string | null
  city: string | null
  province: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  instagram: string | null
  facebook: string | null
  website: string | null
}

interface DynamicWebsiteProps {
  org: OrgInfo
  sections: WebsiteSection[]
  theme: WebsiteTheme
  services: Service[]
  trainers: Trainer[]
  operatingHours: Record<string, { open: string; close: string }> | null
  isPreview: boolean
}

export default function DynamicWebsite({
  org,
  sections,
  theme,
  services,
  trainers,
  operatingHours,
  isPreview,
}: DynamicWebsiteProps) {
  const primary = theme.primary_color || "#f97316" // warm orange default
  const fontClass =
    theme.font === "inter"
      ? "font-inter"
      : theme.font === "system"
        ? ""
        : "font-sans" // Cinzel via existing var

  return (
    <div
      className={`min-h-screen bg-neutral-950 text-white ${fontClass} antialiased`}
      style={{
        // CSS variables consumed by section components below
        ["--gym-primary" as string]: primary,
      }}
    >
      {isPreview && (
        <div className="bg-amber-500/15 text-amber-200 border-b border-amber-500/30 text-[12px] py-2 px-4 text-center">
          Preview mode — visitors don&apos;t see this until you publish.
        </div>
      )}
      {sections.length === 0 ? (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-neutral-400 text-sm">
              {org.name} hasn&apos;t set up their website yet.
            </p>
          </div>
        </div>
      ) : (
        sections.map((section) => (
          <SectionRenderer
            key={section.id}
            section={section}
            org={org}
            services={services}
            trainers={trainers}
            operatingHours={operatingHours}
            theme={theme}
          />
        ))
      )}
      <SiteFooter org={org} theme={theme} />
    </div>
  )
}

function SectionRenderer({
  section,
  org,
  services,
  trainers,
  operatingHours,
  theme,
}: {
  section: WebsiteSection
  org: OrgInfo
  services: Service[]
  trainers: Trainer[]
  operatingHours: Record<string, { open: string; close: string }> | null
  theme: WebsiteTheme
}) {
  switch (section.type) {
    case "hero":
      return <HeroBlock section={section} org={org} theme={theme} />
    case "about":
      return <AboutBlock section={section} />
    case "hours":
      return <HoursBlock section={section} operatingHours={operatingHours} />
    case "contact":
      return <ContactBlock section={section} org={org} />
    case "classes":
      return <ClassesBlock section={section} services={services} org={org} />
    case "trainers":
      return <TrainersBlock section={section} trainers={trainers} />
    case "photos":
      return <PhotosBlock section={section} />
    case "testimonials":
      return <TestimonialsBlock section={section} />
    case "cta":
      return <CtaBlock section={section} />
    case "rich_text":
      return <RichTextBlock section={section} />
    default:
      return null
  }
}

/* ─── section components ─────────────────────────────────────────── */

function HeroBlock({
  section,
  org,
  theme,
}: {
  section: HeroSection
  org: OrgInfo
  theme: WebsiteTheme
}) {
  const { title, subtitle, image_url, cta_label, cta_href, overlay = "dark" } = section.props
  const heroImage = image_url || theme.hero_image_url
  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      {heroImage && (
        <>
          <Image
            src={heroImage}
            alt={title}
            fill
            priority
            className="object-cover"
          />
          {overlay === "dark" && (
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/30" />
          )}
          {overlay === "light" && (
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 to-neutral-950/40" />
          )}
        </>
      )}
      {!heroImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900" />
      )}
      <div className="relative max-w-5xl mx-auto px-5 py-20 md:py-28">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/70 mb-3">
          {org.city ? `${org.city}, Thailand` : "Thailand"}
        </p>
        <h1 className="text-[40px] md:text-[64px] font-bold tracking-tight leading-[1.05] max-w-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[16px] md:text-[20px] text-white/80 max-w-2xl mt-4 leading-relaxed">
            {subtitle}
          </p>
        )}
        {cta_label && cta_href && (
          <div className="mt-8">
            <Link
              href={cta_href}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-medium text-white text-[14px] transition-transform hover:scale-[1.02] shadow-lg"
              style={{ backgroundColor: "var(--gym-primary)" }}
            >
              {cta_label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

function AboutBlock({ section }: { section: AboutSection }) {
  const { heading, body, image_url, image_position = "right" } = section.props
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-5">
        <div className={`grid gap-8 md:gap-12 ${image_url ? "md:grid-cols-2" : ""} items-center`}>
          <div className={image_url && image_position === "left" ? "md:order-2" : ""}>
            {heading && (
              <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight mb-4">
                {heading}
              </h2>
            )}
            <div className="text-[15px] md:text-[16px] text-neutral-300 leading-relaxed whitespace-pre-wrap">
              {body}
            </div>
          </div>
          {image_url && (
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image src={image_url} alt={heading || ""} fill className="object-cover" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function HoursBlock({
  section,
  operatingHours,
}: {
  section: HoursSection
  operatingHours: Record<string, { open: string; close: string }> | null
}) {
  const { heading } = section.props
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const
  const labels: Record<string, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  }
  return (
    <section className="py-16 md:py-20 bg-neutral-900/30">
      <div className="max-w-3xl mx-auto px-5">
        <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight mb-6">
          {heading || "Training hours"}
        </h2>
        {!operatingHours || Object.keys(operatingHours).length === 0 ? (
          <p className="text-neutral-400 text-[14px]">
            Hours not set yet. Contact us to confirm.
          </p>
        ) : (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 divide-y divide-neutral-800/60">
            {days.map((day) => {
              const hours = operatingHours[day]
              return (
                <div
                  key={day}
                  className="flex items-center justify-between px-5 py-3.5"
                >
                  <span className="text-[14px] font-medium text-white">
                    {labels[day]}
                  </span>
                  <span
                    className={`text-[13px] tabular-nums ${
                      hours ? "text-neutral-300" : "text-neutral-600"
                    }`}
                  >
                    {hours ? `${hours.open} – ${hours.close}` : "Closed"}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

function ContactBlock({ section, org }: { section: ContactSection; org: OrgInfo }) {
  const { heading, show_address = true, show_phone = true, show_email = true, show_socials = true } = section.props
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-5xl mx-auto px-5">
        <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight mb-6">
          {heading || "Visit us"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 max-w-2xl">
          {show_address && org.address && (
            <ContactRow icon={MapPin} label="Address" value={`${org.address}${org.city ? `, ${org.city}` : ""}`} />
          )}
          {show_phone && org.phone && (
            <ContactRow icon={Phone} label="Phone" value={org.phone} href={`tel:${org.phone}`} />
          )}
          {show_email && org.email && (
            <ContactRow icon={Mail} label="Email" value={org.email} href={`mailto:${org.email}`} />
          )}
        </div>
        {show_socials && (org.instagram || org.facebook || org.website) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {org.instagram && (
              <SocialLink icon={Instagram} href={org.instagram} label="Instagram" />
            )}
            {org.facebook && (
              <SocialLink icon={Facebook} href={org.facebook} label="Facebook" />
            )}
            {org.website && (
              <SocialLink icon={Globe} href={org.website} label="Website" />
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Mail
  label: string
  value: string
  href?: string
}) {
  const inner = (
    <div className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
      <Icon className="h-4 w-4 text-neutral-400 mt-1 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">{label}</p>
        <p className="text-[14px] text-white truncate">{value}</p>
      </div>
    </div>
  )
  return href ? (
    <a href={href} className="hover:scale-[1.01] transition-transform">
      {inner}
    </a>
  ) : (
    inner
  )
}

function SocialLink({
  icon: Icon,
  href,
  label,
}: {
  icon: typeof Mail
  href: string
  label: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 hover:border-neutral-700 transition-colors text-[13px] text-neutral-300"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </a>
  )
}

function ClassesBlock({
  section,
  services,
  org,
}: {
  section: ClassesSection
  services: Service[]
  org: OrgInfo
}) {
  const { heading, subtitle, featured_only } = section.props
  const list = featured_only
    ? services // could later filter by show_on_website if added
    : services
  return (
    <section className="py-16 md:py-20 bg-neutral-900/30">
      <div className="max-w-5xl mx-auto px-5">
        <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight mb-2">
          {heading || "What we offer"}
        </h2>
        {subtitle && (
          <p className="text-neutral-400 text-[15px] mb-6">{subtitle}</p>
        )}
        {list.length === 0 ? (
          <p className="text-neutral-500 text-[14px]">
            Classes coming soon.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5"
              >
                <p className="text-[14px] font-semibold text-white">{s.name}</p>
                {s.description && (
                  <p className="text-[12px] text-neutral-400 mt-1.5 line-clamp-3 leading-relaxed">
                    {s.description}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500">
                    {s.duration_minutes ? `${s.duration_minutes} min` : ""}
                  </span>
                  {s.price_thb != null && s.price_thb > 0 && (
                    <span className="text-white font-medium tabular-nums">
                      ฿{s.price_thb.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {org.slug && (
          <div className="mt-8">
            <Link
              href={`/book?gym=${org.slug}`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-medium text-white text-[14px] transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: "var(--gym-primary)" }}
            >
              <Calendar className="h-4 w-4" />
              Book a session
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

function TrainersBlock({
  section,
  trainers,
}: {
  section: TrainersSection
  trainers: Trainer[]
}) {
  const { heading, subtitle } = section.props
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-5xl mx-auto px-5">
        <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight mb-2">
          {heading || "Meet your trainers"}
        </h2>
        {subtitle && <p className="text-neutral-400 text-[15px] mb-6">{subtitle}</p>}
        {trainers.length === 0 ? (
          <p className="text-neutral-500 text-[14px]">
            Trainer profiles coming soon.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trainers.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden"
              >
                {t.image_url && (
                  <div className="relative aspect-[4/5]">
                    <Image
                      src={t.image_url}
                      alt={t.display_name || ""}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <p className="text-[14px] font-semibold text-white">
                    {t.display_name || "Trainer"}
                  </p>
                  {t.bio && (
                    <p className="text-[12px] text-neutral-400 mt-1.5 line-clamp-3 leading-relaxed">
                      {t.bio}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function PhotosBlock({ section }: { section: PhotosSection }) {
  const { heading, image_urls = [], layout = "grid" } = section.props
  if (image_urls.length === 0) return null
  return (
    <section className="py-16 md:py-20 bg-neutral-900/30">
      <div className="max-w-5xl mx-auto px-5">
        {heading && (
          <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight mb-6">
            {heading}
          </h2>
        )}
        {layout === "grid" ? (
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
            {image_urls.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                <Image src={url} alt="" fill className="object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2">
            {image_urls.map((url, i) => (
              <div
                key={i}
                className="relative w-[280px] aspect-square rounded-xl overflow-hidden shrink-0 snap-start"
              >
                <Image src={url} alt="" fill className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function TestimonialsBlock({ section }: { section: TestimonialsSection }) {
  const { heading, items = [] } = section.props
  if (items.length === 0) return null
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-5xl mx-auto px-5">
        <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight mb-6">
          {heading || "What our students say"}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t, i) => (
            <figure
              key={i}
              className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5"
            >
              <blockquote className="text-[14px] text-neutral-200 leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-[12px] text-neutral-500">
                — <span className="text-white font-medium">{t.author}</span>
                {t.meta && <span className="ml-1 text-neutral-600">· {t.meta}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaBlock({ section }: { section: CtaSection }) {
  const { heading, body, primary_label, primary_href, secondary_label, secondary_href } = section.props
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-5 text-center">
        <h2 className="text-[32px] md:text-[44px] font-bold tracking-tight">
          {heading}
        </h2>
        {body && (
          <p className="text-[15px] md:text-[17px] text-neutral-300 mt-3 leading-relaxed">
            {body}
          </p>
        )}
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link
            href={primary_href}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-medium text-white text-[14px] transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: "var(--gym-primary)" }}
          >
            {primary_label}
            <ArrowRight className="h-4 w-4" />
          </Link>
          {secondary_label && secondary_href && (
            <Link
              href={secondary_href}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-medium text-neutral-300 hover:text-white text-[14px] border border-neutral-700 hover:border-neutral-600 transition-colors"
            >
              {secondary_label}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

function RichTextBlock({ section }: { section: RichTextSection }) {
  const { heading, body } = section.props
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-3xl mx-auto px-5">
        {heading && (
          <h2 className="text-[24px] md:text-[32px] font-bold tracking-tight mb-4">
            {heading}
          </h2>
        )}
        <div className="text-[15px] text-neutral-300 leading-relaxed whitespace-pre-wrap">
          {body}
        </div>
      </div>
    </section>
  )
}

/* ─── footer ─────────────────────────────────────────────────────── */

function SiteFooter({ org, theme }: { org: OrgInfo; theme: WebsiteTheme }) {
  return (
    <footer className="border-t border-neutral-900 py-10 mt-12">
      <div className="max-w-5xl mx-auto px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {theme.logo_url ? (
            <Image
              src={theme.logo_url}
              alt={org.name}
              width={32}
              height={32}
              className="rounded-lg shrink-0"
            />
          ) : (
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-semibold text-[14px] shrink-0"
              style={{ backgroundColor: "var(--gym-primary)" }}
            >
              {org.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-white truncate">{org.name}</p>
            <p className="text-[11px] text-neutral-500">
              {org.city ? `${org.city}, ` : ""}Thailand
            </p>
          </div>
        </div>
        <p className="text-[11px] text-neutral-600">
          Powered by MUAYTHAIPAI
        </p>
      </div>
    </footer>
  )
}
