"use client"

/**
 * Social signup CTAs — LINE (real OAuth via Supabase) + WhatsApp (deep-link
 * to a chat with our team for now; a proper WhatsApp OTP via Twilio is a
 * separate, larger build).
 *
 * Green-on-dark pops against the indigo theme. Used on /signup, in the
 * <OckOckGuideBubble> panel, and under the /for-gyms hero CTA.
 *
 * Config:
 *   - LINE: enable the LINE provider in Supabase Auth (dashboard). Without
 *     it, the click shows a friendly fallback message — no crash.
 *   - WhatsApp: set NEXT_PUBLIC_OCKOCK_WHATSAPP_NUMBER (digits with country
 *     code, e.g. "66812345678"). If unset, the WhatsApp button is hidden.
 */
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const LINE_GREEN = "#06C755"
const WA_GREEN = "#25D366"

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_OCKOCK_WHATSAPP_NUMBER || ""
const WHATSAPP_DEFAULT_MSG = "Hi! I'd like to set up my Muay Thai gym with OckOck."

function LineIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.5C6.2 2.5 1.5 6.3 1.5 11c0 4.2 3.7 7.7 8.7 8.4.3.1.8.2.9.5.1.3 0 .8-.1 1.1 0 .3-.2.6.5.3 4.4-2.6 6.9-5.5 6.9-9.3 0-4.7-4.7-8.5-10.5-8.5zm-3.4 11.2H6.5c-.2 0-.4-.2-.4-.4V9.6c0-.2.2-.4.4-.4s.4.2.4.4v3.3h1.7c.2 0 .4.2.4.4s-.2.4-.4.4zm1.4-.4c0 .2-.2.4-.4.4s-.4-.2-.4-.4V9.6c0-.2.2-.4.4-.4s.4.2.4.4v3.7zm4 0c0 .2-.1.3-.3.4-.1.1-.3 0-.4-.1l-1.9-2.5v2.2c0 .2-.2.4-.4.4s-.4-.2-.4-.4V9.6c0-.2.1-.3.3-.4.1 0 .2 0 .2 0 .1 0 .2.1.3.2l1.9 2.5V9.6c0-.2.2-.4.4-.4s.4.2.4.4v3.7zm2.5-2.2h1.5c.2 0 .4.2.4.4s-.2.4-.4.4h-1.5v.9h1.5c.2 0 .4.2.4.4s-.2.4-.4.4h-2c-.2 0-.4-.2-.4-.4V9.6c0-.2.2-.4.4-.4h2c.2 0 .4.2.4.4s-.2.4-.4.4h-1.5v.9z" />
    </svg>
  )
}

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.6 14.2c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1-1.1 2.5s1.1 2.9 1.3 3.1c.2.2 2.2 3.4 5.3 4.7.7.3 1.3.5 1.8.6.7.2 1.4.2 2 .1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4 0-.2-.2-.3-.5-.4zM12 2A10 10 0 0 0 2 12c0 1.8.5 3.5 1.4 5L2 22l5.1-1.3c1.4.8 3 1.3 4.9 1.3a10 10 0 0 0 0-20zm0 18.2c-1.7 0-3.3-.5-4.7-1.3l-.3-.2-3.4.9.9-3.3-.2-.3a8.2 8.2 0 0 1-1.3-4.4c0-4.5 3.7-8.2 8.2-8.2 2.2 0 4.3.9 5.8 2.4a8.1 8.1 0 0 1 2.4 5.8c0 4.5-3.7 8.2-8.2 8.2z" />
    </svg>
  )
}

interface Props {
  /** Where to land after LINE OAuth. Default: /admin (it'll bounce the user into the gym setup flow if they're new). */
  next?: string
  /** Tighter spacing + smaller buttons, for in-bubble placement. */
  compact?: boolean
  /** Optional label above the buttons. */
  label?: string
  /** Render the WhatsApp-to-sales button next to LINE. Turn off on login /
   *  invite surfaces, where a sales deep-link doesn't belong. Default: true. */
  showWhatsApp?: boolean
  className?: string
}

export function SocialSignupButtons({
  next = "/admin",
  compact = false,
  label,
  showWhatsApp = true,
  className,
}: Props) {
  const [busy, setBusy] = useState<"line" | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onLine = async () => {
    setBusy("line")
    setError(null)
    try {
      const supabase = createClient()
      const origin = window.location.origin
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        // 'line' may not yet be in the type union depending on the SDK
        // version; the runtime accepts any provider Supabase has enabled.
        provider: "line" as never,
        options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
      })
      if (oauthErr) {
        setError(
          /not enabled|not supported|invalid provider/i.test(oauthErr.message)
            ? "LINE sign-in is being set up — use email or WhatsApp for now."
            : oauthErr.message,
        )
        setBusy(null)
      }
      // On success the browser redirects to LINE; no need to clear busy here.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start LINE sign-in")
      setBusy(null)
    }
  }

  const waLink = showWhatsApp && WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MSG)}`
    : null

  const btnSize = compact ? "h-9 text-[13px]" : "h-10 text-[14px]"

  return (
    <div className={className}>
      {label && (
        <p className={`mb-2 text-center text-[11px] uppercase tracking-[0.18em] text-zinc-500`}>
          {label}
        </p>
      )}
      <div className={`grid ${waLink ? "grid-cols-2" : "grid-cols-1"} gap-2`}>
        <button
          type="button"
          onClick={onLine}
          disabled={busy === "line"}
          style={{ backgroundColor: LINE_GREEN }}
          className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 ${btnSize}`}
          aria-label="Continue with LINE"
        >
          {busy === "line" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LineIcon className="h-4 w-4" />}
          LINE
        </button>
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ backgroundColor: WA_GREEN }}
            className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 font-semibold text-white transition-opacity hover:opacity-90 ${btnSize}`}
            aria-label="Continue with WhatsApp"
          >
            <WhatsAppIcon className="h-4 w-4" />
            WhatsApp
          </a>
        )}
      </div>
      {error && (
        <p className="mt-2 text-center text-[12px] text-amber-300">{error}</p>
      )}
    </div>
  )
}
