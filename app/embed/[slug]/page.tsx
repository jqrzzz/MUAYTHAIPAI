import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import EmbedClient from "./client"

interface EmbedPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: EmbedPageProps): Promise<Metadata> {
  const { slug } = await params
  return {
    title: `Book — ${slug} | OckOck`,
    robots: "noindex, nofollow",
  }
}

export default async function EmbedPage({ params }: EmbedPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: gym } = await supabase
    .from("organizations")
    .select("id, name, name_th, slug, logo_url")
    .eq("slug", slug)
    .eq("status", "active")
    .single()

  if (!gym) notFound()

  const { data: services } = await supabase
    .from("services")
    .select("id, name, description, price_thb, duration_minutes, duration_days, category")
    .eq("org_id", gym.id)
    .eq("is_active", true)
    .order("display_order", { ascending: true })

  return <EmbedClient gym={gym} services={services || []} />
}
