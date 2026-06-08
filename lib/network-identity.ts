/**
 * Single source of truth for the MUAYTHAIPAI *network* identity — the sender
 * name, addresses, and URL used for network-level mail (certificates,
 * ticket/fight confirmations, gym-network invites) and as the fallback sender
 * when a tenant email is sent with no org context.
 *
 * Centralized so a future re-domain is one edit, not a repo-wide sweep.
 *
 * SENDING DOMAIN: paimuaythai.com is the Resend-verified domain (confirmed with
 * the owner, June 2026) — every outbound `from:` address here lives on it.
 * muaythaipai.com is the public/brand URL only and is NOT verified in Resend,
 * so it must never appear in a sender address or mail silently bounces. Do NOT
 * move a sending address off paimuaythai.com without verifying the new domain
 * in Resend first.
 */
const NAME = "MUAYTHAIPAI"
const FROM_EMAIL = "noreply@paimuaythai.com" // Resend-verified sending domain
const SUPPORT_EMAIL = "support@paimuaythai.com" // monitored reply inbox

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
