// Email service for booking confirmations and notifications
import { Resend } from "resend"
import QRCode from "qrcode"
import { env, hasEnv } from "@/lib/env"
import { formatBookingDateTime } from "@/lib/timezone"
import { NETWORK } from "@/lib/network-identity"

export interface OrgEmailContext {
  orgName: string
  orgEmail?: string
  staffEmail?: string
}

// Last-resort sender when a tenant email is sent with no org context — the
// MUAYTHAIPAI *network* identity, NOT any single gym. A gym's mail must never
// wear another gym's identity (the multi-tenant leak this replaces). Live
// booking paths resolve the real org via getOrgEmailContext() and never hit
// this. The network identity itself lives in lib/network-identity.ts.
export const NETWORK_FALLBACK: OrgEmailContext = {
  orgName: NETWORK.name,
  orgEmail: NETWORK.fromEmail,
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

export interface CertificateIssuedEmailData {
  studentName: string
  studentEmail: string
  levelName: string
  levelIcon: string
  levelNumber: number
  certificateNumber: string
  verificationUrl: string
  printUrl: string
  gymName: string
  issuedAt: string
}

export interface FirstCertCelebrationEmailData {
  ownerEmail: string
  ownerName: string | null
  orgName: string
  levelName: string
  levelNumber: number
  certificateNumber: string
  verifyUrl: string
}

export interface CourseCompletedEmailData {
  studentName: string
  studentEmail: string
  courseTitle: string
  levelName: string
  levelIcon: string
  siteUrl: string
}

export interface BoutInvitationEmailData {
  // Recipient (fighter being invited)
  fighterEmail: string
  fighterName: string
  // Who's inviting them
  promoterOrgName: string
  promoterCity: string | null
  // The bout / event
  eventName: string
  eventDate: string | null
  venue: string | null
  weightClass: string | null
  scheduledRounds: number
  corner: "red" | "blue"
  isMainEvent: boolean
  // Optional message the promoter included
  message: string | null
  // Where the fighter goes to respond
  respondUrl: string
}

export interface TicketConfirmationEmailData {
  buyerEmail: string
  buyerName: string
  eventName: string
  eventDate: string | null
  eventTime: string | null
  venue: string | null
  tierName: string
  tierDescription: string | null
  quantity: number
  totalThb: number
  orderReference: string
  eventUrl: string
}

export interface TicketReminderEmailData {
  buyerEmail: string
  buyerName: string
  eventName: string
  eventDate: string | null
  eventTime: string | null
  venue: string | null
  tierName: string
  quantity: number
  orderReference: string
  eventUrl: string
}

export interface BoutInvitationResponseEmailData {
  // Recipient (promoter who sent the invite)
  promoterEmail: string
  promoterName: string | null
  // The fighter who responded
  fighterName: string
  // What they did
  action: "accepted" | "declined"
  declineReason: string | null
  // The event for context
  eventName: string
  corner: "red" | "blue"
  // Deep link to the event editor
  editorUrl: string
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
      const org = data.org || NETWORK_FALLBACK
      console.log("[v0] Attempting to send customer confirmation to:", data.customerEmail)
      const template = this.generateBookingConfirmationTemplate(data)

      if (this.resend) {
        const fromEmail = org.orgEmail || NETWORK.fromEmail
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
      const org = data.org || NETWORK_FALLBACK
      const template = this.generateStaffNotificationTemplate(data)
      const staffEmail = org.staffEmail || env.email.staffNotification()

      console.log("[v0] Attempting to send staff notification to:", staffEmail)

      if (this.resend) {
        const fromEmail = org.orgEmail || NETWORK.fromEmail
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

  async sendCertificateIssuedEmail(data: CertificateIssuedEmailData): Promise<boolean> {
    try {
      const template = this.generateCertificateIssuedTemplate(data)

      if (!this.resend) {
        console.log("[email] Certificate issued email (no Resend):", data.studentEmail, data.certificateNumber)
        return false
      }

      const result = await this.resend.emails.send({
        // Cert is a MUAYTHAIPAI network credential — sender is the
        // network, not the specific issuing gym, so the email reads
        // consistently across all member gyms.
        from: NETWORK.from,
        to: data.studentEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      })

      if (result.error) {
        console.error("[email] Certificate issued email failed:", result.error)
        return false
      }

      console.log("[email] Certificate issued email sent to:", data.studentEmail)
      return true
    } catch (error) {
      console.error("[email] Failed to send certificate issued email:", error instanceof Error ? error.message : String(error))
      return false
    }
  }

  // One-time milestone email — sent the moment a gym issues its first
  // verified cert. Not for the student (they get their own email);
  // this lands in the gym OWNER's inbox so the trial-to-paid moment
  // gets the celebratory hand-off it deserves.
  async sendFirstCertCelebrationEmail(
    data: FirstCertCelebrationEmailData,
  ): Promise<boolean> {
    try {
      if (!this.resend) {
        console.log(
          "[email] First-cert celebration (no Resend):",
          data.ownerEmail,
          data.certificateNumber,
        )
        return false
      }

      const greeting = data.ownerName ? `Hey ${data.ownerName.split(" ")[0]},` : "Hey,"
      const subject = `🎉 ${data.orgName} just issued its first MUAYTHAIPAI certificate`

      const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;font-family:Inter,-apple-system,sans-serif;background:#09090b;color:#fafafa;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#09090b;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;background:#18181b;border:1px solid #27272a;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:32px 32px 8px 32px;">
          <p style="margin:0 0 16px 0;font-size:11px;letter-spacing:3px;color:#a1a1aa;text-transform:uppercase;">MUAYTHAIPAI · Milestone</p>
          <h1 style="margin:0 0 16px 0;font-size:28px;line-height:1.25;color:#fafafa;font-weight:700;">${data.orgName} just issued its first credential.</h1>
          <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#d4d4d8;">${greeting}</p>
          <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#d4d4d8;">A few minutes ago, you signed off on a student's <strong style="color:#fff;">${data.levelName}</strong> (Level ${data.levelNumber} of 5). It's now public, verifiable, and shareable forever.</p>
          <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#d4d4d8;">This is the moment your gym becomes part of the Naga–Garuda lineage — every cert from here on adds to your gym's public record.</p>
        </td></tr>
        <tr><td style="padding:0 32px 8px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#0a0a0a;border:1px solid #3f3f46;border-radius:8px;padding:20px;">
            <tr><td>
              <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:2px;color:#71717a;text-transform:uppercase;">Certificate</p>
              <p style="margin:0 0 12px 0;font-size:14px;color:#fafafa;font-family:ui-monospace,monospace;">${data.certificateNumber}</p>
              <a href="${data.verifyUrl}" style="display:inline-block;background:#f97316;color:#000;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:6px;">View verify page →</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px 32px 32px;">
          <p style="margin:0 0 8px 0;font-size:13px;line-height:1.6;color:#a1a1aa;"><strong style="color:#fafafa;">What to do next:</strong></p>
          <ul style="margin:0 0 16px 0;padding-left:20px;font-size:13px;line-height:1.7;color:#a1a1aa;">
            <li>Share the verify URL on social — every share is distributed credibility for your gym.</li>
            <li>Enroll your next student. Momentum compounds.</li>
            <li>Reply to this email if you want help getting the rest of your roster onto the ladder.</li>
          </ul>
          <p style="margin:24px 0 0 0;font-size:12px;color:#71717a;">— The MUAYTHAIPAI team</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

      const text = `${greeting}

${data.orgName} just issued its first MUAYTHAIPAI credential — ${data.levelName} (Level ${data.levelNumber} of 5).

It's public, verifiable, and shareable forever.

Certificate: ${data.certificateNumber}
Verify: ${data.verifyUrl}

What to do next:
- Share the verify URL on social.
- Enroll your next student.
- Reply if you want help getting your roster onto the ladder.

— The MUAYTHAIPAI team`

      const result = await this.resend.emails.send({
        // The gym just issued its first MUAYTHAIPAI credential — the
        // sender is the network, signed by "The MUAYTHAIPAI team."
        from: NETWORK.from,
        to: data.ownerEmail,
        subject,
        html,
        text,
      })

      if (result.error) {
        console.error("[email] First-cert celebration failed:", result.error)
        return false
      }
      console.log("[email] First-cert celebration sent to:", data.ownerEmail)
      return true
    } catch (error) {
      console.error(
        "[email] First-cert celebration error:",
        error instanceof Error ? error.message : String(error),
      )
      return false
    }
  }

  async sendCourseCompletedEmail(data: CourseCompletedEmailData): Promise<boolean> {
    try {
      const template = this.generateCourseCompletedTemplate(data)

      if (!this.resend) {
        console.log("[email] Course completed email (no Resend):", data.studentEmail, data.courseTitle)
        return false
      }

      const result = await this.resend.emails.send({
        // Course completion advances the student up the MUAYTHAIPAI
        // network's cert ladder — network-branded sender keeps the
        // story consistent with the cert email.
        from: NETWORK.from,
        to: data.studentEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      })

      if (result.error) {
        console.error("[email] Course completed email failed:", result.error)
        return false
      }

      console.log("[email] Course completed email sent to:", data.studentEmail)
      return true
    } catch (error) {
      console.error("[email] Failed to send course completed email:", error instanceof Error ? error.message : String(error))
      return false
    }
  }

  async sendContactFormEmail(data: ContactFormData): Promise<boolean> {
    try {
      const org = data.org || NETWORK_FALLBACK
      console.log("[v0] Attempting to send contact form email from:", data.email)
      const customerTemplate = this.generateContactFormCustomerTemplate(data)
      const staffTemplate = this.generateContactFormStaffTemplate(data)

      if (!this.resend) {
        console.error("[v0] Resend not initialized - RESEND_API_KEY missing")
        return false
      }

      const fromEmail = org.orgEmail || NETWORK.fromEmail

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
    const org = data.org || NETWORK_FALLBACK
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
    const org = data.org || NETWORK_FALLBACK
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

  private generateCertificateIssuedTemplate(data: CertificateIssuedEmailData): EmailTemplate {
    const formattedDate = new Date(data.issuedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    const subject = `${data.levelIcon} Congratulations! You've earned your ${data.levelName} certification`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #1f2937, #111827); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0 0 8px; font-size: 28px; }
            .header .level-icon { font-size: 48px; display: block; margin-bottom: 16px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .cert-card { background: white; padding: 24px; border-radius: 8px; border: 2px solid #f97316; margin: 20px 0; }
            .cert-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
            .cert-label { font-weight: bold; color: #374151; }
            .cert-value { color: #6b7280; }
            .btn { display: inline-block; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 8px 4px; }
            .btn-primary { background: #f97316; color: white; }
            .btn-secondary { background: #1f2937; color: white; }
            .actions { text-align: center; margin: 24px 0; }
            .footer { text-align: center; margin-top: 20px; color: #9ca3af; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="level-icon">${data.levelIcon}</span>
              <h1>Congratulations, ${data.studentName}!</h1>
              <p style="margin: 0; opacity: 0.9;">You've earned your <strong>${data.levelName}</strong> certification</p>
            </div>
            <div class="content">
              <p>Your trainer at <strong>${data.gymName}</strong> has certified you at <strong>Level ${data.levelNumber} — ${data.levelName}</strong>.</p>

              <div class="cert-card">
                <h3 style="margin-top: 0; color: #f97316;">Certificate Details</h3>
                <div class="cert-row">
                  <span class="cert-label">Certificate #</span>
                  <span class="cert-value">${data.certificateNumber}</span>
                </div>
                <div class="cert-row">
                  <span class="cert-label">Level</span>
                  <span class="cert-value">${data.levelIcon} ${data.levelName} (Level ${data.levelNumber})</span>
                </div>
                <div class="cert-row">
                  <span class="cert-label">Issued By</span>
                  <span class="cert-value">${data.gymName}</span>
                </div>
                <div class="cert-row" style="border-bottom: none;">
                  <span class="cert-label">Date</span>
                  <span class="cert-value">${formattedDate}</span>
                </div>
              </div>

              <div class="actions">
                <a href="${data.verificationUrl}" class="btn btn-primary">View Certificate</a>
                <a href="${data.printUrl}" class="btn btn-secondary">Download PDF</a>
              </div>

              <p style="font-size: 14px; color: #6b7280;">Share your verification link with anyone who wants to confirm your certification:<br>
              <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-size: 13px;">${data.verificationUrl}</code></p>

              <div class="footer">
                <p>Keep training hard — the next level awaits!</p>
                <p>${NETWORK.name}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
Congratulations, ${data.studentName}!

You've earned your ${data.levelName} (Level ${data.levelNumber}) certification!

Certificate Details:
- Certificate #: ${data.certificateNumber}
- Level: ${data.levelName} (Level ${data.levelNumber})
- Issued By: ${data.gymName}
- Date: ${formattedDate}

View your certificate: ${data.verificationUrl}
Download PDF: ${data.printUrl}

Share your verification link to confirm your certification:
${data.verificationUrl}

Keep training hard — the next level awaits!

${NETWORK.name}
    `.trim()

    return { subject, html, text }
  }

  private generateCourseCompletedTemplate(data: CourseCompletedEmailData): EmailTemplate {
    const subject = `${data.levelIcon} Course Complete! Next steps for your ${data.levelName} certification`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #059669, #047857); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0 0 8px; font-size: 28px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .steps { background: white; padding: 24px; border-radius: 8px; margin: 20px 0; }
            .step { display: flex; align-items: flex-start; margin: 16px 0; }
            .step-num { background: #f97316; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; flex-shrink: 0; margin-right: 12px; margin-top: 2px; }
            .step-text { flex: 1; }
            .btn { display: inline-block; background: #f97316; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; }
            .actions { text-align: center; margin: 24px 0; }
            .footer { text-align: center; margin-top: 20px; color: #9ca3af; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div style="font-size: 48px; margin-bottom: 16px;">&#10003;</div>
              <h1>Course Complete!</h1>
              <p style="margin: 0; opacity: 0.9;">${data.courseTitle}</p>
            </div>
            <div class="content">
              <p>Great work, <strong>${data.studentName}</strong>! You've finished the coursework for <strong>${data.levelName}</strong> certification.</p>

              <div class="steps">
                <h3 style="margin-top: 0; color: #374151;">What happens next?</h3>
                <div class="step">
                  <div class="step-num">1</div>
                  <div class="step-text"><strong>In-person assessment</strong> — Visit your gym and demonstrate your skills to a trainer.</div>
                </div>
                <div class="step">
                  <div class="step-num">2</div>
                  <div class="step-text"><strong>Skill sign-offs</strong> — Your trainer will sign off each technique as you demonstrate proficiency.</div>
                </div>
                <div class="step">
                  <div class="step-num">3</div>
                  <div class="step-text"><strong>Certificate issued</strong> — Once all skills are verified, your gym issues your official ${data.levelIcon} ${data.levelName} certificate.</div>
                </div>
              </div>

              <div class="actions">
                <a href="${data.siteUrl}/student" class="btn">View My Progress</a>
              </div>

              <div class="footer">
                <p>You're one step closer to your ${data.levelName} certification!</p>
                <p>${NETWORK.name}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
Course Complete! — ${data.courseTitle}

Great work, ${data.studentName}! You've finished the coursework for ${data.levelName} certification.

What happens next?

1. In-person assessment — Visit your gym and demonstrate your skills to a trainer.
2. Skill sign-offs — Your trainer will sign off each technique as you demonstrate proficiency.
3. Certificate issued — Once all skills are verified, your gym issues your official ${data.levelName} certificate.

View your progress: ${data.siteUrl}/student

You're one step closer to your ${data.levelName} certification!

${NETWORK.name}
    `.trim()

    return { subject, html, text }
  }

  /**
   * Send the operator's reply to a support ticket back to the gym admin
   * who opened it. The reply itself was already logged to the ticket;
   * this just notifies the gym admin so they don't have to keep
   * checking /admin to see if you've responded.
   */
  async sendSupportReply(args: {
    toEmail: string
    toName?: string | null
    gymName: string
    subject: string
    body: string
    ticketId: string
    isResolution: boolean
  }): Promise<boolean> {
    const { toEmail, toName, gymName, subject, body, ticketId, isResolution } = args
    const prefix = isResolution ? "[Resolved]" : "[Reply]"
    const emailSubject = `${prefix} ${subject}`
    const greeting = toName ? `Hi ${toName.split(" ")[0]},` : "Hi,"

    const text =
      `${greeting}\n\n` +
      `We just replied to your support ticket "${subject}" for ${gymName}:\n\n` +
      `${body}\n\n` +
      (isResolution
        ? `If this resolved your issue you don't need to do anything. If you need further help, hop into your /admin and click Help to open a new ticket.\n\n`
        : `If you need to add anything, hop into your /admin and click Help to continue the conversation.\n\n`) +
      `Ticket reference: ${ticketId.slice(0, 8)}\n\n` +
      `Team MUAYTHAIPAI`

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #18181b;">
        <p style="margin: 0 0 16px 0;">${greeting}</p>
        <p style="margin: 0 0 8px 0; color: #52525b; font-size: 13px;">
          We replied to your support ticket for <strong style="color: #18181b;">${escapeHtml(gymName)}</strong>:
        </p>
        <p style="margin: 0 0 24px 0; padding: 4px 0; color: #18181b; font-weight: 600;">
          ${escapeHtml(subject)}
        </p>
        <div style="background: #fafafa; border-left: 3px solid ${isResolution ? "#10b981" : "#6366f1"}; padding: 16px 20px; border-radius: 6px; margin: 0 0 24px 0; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(body)}</div>
        ${
          isResolution
            ? `<p style="margin: 0 0 16px 0; color: #10b981; font-size: 13px;">✓ Marked as resolved. If this didn't fix things, just open a new ticket and we'll dig back in.</p>`
            : `<p style="margin: 0 0 16px 0; color: #52525b; font-size: 13px;">Need to add something? Open <code>/admin → Help</code> to continue the conversation.</p>`
        }
        <p style="margin: 24px 0 0 0; color: #a1a1aa; font-size: 11px; border-top: 1px solid #e4e4e7; padding-top: 16px;">
          Ticket ${ticketId.slice(0, 8)} · Team MUAYTHAIPAI
        </p>
      </div>
    `

    try {
      if (!this.resend) {
        console.warn("[support email] Resend not configured — skipping")
        return false
      }
      const result = await this.resend.emails.send({
        from: NETWORK.supportFrom,
        to: toEmail,
        subject: emailSubject,
        html,
        text,
        replyTo: NETWORK.supportEmail,
      })
      if (result.error) {
        console.error("[support email] Resend error:", result.error)
        return false
      }
      return true
    } catch (err) {
      console.error("[support email] Send failed:", err)
      return false
    }
  }

  /**
   * Generic AI-warm send for automated sequences. Returns the Resend
   * message ID so the caller can store it in email_send_log for
   * audit + replies.
   *
   * One method handles all three sequences (welcome, lapsed, cert
   * congrats) — they share the same shape: subject + body in the
   * gym's voice, friendly + direct, no marketing fluff.
   */
  async sendAutomatedSequence(args: {
    toEmail: string
    toName?: string | null
    fromName: string // typically the gym name
    fromEmail?: string | null
    subject: string
    bodyText: string
    /** Optional small accent color for the left-border of the body block */
    accent?: "indigo" | "amber" | "emerald" | "orange"
    /** Footer line — e.g. "Sent by Wisarut Family Gym via MUAYTHAIPAI" */
    footer?: string
  }): Promise<{ ok: boolean; messageId: string | null; error: string | null }> {
    const { toEmail, toName, fromName, fromEmail, subject, bodyText, accent = "indigo", footer } = args
    const accentColors: Record<string, string> = {
      indigo: "#6366f1",
      amber: "#f59e0b",
      emerald: "#10b981",
      orange: "#f97316",
    }
    const accentColor = accentColors[accent] ?? accentColors.indigo

    const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #18181b; line-height: 1.6;">
  ${toName ? `<p style="margin: 0 0 16px 0;">Hi ${escapeHtml(toName.split(" ")[0])},</p>` : ""}
  <div style="white-space: pre-wrap; border-left: 3px solid ${accentColor}; padding: 4px 0 4px 16px; margin: 16px 0;">${escapeHtml(bodyText)}</div>
  ${
    footer
      ? `<p style="margin: 24px 0 0 0; color: #a1a1aa; font-size: 11px; border-top: 1px solid #e4e4e7; padding-top: 16px;">${escapeHtml(footer)}</p>`
      : ""
  }
</div>`.trim()

    const text = (toName ? `Hi ${toName.split(" ")[0]},\n\n` : "") + bodyText + (footer ? `\n\n---\n${footer}` : "")

    try {
      if (!this.resend) {
        console.warn("[email sequence] Resend not configured — skipping")
        return { ok: false, messageId: null, error: "resend_not_configured" }
      }
      const from = `${fromName} <${fromEmail || NETWORK.fromEmail}>`
      const result = await this.resend.emails.send({
        from,
        to: toEmail,
        subject,
        html,
        text,
        replyTo: fromEmail || undefined,
      })
      if (result.error) {
        return {
          ok: false,
          messageId: null,
          error: result.error.message ?? "resend_error",
        }
      }
      return { ok: true, messageId: result.data?.id ?? null, error: null }
    } catch (err) {
      return {
        ok: false,
        messageId: null,
        error: err instanceof Error ? err.message : "unknown_error",
      }
    }
  }

  // Confirmation email after a Stripe-paid ticket purchase. Includes
  // the order reference (shown at the door) and the event details.
  // Fires from the Stripe webhook so it only goes out on actual payment
  // success, not from the checkout-session create step.
  async sendTicketConfirmationEmail(
    data: TicketConfirmationEmailData,
  ): Promise<boolean> {
    try {
      if (!this.resend) {
        console.log("[email] Ticket confirmation (no Resend):", data.buyerEmail, data.orderReference)
        return false
      }
      if (!data.buyerEmail) return false

      // Generate a QR encoding the order reference. Resend supports
      // CID-style inline attachments — we attach the PNG with a CID
      // and reference it from the HTML via cid:ticket-qr. Falls back
      // to text-only display if generation fails so the email always
      // ships even without the QR.
      let qrPngBuffer: Buffer | null = null
      try {
        // Returns a Buffer of the PNG. M = ~15% error correction, enough
        // for door-staff scanning at oblique angles + small screens.
        qrPngBuffer = await QRCode.toBuffer(data.orderReference, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 320,
          color: { dark: "#000000", light: "#FFFFFF" },
        })
      } catch (err) {
        console.warn("[email] QR generation failed, sending text-only:", err)
      }

      const firstName = data.buyerName.split(" ")[0] || data.buyerName
      const eventDateLabel = data.eventDate
        ? new Date(data.eventDate).toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "Date TBD"
      const timeLabel = data.eventTime ? ` · ${data.eventTime}` : ""
      const venueLabel = data.venue || "Venue TBD"
      const subject = `🎟️ Ticket confirmed — ${data.eventName}`

      const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;font-family:Inter,-apple-system,sans-serif;background:#09090b;color:#fafafa;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#09090b;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;background:#18181b;border:1px solid #27272a;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:32px 32px 8px 32px;">
          <p style="margin:0 0 16px 0;font-size:11px;letter-spacing:3px;color:#fbbf24;text-transform:uppercase;">MUAYTHAIPAI · Ticket confirmed</p>
          <h1 style="margin:0 0 16px 0;font-size:26px;line-height:1.25;color:#fafafa;font-weight:700;">You're in.</h1>
          <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#d4d4d8;">Hey ${escapeHtml(firstName)}, your ticket${data.quantity > 1 ? "s" : ""} to <strong style="color:#fff">${escapeHtml(data.eventName)}</strong> ${data.quantity > 1 ? "are" : "is"} confirmed.</p>
        </td></tr>
        <tr><td style="padding:0 32px 16px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#0a0a0a;border:1px solid #3f3f46;border-radius:8px;padding:20px;">
            <tr><td>
              <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:2px;color:#71717a;text-transform:uppercase;">Order reference</p>
              <p style="margin:0 0 14px 0;font-size:18px;color:#fbbf24;font-family:ui-monospace,monospace;font-weight:600;">${escapeHtml(data.orderReference)}</p>
              <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:2px;color:#71717a;text-transform:uppercase;">Tier · Quantity</p>
              <p style="margin:0 0 14px 0;font-size:14px;color:#fafafa;">${escapeHtml(data.tierName)} × ${data.quantity}${data.tierDescription ? ` — ${escapeHtml(data.tierDescription)}` : ""}</p>
              <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:2px;color:#71717a;text-transform:uppercase;">When · Where</p>
              <p style="margin:0 0 14px 0;font-size:14px;color:#d4d4d8;">${eventDateLabel}${timeLabel}<br/>${escapeHtml(venueLabel)}</p>
              <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:2px;color:#71717a;text-transform:uppercase;">Total paid</p>
              <p style="margin:0;font-size:14px;color:#fafafa;">฿${data.totalThb.toLocaleString()}</p>
            </td></tr>
          </table>
        </td></tr>
        ${qrPngBuffer ? `<tr><td style="padding:8px 32px 16px 32px;" align="center">
          <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:2px;color:#71717a;text-transform:uppercase;">Scan at the door</p>
          <img src="cid:ticket-qr" alt="Ticket QR code: ${escapeHtml(data.orderReference)}" width="160" height="160" style="display:block;border:8px solid #fff;border-radius:8px;background:#fff;" />
        </td></tr>` : ""}
        <tr><td style="padding:8px 32px 32px 32px;">
          <p style="margin:0 0 16px 0;font-size:13px;line-height:1.55;color:#a1a1aa;"><strong style="color:#fff">At the door:</strong> show this email${qrPngBuffer ? " — staff will scan the QR above" : ""}, or give your order reference (<span style="font-family:ui-monospace,monospace;color:#fbbf24">${escapeHtml(data.orderReference)}</span>). Arrive 30 minutes early.</p>
          <a href="${data.eventUrl}" style="display:inline-block;background:#fbbf24;color:#000;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:6px;">View fight card →</a>
          <p style="margin:24px 0 0 0;font-size:12px;color:#71717a;">— The MUAYTHAIPAI team</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

      const text = `Hey ${firstName},

Your ticket${data.quantity > 1 ? "s" : ""} to ${data.eventName} ${data.quantity > 1 ? "are" : "is"} confirmed.

Order reference: ${data.orderReference}
Tier: ${data.tierName} × ${data.quantity}
When: ${eventDateLabel}${timeLabel}
Where: ${venueLabel}
Total: ฿${data.totalThb.toLocaleString()}

At the door: show this email or your order reference. Arrive 30 minutes early.

Fight card: ${data.eventUrl}

— The MUAYTHAIPAI team`

      const result = await this.resend.emails.send({
        from: NETWORK.from,
        to: data.buyerEmail,
        subject,
        html,
        text,
        // Attach the QR as an inline image referenced via cid:ticket-qr
        // in the HTML. Resend forwards content_id to the SMTP layer so
        // Gmail / Outlook / Apple Mail all render it inline.
        attachments: qrPngBuffer
          ? [
              {
                filename: `${data.orderReference}.png`,
                content: qrPngBuffer,
                contentId: "ticket-qr",
                contentType: "image/png",
              },
            ]
          : undefined,
      })
      if (result.error) {
        console.error("[email] Ticket confirmation failed:", result.error)
        return false
      }
      return true
    } catch (error) {
      console.error("[email] Failed to send ticket confirmation:", error instanceof Error ? error.message : String(error))
      return false
    }
  }

  // 24h-before reminder email for ticket buyers. Fired from the
  // /api/cron/event-reminders job. Includes a QR code (same lib as
  // the confirmation email) so the buyer doesn't have to dig through
  // their inbox at the door.
  async sendTicketReminderEmail(
    data: TicketReminderEmailData,
  ): Promise<boolean> {
    try {
      if (!this.resend) {
        console.log("[email] Ticket reminder (no Resend):", data.buyerEmail, data.orderReference)
        return false
      }
      if (!data.buyerEmail) return false

      let qrPngBuffer: Buffer | null = null
      try {
        qrPngBuffer = await QRCode.toBuffer(data.orderReference, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 320,
          color: { dark: "#000000", light: "#FFFFFF" },
        })
      } catch (err) {
        console.warn("[email] QR generation failed for reminder:", err)
      }

      const firstName = data.buyerName.split(" ")[0] || data.buyerName
      const eventDateLabel = data.eventDate
        ? new Date(data.eventDate).toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })
        : "Tomorrow"
      const timeLabel = data.eventTime ? ` · ${data.eventTime.slice(0, 5)}` : ""
      const venueLabel = data.venue || "Venue TBD"
      const subject = `🥊 Tomorrow: ${data.eventName}`

      const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;font-family:Inter,-apple-system,sans-serif;background:#09090b;color:#fafafa;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#09090b;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;background:#18181b;border:1px solid #27272a;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:32px 32px 8px 32px;">
          <p style="margin:0 0 16px 0;font-size:11px;letter-spacing:3px;color:#fbbf24;text-transform:uppercase;">MUAYTHAIPAI · Tomorrow</p>
          <h1 style="margin:0 0 16px 0;font-size:26px;line-height:1.25;color:#fafafa;font-weight:700;">${escapeHtml(data.eventName)}</h1>
          <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#d4d4d8;">Hey ${escapeHtml(firstName)} — fight night is ${eventDateLabel.toLowerCase()}${timeLabel ? ` at ${escapeHtml(data.eventTime?.slice(0, 5) ?? "")}` : ""}. Quick reminder so nothing slips.</p>
        </td></tr>
        <tr><td style="padding:0 32px 16px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#0a0a0a;border:1px solid #3f3f46;border-radius:8px;padding:20px;">
            <tr><td>
              <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:2px;color:#71717a;text-transform:uppercase;">Order reference</p>
              <p style="margin:0 0 14px 0;font-size:18px;color:#fbbf24;font-family:ui-monospace,monospace;font-weight:600;">${escapeHtml(data.orderReference)}</p>
              <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:2px;color:#71717a;text-transform:uppercase;">Tier · Quantity</p>
              <p style="margin:0 0 14px 0;font-size:14px;color:#fafafa;">${escapeHtml(data.tierName)} × ${data.quantity}</p>
              <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:2px;color:#71717a;text-transform:uppercase;">Where</p>
              <p style="margin:0;font-size:14px;color:#d4d4d8;">${escapeHtml(venueLabel)}</p>
            </td></tr>
          </table>
        </td></tr>
        ${qrPngBuffer ? `<tr><td style="padding:8px 32px 16px 32px;" align="center">
          <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:2px;color:#71717a;text-transform:uppercase;">Scan at the door</p>
          <img src="cid:ticket-qr" alt="Ticket QR code: ${escapeHtml(data.orderReference)}" width="160" height="160" style="display:block;border:8px solid #fff;border-radius:8px;background:#fff;" />
        </td></tr>` : ""}
        <tr><td style="padding:8px 32px 32px 32px;">
          <p style="margin:0 0 16px 0;font-size:13px;line-height:1.55;color:#a1a1aa;"><strong style="color:#fff">Get there 30 minutes early</strong> — the main event always runs faster than the undercard suggests. Show the QR above or your order reference at the door.</p>
          <a href="${data.eventUrl}" style="display:inline-block;background:#fbbf24;color:#000;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:6px;">View fight card →</a>
          <p style="margin:24px 0 0 0;font-size:12px;color:#71717a;">— The MUAYTHAIPAI team</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

      const text = `Hey ${firstName},

Fight night is ${eventDateLabel.toLowerCase()}${timeLabel}. Quick reminder.

Event: ${data.eventName}
Order: ${data.orderReference}
Tier: ${data.tierName} × ${data.quantity}
Where: ${venueLabel}

Show the QR or your order reference at the door. Arrive 30 minutes early.

Fight card: ${data.eventUrl}

— The MUAYTHAIPAI team`

      const result = await this.resend.emails.send({
        from: NETWORK.from,
        to: data.buyerEmail,
        subject,
        html,
        text,
        attachments: qrPngBuffer
          ? [{
              filename: `${data.orderReference}.png`,
              content: qrPngBuffer,
              contentId: "ticket-qr",
              contentType: "image/png",
            }]
          : undefined,
      })
      if (result.error) {
        console.error("[email] Ticket reminder failed:", result.error)
        return false
      }
      return true
    } catch (error) {
      console.error("[email] Failed to send ticket reminder:", error instanceof Error ? error.message : String(error))
      return false
    }
  }

  // Sent to the fighter the moment a promoter invites them to a bout.
  // Without this email, the L4 invitation loop is fragile — fighters
  // wouldn't know they'd been invited unless they happened to load
  // their dashboard. The email links straight to the trainer dashboard
  // where they can accept or decline.
  async sendBoutInvitationEmail(data: BoutInvitationEmailData): Promise<boolean> {
    try {
      if (!this.resend) {
        console.log("[email] Bout invitation (no Resend):", data.fighterEmail, data.eventName)
        return false
      }

      const firstName = data.fighterName.split(" ")[0] || data.fighterName
      const eventDateLabel = data.eventDate
        ? new Date(data.eventDate).toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "Date TBD"
      const venueLabel = data.venue || "Venue TBD"
      const cornerLabel = data.corner === "red" ? "Red Corner" : "Blue Corner"
      const subject = data.isMainEvent
        ? `🥊 Main-event invitation — ${data.eventName}`
        : `🥊 Fight invitation — ${data.eventName}`

      const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;font-family:Inter,-apple-system,sans-serif;background:#09090b;color:#fafafa;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#09090b;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;background:#18181b;border:1px solid #27272a;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:32px 32px 8px 32px;">
          <p style="margin:0 0 16px 0;font-size:11px;letter-spacing:3px;color:#fbbf24;text-transform:uppercase;">MUAYTHAIPAI · Fight Invitation</p>
          <h1 style="margin:0 0 16px 0;font-size:26px;line-height:1.25;color:#fafafa;font-weight:700;">${escapeHtml(data.promoterOrgName)} wants you on the card.</h1>
          <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#d4d4d8;">Hey ${escapeHtml(firstName)},</p>
          <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#d4d4d8;">${escapeHtml(data.promoterOrgName)}${data.promoterCity ? ` (${escapeHtml(data.promoterCity)})` : ""} just invited you to fight ${data.isMainEvent ? "<strong style='color:#fbbf24'>the main event</strong> " : ""}at <strong style="color:#fafafa">${escapeHtml(data.eventName)}</strong>.</p>
        </td></tr>
        <tr><td style="padding:0 32px 16px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#0a0a0a;border:1px solid #3f3f46;border-radius:8px;padding:20px;">
            <tr><td>
              <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:2px;color:#71717a;text-transform:uppercase;">Event</p>
              <p style="margin:0 0 14px 0;font-size:15px;color:#fafafa;">${escapeHtml(data.eventName)}</p>
              <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:2px;color:#71717a;text-transform:uppercase;">When · Where</p>
              <p style="margin:0 0 14px 0;font-size:14px;color:#d4d4d8;">${eventDateLabel} · ${escapeHtml(venueLabel)}</p>
              <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:2px;color:#71717a;text-transform:uppercase;">Bout</p>
              <p style="margin:0;font-size:14px;color:#d4d4d8;">${cornerLabel} · ${data.scheduledRounds} rounds${data.weightClass ? ` · ${escapeHtml(data.weightClass)}` : ""}</p>
            </td></tr>
          </table>
        </td></tr>
        ${data.message ? `<tr><td style="padding:0 32px 16px 32px;">
          <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:2px;color:#71717a;text-transform:uppercase;">Note from the promoter</p>
          <p style="margin:0;padding:12px 16px;background:#0a0a0a;border-left:3px solid #fbbf24;font-size:14px;color:#d4d4d8;line-height:1.55;font-style:italic;">${escapeHtml(data.message)}</p>
        </td></tr>` : ""}
        <tr><td style="padding:8px 32px 32px 32px;">
          <a href="${data.respondUrl}" style="display:inline-block;background:#fbbf24;color:#000;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:6px;">Open dashboard to respond →</a>
          <p style="margin:20px 0 0 0;font-size:12px;color:#71717a;line-height:1.5;">You'll see Accept / Decline buttons at the top of your trainer dashboard. The promoter can't book you until you accept.</p>
          <p style="margin:16px 0 0 0;font-size:12px;color:#71717a;">— The MUAYTHAIPAI team</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

      const text = `Hey ${firstName},

${data.promoterOrgName}${data.promoterCity ? ` (${data.promoterCity})` : ""} just invited you to fight${data.isMainEvent ? " the main event" : ""} at ${data.eventName}.

When · Where: ${eventDateLabel} · ${venueLabel}
Bout: ${cornerLabel} · ${data.scheduledRounds} rounds${data.weightClass ? ` · ${data.weightClass}` : ""}
${data.message ? `\nNote from the promoter:\n"${data.message}"\n` : ""}
Open your dashboard to respond: ${data.respondUrl}

The promoter can't book you until you accept.

— The MUAYTHAIPAI team`

      const result = await this.resend.emails.send({
        from: NETWORK.from,
        to: data.fighterEmail,
        subject,
        html,
        text,
      })
      if (result.error) {
        console.error("[email] Bout invitation failed:", result.error)
        return false
      }
      return true
    } catch (error) {
      console.error("[email] Failed to send bout invitation:", error instanceof Error ? error.message : String(error))
      return false
    }
  }

  // Sent to the promoter the moment a fighter accepts or declines.
  // Closes the loop so the promoter doesn't have to babysit the editor
  // waiting for a response. On decline, includes any reason the fighter
  // gave so the promoter has context.
  async sendBoutInvitationResponseEmail(
    data: BoutInvitationResponseEmailData,
  ): Promise<boolean> {
    try {
      if (!this.resend) {
        console.log(
          "[email] Bout invitation response (no Resend):",
          data.promoterEmail,
          data.action,
        )
        return false
      }

      const firstName = data.promoterName ? data.promoterName.split(" ")[0] : null
      const greeting = firstName ? `Hey ${firstName},` : "Hey,"
      const cornerLabel = data.corner === "red" ? "Red Corner" : "Blue Corner"
      const accent = data.action === "accepted" ? "#34d399" : "#f87171"
      const headlineEmoji = data.action === "accepted" ? "✅" : "✋"
      const headline =
        data.action === "accepted"
          ? `${escapeHtml(data.fighterName)} accepted your invitation.`
          : `${escapeHtml(data.fighterName)} declined your invitation.`
      const subject =
        data.action === "accepted"
          ? `${headlineEmoji} ${data.fighterName} accepted — ${data.eventName}`
          : `${headlineEmoji} ${data.fighterName} declined — ${data.eventName}`

      const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;font-family:Inter,-apple-system,sans-serif;background:#09090b;color:#fafafa;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#09090b;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;background:#18181b;border:1px solid #27272a;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:32px 32px 8px 32px;">
          <p style="margin:0 0 16px 0;font-size:11px;letter-spacing:3px;color:${accent};text-transform:uppercase;">MUAYTHAIPAI · Invitation ${data.action}</p>
          <h1 style="margin:0 0 16px 0;font-size:24px;line-height:1.3;color:#fafafa;font-weight:700;">${headline}</h1>
          <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#d4d4d8;">${greeting}</p>
          <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#d4d4d8;">${
            data.action === "accepted"
              ? `<strong style="color:#fafafa">${escapeHtml(data.fighterName)}</strong> is in for <strong style="color:#fafafa">${escapeHtml(data.eventName)}</strong> (${cornerLabel}). The bout card is updated and the public fight page reflects the confirmed fighter.`
              : `<strong style="color:#fafafa">${escapeHtml(data.fighterName)}</strong> won't fight at <strong style="color:#fafafa">${escapeHtml(data.eventName)}</strong> (${cornerLabel}). The corner is open again — invite someone else from the bout editor when you're ready.`
          }</p>
        </td></tr>
        ${data.action === "declined" && data.declineReason ? `<tr><td style="padding:0 32px 16px 32px;">
          <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:2px;color:#71717a;text-transform:uppercase;">Reason given</p>
          <p style="margin:0;padding:12px 16px;background:#0a0a0a;border-left:3px solid #f87171;font-size:14px;color:#d4d4d8;line-height:1.55;font-style:italic;">${escapeHtml(data.declineReason)}</p>
        </td></tr>` : ""}
        <tr><td style="padding:8px 32px 32px 32px;">
          <a href="${data.editorUrl}" style="display:inline-block;background:#fbbf24;color:#000;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:6px;">Open event editor →</a>
          <p style="margin:24px 0 0 0;font-size:12px;color:#71717a;">— The MUAYTHAIPAI team</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

      const text = `${greeting}

${data.fighterName} ${data.action} your invitation for ${data.eventName} (${cornerLabel}).

${
  data.action === "accepted"
    ? "The bout card is updated and the public fight page now shows them as confirmed."
    : `The corner is open again — invite someone else from the bout editor when you're ready.${data.declineReason ? `\n\nReason given: "${data.declineReason}"` : ""}`
}

Open the event editor: ${data.editorUrl}

— The MUAYTHAIPAI team`

      const result = await this.resend.emails.send({
        from: NETWORK.from,
        to: data.promoterEmail,
        subject,
        html,
        text,
      })
      if (result.error) {
        console.error("[email] Bout invitation response failed:", result.error)
        return false
      }
      return true
    } catch (error) {
      console.error(
        "[email] Failed to send bout invitation response:",
        error instanceof Error ? error.message : String(error),
      )
      return false
    }
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
