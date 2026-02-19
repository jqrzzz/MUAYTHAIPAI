import { NextResponse } from "next/server"
import { EmailService } from "@/lib/email-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, message } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const emailService = EmailService.getInstance()
    const success = await emailService.sendContactFormEmail({
      name,
      email,
      phone: phone || "",
      message,
    })

    if (success) {
      return NextResponse.json({ success: true, message: "Email sent successfully" })
    } else {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Contact email API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
