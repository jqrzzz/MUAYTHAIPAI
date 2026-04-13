// Email service for booking confirmations and notifications
import { Resend } from "resend"
import { env, hasEnv } from "@/lib/env"
import { formatBookingDateTime } from "@/lib/timezone"

interface OrgEmailContext {
  orgName: string
  orgEmail?: string
  staffEmail?: string
}

const DEFAULT_ORG: OrgEmailContext = {
  orgName: "Muay Thai Pai",
  orgEmail: "info@paimuaythai.com",
  staffEmail: undefined, // falls back to env.email.staffNotification()
}

interface BookingEmailData {
  customerName: string
  customerEmail: string
  serviceType: string
  bookingDate: string
  bookingTime?: string
  amount: number
  paymentId: string
  paymentMethod?: "card" | "apple-pay" | "cash"
  org?: OrgEmailContext
}

interface ContactFormData {
  name: string
  email: string
  phone: string
  message: string
  org?: OrgEmailContext
}

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export class EmailService {
  private static instance: EmailService
  private resend: Resend | null = null

  private constructor() {
    if (hasEnv("RESEND_API_KEY")) {
      this.resend = new Resend(env.resend.apiKey())
    } else {
      console.warn("RESEND_API_KEY not found - emails will be logged only")
    }
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  async sendBookingConfirmation(data: BookingEmailData): Promise<boolean> {
    try {
      const org = data.org || DEFAULT_ORG
      console.log("[v0] Attempting to send customer confirmation to:", data.customerEmail)
      const template = this.generateBookingConfirmationTemplate(data)

      if (this.resend) {
        const fromEmail = org.orgEmail || "info@paimuaythai.com"
        const result = await this.resend.emails.send({
          from: `${org.orgName} <${fromEmail}>`,
          to: data.customerEmail,
          subject: template.subject,
          html: template.html,
          text: template.text,
        })

        if (result.error) {
          console.error("[v0] Resend API error:", result.error, "to:", data.customerEmail)
          return false
        }

        console.log(
          "[v0] Customer confirmation sent successfully to:",
          data.customerEmail,
          "Result ID:",
          result.data?.id,
        )
        return true
      } else {
        console.error("[v0] Resend not initialized - RESEND_API_KEY missing")
        return false
      }
    } catch (error) {
      console.error("[v0] Failed to send booking confirmation:", error instanceof Error ? error.message : String(error))
      return false
    }
  }

  async sendStaffNotification(data: BookingEmailData): Promise<boolean> {
    try {
      const org = data.org || DEFAULT_ORG
      const template = this.generateStaffNotificationTemplate(data)
      const staffEmail = org.staffEmail || env.email.staffNotification()

      console.log("[v0] Attempting to send staff notification to:", staffEmail)

      if (this.resend) {
        const fromEmail = org.orgEmail || "info@paimuaythai.com"
        const result = await this.resend.emails.send({
          from: `${org.orgName} <${fromEmail}>`,
          to: staffEmail,
          subject: template.subject,
          html: template.html,
          text: template.text,
        })

        if (result.error) {
          console.error("[v0] Resend API error for staff notification:", result.error)
          return false
        }

        console.log("[v0] Staff notification sent successfully to:", staffEmail, "Result ID:", result.data?.id)
        return true
      } else {
        console.error("[v0] Resend not initialized - RESEND_API_KEY missing")
        return false
      }
    } catch (error) {
      console.error("[v0] Failed to send staff notification:", error instanceof Error ? error.message : String(error))
      return false
    }
  }

  async sendContactFormEmail(data: ContactFormData): Promise<boolean> {
    try {
      const org = data.org || DEFAULT_ORG
      console.log("[v0] Attempting to send contact form email from:", data.email)
      const customerTemplate = this.generateContactFormCustomerTemplate(data)
      const staffTemplate = this.generateContactFormStaffTemplate(data)

      if (!this.resend) {
        console.error("[v0] Resend not initialized - RESEND_API_KEY missing")
        return false
      }

      const fromEmail = org.orgEmail || "info@paimuaythai.com"

      // Send confirmation to customer
      const customerResult = await this.resend.emails.send({
        from: `${org.orgName} <${fromEmail}>`,
        to: data.email,
        subject: customerTemplate.subject,
        html: customerTemplate.html,
        text: customerTemplate.text,
      })

      if (customerResult.error) {
        console.error("[v0] Failed to send customer confirmation:", customerResult.error)
        return false
      }

      console.log("[v0] Contact form customer confirmation sent to:", data.email)

      // Send notification to staff
      const staffEmail = org.staffEmail || env.email.staffNotification()
      const staffResult = await this.resend.emails.send({
        from: `${org.orgName} <${fromEmail}>`,
        to: staffEmail,
        subject: staffTemplate.subject,
        html: staffTemplate.html,
        text: staffTemplate.text,
      })

      if (staffResult.error) {
        console.error("[v0] Failed to send staff notification:", staffResult.error)
        return false
      }

      console.log("[v0] Contact form staff notification sent to:", staffEmail)
      return true
    } catch (error) {
      console.error("[v0] Failed to send contact form emails:", error instanceof Error ? error.message : String(error))
      return false
    }
  }

  private generateBookingConfirmationTemplate(data: BookingEmailData): EmailTemplate {
    const org = data.org || DEFAULT_ORG
    const isCashPayment = data.paymentMethod === "cash"
    const formattedDateTime = formatBookingDateTime(data.bookingDate, data.bookingTime)
    const subject = isCashPayment
      ? `Booking Confirmed - ${data.serviceType} at ${org.orgName} (Payment Due Upon Arrival)`
      : `Booking Confirmed - ${data.serviceType}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Booking Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { font-weight: bold; color: #374151; }
            .detail-value { color: #6b7280; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .cash-notice { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .paid-badge { background: #10b981; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Confirmed!</h1>
              <p>Your Muay Thai journey begins here</p>
            </div>
            
            <div class="content">
              <h2>Hello ${data.customerName}!</h2>
              <p>Thank you for booking with ${org.orgName}. Your session has been confirmed and we're excited to train with you!</p>
              
              ${
                isCashPayment
                  ? `
              <div class="cash-notice">
                <h3 style="margin-top: 0; color: #92400e;">💵 Payment Due Upon Arrival</h3>
                <p style="margin: 10px 0; color: #92400e;"><strong>Please bring ฿${data.amount.toLocaleString()} cash to your session.</strong></p>
                <p style="margin: 0; color: #92400e; font-size: 14px;">Exact change is appreciated but not required.</p>
              </div>
              `
                  : ""
              }
              
              <div class="booking-details">
                <h3>Booking Details</h3>
                <div class="detail-row">
                  <span class="detail-label">Service:</span>
                  <span class="detail-value">${data.serviceType}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date & Time:</span>
                  <span class="detail-value">${formattedDateTime}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">${isCashPayment ? "Amount Due:" : "Payment Status:"}</span>
                  <span class="detail-value">${isCashPayment ? `฿${data.amount.toLocaleString()}` : '<span class="paid-badge">PAID ONLINE</span>'}</span>
                </div>
                ${
                  !isCashPayment
                    ? `
                <div class="detail-row">
                  <span class="detail-label">Payment ID:</span>
                  <span class="detail-value">${data.paymentId}</span>
                </div>
                `
                    : ""
                }
              </div>
              
              <h3>What to Bring:</h3>
              <ul>
                ${isCashPayment ? `<li><strong>฿${data.amount.toLocaleString()} cash for payment</strong></li>` : ""}
                <li>Comfortable workout clothes</li>
                <li>Water bottle</li>
                <li>Towel</li>
                <li>Positive attitude and willingness to learn!</li>
              </ul>
              
              <h3>Location:</h3>
              <p>${org.orgName}</p>
              
              <p>If you have any questions or need to reschedule, please contact us at:</p>
              <ul>
                <li>Email: ${org.orgEmail || "help@muaythaipai.com"}</li>
              </ul>
              
              <div style="background: #1f2937; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center;">
                <h3 style="color: #f97316; margin-top: 0;">Create an Account</h3>
                <p style="color: #9ca3af; margin: 10px 0;">Keep track of all your reservations and training history.</p>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://muaythaipai.com'}/student/login?email=${encodeURIComponent(data.customerEmail)}" 
                   style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                  Create Account
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p>See you on the mats!</p>
              <p>${org.orgName}</p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
      Booking Confirmed - ${data.serviceType}
      
      Hello ${data.customerName}!
      
      Thank you for booking with ${org.orgName}. Your session has been confirmed.
      
      ${isCashPayment ? `⚠️ PAYMENT DUE UPON ARRIVAL: Please bring ฿${data.amount.toLocaleString()} cash to your session.\n` : ""}
      
      Booking Details:
      - Service: ${data.serviceType}
      - Date & Time: ${formattedDateTime}
      - ${isCashPayment ? "Amount Due" : "Payment Status"}: ${isCashPayment ? `฿${data.amount.toLocaleString()}` : "PAID ONLINE"}
      ${!isCashPayment ? `- Payment ID: ${data.paymentId}` : ""}
      
      What to Bring:
      ${isCashPayment ? `- ฿${data.amount.toLocaleString()} cash for payment` : ""}
      - Comfortable workout clothes
      - Water bottle  
      - Towel
      - Positive attitude!
      
      Location: ${org.orgName}
      
      Contact us:
      Email: ${org.orgEmail || "help@muaythaipai.com"}
      
      ---
      
      CREATE AN ACCOUNT
      Keep track of all your reservations and training history.
      Visit: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://muaythaipai.com'}/student/login?email=${encodeURIComponent(data.customerEmail)}
      
      See you on the mats!
    `

    return { subject, html, text }
  }

  private generateStaffNotificationTemplate(data: BookingEmailData): EmailTemplate {
    const isCashPayment = data.paymentMethod === "cash"
    const formattedDateTime = formatBookingDateTime(data.bookingDate, data.bookingTime)
    const displayAmount = isCashPayment ? `฿${data.amount.toLocaleString()} THB` : `$${data.amount.toFixed(2)} USD`

    const subject = isCashPayment
      ? `NEW BOOKING - ${data.serviceType} - UNPAID (Cash on Arrival)`
      : `NEW BOOKING - ${data.serviceType}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
            .header { background: #1f2937; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 20px; border-radius: 0 0 8px 8px; }
            .detail { margin: 10px 0; padding: 10px; background: #f3f4f6; border-left: 4px solid #f97316; }
            .label { font-weight: bold; color: #374151; }
            .value { color: #6b7280; margin-left: 10px; }
            .cash-alert { background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>NEW BOOKING RECEIVED</h2>
              ${isCashPayment ? '<p style="color: #fbbf24; font-weight: bold; margin: 10px 0;">⚠️ UNPAID - CASH ON ARRIVAL</p>' : ""}
            </div>
            <div class="content">
              ${
                isCashPayment
                  ? `
              <div class="cash-alert">
                <strong style="color: #92400e;">💵 Cash Payment Required</strong>
                <p style="margin: 10px 0 0 0; color: #92400e;">Customer will pay ฿${data.amount.toLocaleString()} THB cash upon arrival. Please collect payment before session.</p>
              </div>
              `
                  : ""
              }
              
              <h3>Customer Details:</h3>
              <div class="detail">
                <span class="label">Name:</span>
                <span class="value">${data.customerName}</span>
              </div>
              <div class="detail">
                <span class="label">Email:</span>
                <span class="value">${data.customerEmail}</span>
              </div>
              
              <h3>Booking Details:</h3>
              <div class="detail">
                <span class="label">Service:</span>
                <span class="value">${data.serviceType}</span>
              </div>
              <div class="detail">
                <span class="label">Date & Time:</span>
                <span class="value">${formattedDateTime}</span>
              </div>
              <div class="detail">
                <span class="label">${isCashPayment ? "Amount Due (Cash):" : "Amount Paid:"}</span>
                <span class="value">${displayAmount}</span>
              </div>
              ${
                !isCashPayment
                  ? `
              <div class="detail">
                <span class="label">Payment ID:</span>
                <span class="value">${data.paymentId}</span>
              </div>
              `
                  : ""
              }
              
              <p style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 6px;">
                <strong>Action Required:</strong> Please prepare for this session and contact the customer if needed.
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
      NEW BOOKING - ${data.serviceType}
      ${isCashPayment ? "\n⚠️ UNPAID - CASH ON ARRIVAL\nCustomer will pay ฿" + data.amount.toLocaleString() + " THB cash upon arrival.\n" : ""}
      
      CUSTOMER DETAILS:
      Name: ${data.customerName}
      Email: ${data.customerEmail}
      
      BOOKING DETAILS:
      Service: ${data.serviceType}
      Date & Time: ${formattedDateTime}
      ${isCashPayment ? "Amount Due (Cash)" : "Amount Paid"}: ${displayAmount}
      ${!isCashPayment ? `Payment ID: ${data.paymentId}` : ""}
      
      Please prepare for this session and contact the customer if needed.
    `

    return { subject, html, text }
  }

  private generateContactFormCustomerTemplate(data: ContactFormData): EmailTemplate {
    const org = data.org || DEFAULT_ORG
    const subject = `We received your message - ${org.orgName}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Message Received</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank You for Reaching Out!</h1>
            </div>
            
            <div class="content">
              <h2>Hello ${data.name}!</h2>
              <p>We've received your message and one of our team members will get back to you within 24 hours.</p>
              
              <p><strong>Your message:</strong></p>
              <p style="background: white; padding: 15px; border-left: 4px solid #f97316; border-radius: 4px;">${data.message}</p>
              
              <p>In the meantime, feel free to explore our programs or follow us on social media!</p>
              
              <p>Best regards,<br>The ${org.orgName} Team</p>
            </div>
            
            <div class="footer">
              <p>${org.orgName}</p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
      Thank You for Reaching Out!
      
      Hello ${data.name}!
      
      We've received your message and one of our team members will get back to you within 24 hours.
      
      Your message:
      ${data.message}
      
      Best regards,
      The ${org.orgName} Team
    `

    return { subject, html, text }
  }

  private generateContactFormStaffTemplate(data: ContactFormData): EmailTemplate {
    const subject = `NEW CONTACT FORM SUBMISSION - ${data.name}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
            .header { background: #1f2937; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 20px; border-radius: 0 0 8px 8px; }
            .detail { margin: 10px 0; padding: 10px; background: #f3f4f6; border-left: 4px solid #f97316; }
            .label { font-weight: bold; color: #374151; }
            .value { color: #6b7280; margin-left: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>NEW CONTACT FORM SUBMISSION</h2>
            </div>
            <div class="content">
              <h3>Contact Details:</h3>
              <div class="detail">
                <span class="label">Name:</span>
                <span class="value">${data.name}</span>
              </div>
              <div class="detail">
                <span class="label">Email:</span>
                <span class="value">${data.email}</span>
              </div>
              <div class="detail">
                <span class="label">Phone:</span>
                <span class="value">${data.phone || "Not provided"}</span>
              </div>
              
              <h3>Message:</h3>
              <div class="detail">
                <p>${data.message}</p>
              </div>
              
              <p style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 6px;">
                <strong>Action Required:</strong> Please respond to ${data.email} within 24 hours.
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
      NEW CONTACT FORM SUBMISSION
      
      CONTACT DETAILS:
      Name: ${data.name}
      Email: ${data.email}
      Phone: ${data.phone || "Not provided"}
      
      MESSAGE:
      ${data.message}
      
      Action Required: Please respond to ${data.email} within 24 hours.
    `

    return { subject, html, text }
  }
}
