import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Fetch all FAQs for the user's organization
export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user's org membership
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 })
  }

  const { data: faqs, error } = await supabase
    .from("gym_faqs")
    .select("*")
    .eq("org_id", membership.org_id)
    .order("category", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ faqs })
}

// POST - Create a new FAQ
export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 })
  }

  const body = await request.json()
  const { question, answer, category = "general" } = body

  if (!question || !answer) {
    return NextResponse.json({ error: "Question and answer are required" }, { status: 400 })
  }

  const { data: faq, error } = await supabase
    .from("gym_faqs")
    .insert({
      org_id: membership.org_id,
      question,
      answer,
      category,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ faq })
}

// PUT - Update an existing FAQ
export async function PUT(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 })
  }

  const body = await request.json()
  const { id, question, answer, category, is_active } = body

  if (!id) {
    return NextResponse.json({ error: "FAQ ID is required" }, { status: 400 })
  }

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (question !== undefined) updateData.question = question
  if (answer !== undefined) updateData.answer = answer
  if (category !== undefined) updateData.category = category
  if (is_active !== undefined) updateData.is_active = is_active

  const { data: faq, error } = await supabase
    .from("gym_faqs")
    .update(updateData)
    .eq("id", id)
    .eq("org_id", membership.org_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ faq })
}

// DELETE - Delete an FAQ
export async function DELETE(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "FAQ ID is required" }, { status: 400 })
  }

  const { error } = await supabase
    .from("gym_faqs")
    .delete()
    .eq("id", id)
    .eq("org_id", membership.org_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
