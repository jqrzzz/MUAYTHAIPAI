import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image (JPEG, PNG, WebP, GIF)" },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split(".").pop() || "jpg"
    const filename = `trainer-photos/${timestamp}.${extension}`

    // Upload to Supabase Storage
    const { data, error: supabaseError } = await supabase.storage
      .from("uploads")
      .upload(filename, file, {
        contentType: file.type,
        upsert: false,
      })

    if (supabaseError) {
      console.error("Supabase upload error:", supabaseError)
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      )
    }

    // Get public URL from Supabase
    const { data: urlData } = supabase.storage
      .from("uploads")
      .getPublicUrl(data.path)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}
