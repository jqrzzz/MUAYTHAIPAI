import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import GymsListClient from "./client"

export const metadata: Metadata = {
  title: "Muay Thai Gyms in Thailand | Thailand Muay Thai Network",
  description: "Find and book at authentic Muay Thai gyms across Thailand. One account, train anywhere.",
}

export default async function GymsPage() {
  const supabase = await createClient()

  // Fetch all active gyms
  const { data: gyms } = await supabase
    .from("organizations")
    .select(`
      id,
      name,
      slug,
      description,
      city,
      province,
      logo_url,
      cover_image_url
    `)
    .eq("status", "active")
    .order("name")

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <GymsListClient gyms={gyms || []} user={user} />
}
