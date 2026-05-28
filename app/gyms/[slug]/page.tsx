import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { aggregateCertActivity } from "@/lib/certification-levels"
import GymPageClient from "./client"
import DynamicWebsite from "@/components/public/dynamic-website"
import type { WebsiteSection, WebsiteTheme } from "@/lib/website-sections"

interface GymPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}

export async function generateMetadata({ params }: GymPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: gym } = await supabase
    .from("organizations")
    .select("name, description, city")
    .eq("slug", slug)
    .eq("status", "active")
    .single()

  if (!gym) {
    return { title: "Gym Not Found" }
  }

  // If they have published SEO meta, prefer it. Must scope by org —
  // .single() without the org filter would match the first published
  // website alphabetically and surface the wrong gym's meta.
  const { data: gymRow } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .single()
  const { data: site } = gymRow
    ? await supabase
        .from("gym_websites")
        .select("seo_title, seo_description, status")
        .eq("org_id", gymRow.id)
        .eq("status", "published")
        .maybeSingle()
    : { data: null }

  return {
    title:
      site?.seo_title ||
      `${gym.name} | MUAYTHAIPAI`,
    description:
      site?.seo_description ||
      gym.description ||
      `Train Muay Thai at ${gym.name} in ${gym.city}, Thailand.`,
  }
}

export default async function GymPage({ params, searchParams }: GymPageProps) {
  const { slug } = await params
  const { preview } = await searchParams
  const isPreview = preview === "1"
  const supabase = await createClient()

  // Fetch gym
  const { data: gym } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single()

  if (!gym) {
    notFound()
  }

  // Fetch services + trainers + settings + cert activity + website (the
  // last is what decides between dynamic site vs legacy static layout)
  const [
    servicesRes,
    trainersRes,
    settingsRes,
    certsRes,
    enrollmentsRes,
    websiteRes,
  ] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("org_id", gym.id)
      .eq("is_active", true)
      .order("display_order"),
    supabase
      .from("trainer_profiles")
      .select("*, users:user_id (public_instructor_enabled, public_instructor_handle)")
      .eq("org_id", gym.id)
      .eq("is_available", true)
      .order("display_order"),
    supabase
      .from("org_settings")
      .select("operating_hours, show_prices, address, city, province, email, phone, whatsapp, instagram, facebook, website")
      .eq("org_id", gym.id)
      .single(),
    supabase
      .from("certificates")
      .select("level")
      .eq("org_id", gym.id)
      .eq("status", "active"),
    supabase
      .from("certification_enrollments")
      .select("level, status")
      .eq("org_id", gym.id)
      .eq("status", "active"),
    supabase
      .from("gym_websites")
      .select("status, sections, theme")
      .eq("org_id", gym.id)
      .maybeSingle(),
  ])

  const certActivity = aggregateCertActivity(certsRes.data, enrollmentsRes.data)

  // Show the dynamic website if:
  //   - it exists, AND
  //   - it's published OR the visitor explicitly requested ?preview=1
  // Otherwise fall back to the legacy static gym page.
  const website = websiteRes.data as
    | { status: string; sections: WebsiteSection[]; theme: WebsiteTheme }
    | null
  const showDynamic = !!website && (website.status === "published" || isPreview)

  if (showDynamic && website) {
    const settings = settingsRes.data as {
      operating_hours: Record<string, { open: string; close: string }> | null
      address?: string | null
      city?: string | null
      province?: string | null
      email?: string | null
      phone?: string | null
      whatsapp?: string | null
      instagram?: string | null
      facebook?: string | null
      website?: string | null
    } | null
    return (
      <DynamicWebsite
        org={{
          name: gym.name,
          slug: gym.slug,
          city: settings?.city ?? gym.city ?? null,
          province: settings?.province ?? gym.province ?? null,
          email: settings?.email ?? gym.email ?? null,
          phone: settings?.phone ?? gym.phone ?? null,
          whatsapp: settings?.whatsapp ?? null,
          address: settings?.address ?? gym.address ?? null,
          instagram: settings?.instagram ?? null,
          facebook: settings?.facebook ?? null,
          website: settings?.website ?? null,
        }}
        sections={website.sections ?? []}
        theme={website.theme ?? {}}
        services={servicesRes.data || []}
        trainers={trainersRes.data || []}
        operatingHours={settings?.operating_hours ?? null}
        isPreview={isPreview && website.status !== "published"}
      />
    )
  }

  // Check if user is logged in (legacy path)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <GymPageClient
      gym={gym}
      services={servicesRes.data || []}
      trainers={trainersRes.data || []}
      settings={settingsRes.data}
      user={user}
      certActivity={certActivity}
    />
  )
}
