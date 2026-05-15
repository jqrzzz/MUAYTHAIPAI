/**
 * Gym notification system - sends in-app alerts and optional email notifications
 * based on each gym's notification preferences in org_settings.
 */
import { createClient } from "@supabase/supabase-js"
import { EmailService } from "@/lib/email-service"

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type NotificationType = "new_booking" | "cancellation" | "payment_received" | "contact_form" | "course_completed" | "cert_eligible"

interface NotifyOptions {
  orgId: string
  type: NotificationType
  title: string
  body: string
  metadata?: Record<string, unknown>
}

interface BookingNotifyData {
  orgId: string
  customerName: string
  customerEmail?: string
  serviceName: string
  bookingDate: string
  bookingTime?: string
  amount: number
  paymentMethod: "cash" | "card" | "stripe"
  paymentStatus: string
}

/**
 * Fetches org notification settings + org info for email context
 */
async function getOrgNotificationConfig(orgId: string) {
  const [{ data: settings }, { data: org }] = await Promise.all([
    serviceClient.from("org_settings").select("*").eq("org_id", orgId).single(),
    serviceClient.from("organizations").select("name, email, slug").eq("id", orgId).single(),
  ])
  return { settings, org }
}

/**
 * Collects all notification email recipients for an org
 */
function getRecipientEmails(settings: Record<string, unknown> | null, orgEmail?: string): string[] {
  const emails = new Set<string>()

  // Primary notification email
  const primary = settings?.notification_email as string | null
  if (primary) emails.add(primary)

  // Additional recipients array
  const additional = settings?.notification_emails as string[] | null
  if (additional?.length) {
    additional.forEach((e) => emails.add(e))
  }

  // Fallback to org email
  if (emails.size === 0 && orgEmail) {
    emails.add(orgEmail)
  }

  return [...emails]
}

/**
 * Insert an in-app notification record
 */
async function insertNotification(opts: NotifyOptions) {
  const { error } = await serviceClient.from("gym_notifications").insert({
    org_id: opts.orgId,
    type: opts.type,
    title: opts.title,
    body: opts.body,
    metadata: opts.metadata || {},
  })
  if (error) {
    console.error("[notifications] Failed to insert notification:", error.message)
  }
}

/**
 * Check if a specific notification type is enabled for the org
 */
function isNotificationEnabled(
  settings: Record<string, unknown> | null,
  type: NotificationType
): boolean {
  if (!settings) return true // Default: enabled if no settings exist

  switch (type) {
    case "new_booking":
      return settings.notify_on_booking_email !== false
    case "cancellation":
      return settings.notify_on_cancellation !== false
    case "payment_received":
      return settings.notify_on_payment !== false
    case "contact_form":
      return true // Always notify on contact forms
    case "course_completed":
    case "cert_eligible":
      return true
    default:
      return true
  }
}

/**
 * Main entry point: notify gym about a new booking
 * - Inserts in-app notification
 * - Sends email to all configured recipients if enabled
 */
export async function notifyNewBooking(data: BookingNotifyData) {
  const { settings, org } = await getOrgNotificationConfig(data.orgId)
  const orgName = org?.name || "Your Gym"

  // Always insert in-app notification
  await insertNotification({
    orgId: data.orgId,
    type: "new_booking",
    title: "New Booking",
    body: `${data.customerName} booked ${data.serviceName} for ${data.bookingDate}${data.bookingTime ? ` at ${data.bookingTime}` : ""}`,
    metadata: {
      customer_name: data.customerName,
      customer_email: data.customerEmail,
      service_name: data.serviceName,
      booking_date: data.bookingDate,
      booking_time: data.bookingTime,
      amount: data.amount,
      payment_method: data.paymentMethod,
      payment_status: data.paymentStatus,
    },
  })

  // Send email if enabled
  if (isNotificationEnabled(settings, "new_booking")) {
    const recipients = getRecipientEmails(settings, org?.email)
    if (recipients.length === 0) return

    const emailService = EmailService.getInstance()
    const emailData = {
      customerName: data.customerName,
      customerEmail: data.customerEmail || "",
      serviceType: data.serviceName,
      bookingDate: data.bookingDate,
      bookingTime: data.bookingTime,
      amount: data.amount,
      paymentId: "",
      paymentMethod: data.paymentMethod === "stripe" || data.paymentMethod === "card"
        ? ("card" as const)
        : ("cash" as const),
      org: {
        orgName,
        orgEmail: org?.email || undefined,
        staffEmail: recipients[0],
      },
    }

    // Send to all recipients
    await Promise.all(
      recipients.map((email) =>
        emailService.sendStaffNotification({
          ...emailData,
          org: { ...emailData.org, staffEmail: email },
        })
      )
    )
  }
}

/**
 * Notify gym about a booking cancellation
 */
