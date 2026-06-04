/**
 * Single source of truth for the MUAYTHAIPAI *network* identity — the sender
 * name, addresses, and URL used for network-level mail (certificates,
 * ticket/fight confirmations, gym-network invites) and as the fallback sender
 * when a tenant email is sent with no org context.
 *
 * Centralized so a future re-domain is one edit, not a repo-wide sweep.
 *
 * IMPORTANT: these are the CURRENT production values, preserved exactly —
 * including the historical domain split (outbound sending uses
 * muaythaipai.com; the support/reply inbox is support@paimuaythai.com).
 * Consolidating onto a single domain is a deliberate follow-up that depends on
 * which mailboxes exist and which domains are Resend-verified. Do NOT change an
 * address here without confirming that, or mail will silently bounce.
 */
const NAME = "MUAYTHAIPAI"
const FROM_EMAIL = "noreply@muaythaipai.com" // Resend-verified sending domain
const SUPPORT_EMAIL = "support@paimuaythai.com" // monitored reply inbox — preserve

export const NETWORK = {
  name: NAME,
  /** Sending address for network-level mail (verified domain). */
  fromEmail: FROM_EMAIL,
  /** Public contact address. */
  contactEmail: "hello@muaythaipai.com",
  /** Support reply inbox. */
  supportEmail: SUPPORT_EMAIL,
  /** Canonical network URL (env override wins). */
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://muaythaipai.com",
  /** Pre-formatted From headers. */
  from: `${NAME} <${FROM_EMAIL}>`,
  supportFrom: `${NAME} Support <${SUPPORT_EMAIL}>`,
} as const
