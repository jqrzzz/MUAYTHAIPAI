import { type NextRequest, NextResponse } from "next/server"
import { EmailService } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json()

    const emailService = EmailService.getInstance()
    const customerEmailSent = await emailService.sendBookingConfirmation(bookingData)
    const staffEmailSent = await emailService.sendStaffNotification(bookingData)

    if (customerEmailSent && staffEmailSent) {
      console.log("Booking confirmation emails sent successfully")
      return NextResponse.json({
        success: true,
        message: "Confirmation emails sent",
      })
    } else {
      console.error("Some emails failed to send")
      return NextResponse.json(
        {
          success: false,
          message: "Some emails failed to send",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Email sending error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send emails",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
