import { NextResponse } from "next/server"
import { EmailService } from "@/lib/email-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, type = "both" } = body

    if (!email) {
      return NextResponse.json({ error: "Email address required" }, { status: 400 })
    }

    const emailService = EmailService.getInstance()

    // Test booking data
    const testBookingData = {
      customerName: "Test Customer",
      customerEmail: email,
      serviceType: "Private Lesson - Beginner",
      bookingDate: "January 20, 2025",
      bookingTime: "2:00 PM",
      amount: 1500,
      paymentId: "test_payment_123",
    }

    const results = {
      customerEmail: false,
      staffEmail: false,
    }

    // Send customer confirmation
    if (type === "customer" || type === "both") {
      results.customerEmail = await emailService.sendBookingConfirmation(testBookingData)
    }

    // Send staff notification
    if (type === "staff" || type === "both") {
      results.staffEmail = await emailService.sendStaffNotification(testBookingData)
    }

    return NextResponse.json({
      success: true,
      message: "Test emails sent",
      results,
      testData: testBookingData,
    })
  } catch (error) {
    console.error("Test email error:", error)
    return NextResponse.json(
      {
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Email test endpoint",
    usage: "POST with { email: 'test@example.com', type: 'both' | 'customer' | 'staff' }",
    environment: {
      hasResendKey: !!process.env.RESEND_API_KEY,
      staffEmail: process.env.STAFF_NOTIFICATION_EMAIL || "info@paimuaythai.com",
    },
  })
}