export async function notifyBookingCancellation(data: {
  orgId: string
  customerName: string
  serviceName: string
  bookingDate: string
  bookingTime?: string
}) {
  const { settings } = await getOrgNotificationConfig(data.orgId)

  await insertNotification({
    orgId: data.orgId,
    type: "cancellation",
    title: "Booking Cancelled",
    body: `${data.customerName} cancelled ${data.serviceName} on ${data.bookingDate}${data.bookingTime ? ` at ${data.bookingTime}` : ""}`,
    metadata: {
      customer_name: data.customerName,
      service_name: data.serviceName,
      booking_date: data.bookingDate,
    },
  })

  // Email for cancellations could be added here if needed
  // For Phase 1, in-app notification is sufficient
  if (isNotificationEnabled(settings, "cancellation")) {
    // Phase 2: send cancellation email
  }
}

/**
 * Notify gym about a payment received
 */
export async function notifyPaymentReceived(data: {
  orgId: string
  customerName: string
  amount: number
  currency: string
  serviceName: string
}) {
  await insertNotification({
    orgId: data.orgId,
    type: "payment_received",
    title: "Payment Received",
    body: `${data.customerName} paid ${data.currency === "USD" ? "$" : "฿"}${data.amount.toLocaleString()} for ${data.serviceName}`,
    metadata: {
      customer_name: data.customerName,
      amount: data.amount,
      currency: data.currency,
      service_name: data.serviceName,
    },
  })
}

/**
 * Notify gym that a certificate was issued to a student
 */
export async function notifyCertificateIssued(data: {
  orgId: string
  studentName: string
  studentId: string
  levelName: string
  levelNumber: number
  certificateNumber: string
  issuedByName: string
}) {
  await insertNotification({
    orgId: data.orgId,
    type: "cert_eligible",
    title: "Certificate Issued",
    body: `${data.issuedByName} issued a Level ${data.levelNumber} ${data.levelName} certificate to ${data.studentName} (${data.certificateNumber})`,
    metadata: {
      student_id: data.studentId,
      student_name: data.studentName,
      level_name: data.levelName,
      level_number: data.levelNumber,
      certificate_number: data.certificateNumber,
      issued_by_name: data.issuedByName,
    },
  })
}

/**
 * Notify gym that a student completed a course tied to a certification level
 */
export async function notifyCourseCompleted(data: {
  orgId: string
  studentName: string
  studentId: string
  courseTitle: string
  courseId: string
  certificateLevel: string
  levelName: string
}) {
  await insertNotification({
    orgId: data.orgId,
    type: "cert_eligible",
    title: "Certification Eligible",
    body: `${data.studentName} completed "${data.courseTitle}" and is now eligible for ${data.levelName} certification`,
    metadata: {
      student_id: data.studentId,
      student_name: data.studentName,
      course_id: data.courseId,
      course_title: data.courseTitle,
      certificate_level: data.certificateLevel,
      level_name: data.levelName,
    },
  })
}

/**
 * Notify the promoting gym that someone bought a ticket. Fires from
 * the Stripe webhook after payment_status flips to paid. The bell
 * icon in the gym dashboard picks this up; clicking through links to
 * the event's Sales tab so the promoter can see the full order.
 */
export async function notifyTicketSold(data: {
  orgId: string
  eventId: string
  eventName: string
  buyerName: string
  tierName: string
  quantity: number
  totalThb: number
  orderReference: string
}) {
  const ticketsLabel = data.quantity === 1 ? "ticket" : "tickets"
  await insertNotification({
    orgId: data.orgId,
    type: "ticket_sold",
    title: `🎟️ ${data.quantity} ${ticketsLabel} sold — ${data.eventName}`,
    body: `${data.buyerName} bought ${data.quantity}× ${data.tierName} (฿${data.totalThb.toLocaleString()}) · ${data.orderReference}`,
    metadata: {
      event_id: data.eventId,
      event_name: data.eventName,
      buyer_name: data.buyerName,
      tier_name: data.tierName,
      quantity: data.quantity,
      total_thb: data.totalThb,
      order_reference: data.orderReference,
    },
  })
}

/**
 * Notify the promoter that a fighter responded to their bout
 * invitation. Fires alongside the email from Batch Q so the dashboard
 * bell shows the response too. Deep-links via metadata.event_id (the
 * notification bell's getNotificationHref switch handles the route).
 */
export async function notifyInvitationResponded(data: {
  orgId: string
  eventId: string
  eventName: string
  fighterName: string
  action: "accepted" | "declined"
  declineReason?: string | null
}) {
  const emoji = data.action === "accepted" ? "✅" : "✋"
  const verb = data.action === "accepted" ? "accepted" : "declined"
  await insertNotification({
    orgId: data.orgId,
    type: data.action === "accepted" ? "invitation_accepted" : "invitation_declined",
    title: `${emoji} ${data.fighterName} ${verb} — ${data.eventName}`,
    body:
      data.action === "declined" && data.declineReason
        ? `Reason: ${data.declineReason}`
        : data.action === "accepted"
          ? "The bout card is updated. The public fight page now shows them as confirmed."
          : "The corner is open again — invite someone else from the bout editor.",
    metadata: {
      event_id: data.eventId,
      event_name: data.eventName,
      fighter_name: data.fighterName,
      action: data.action,
      decline_reason: data.declineReason ?? null,
    },
  })
}
