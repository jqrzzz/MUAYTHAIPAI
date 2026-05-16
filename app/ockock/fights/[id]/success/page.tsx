/**
 * Ticket purchase success page — where Stripe redirects after checkout.
 *
 * Confirms the order reference back to the buyer. The actual ticket
 * record is created/flipped to paid by the Stripe webhook, not here,
 * so we don't trust the redirect to be the source of truth — we just
 * acknowledge the order reference for visual feedback. The webhook's
 * confirmation email is what guarantees the ticket exists.
 */
import Link from "next/link"
import { CheckCircle2, Mail, Ticket } from "lucide-react"

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ref?: string }>
}

export default async function TicketSuccessPage({ params, searchParams }: Props) {
  const { id: eventId } = await params
  const { ref } = await searchParams
  const reference = ref?.trim() || null

  return (
    <div>
      <div className="mx-auto max-w-lg px-5 py-16">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
          <h1 className="mt-4 text-2xl font-semibold text-white">You&apos;re in.</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Payment received. Your ticket is on its way.
          </p>
          {reference && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-neutral-900 px-4 py-2 font-mono text-sm text-amber-300">
              <Ticket className="h-4 w-4" />
              {reference}
            </div>
          )}
          <div className="mt-6 flex items-start gap-2 rounded-lg bg-neutral-900/60 px-4 py-3 text-left">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
            <p className="text-xs leading-relaxed text-neutral-400">
              We&apos;ve emailed your confirmation with full event details and the order reference shown above. Show this at the door, or have your email ready.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 text-center">
          <Link
            href={`/ockock/fights/${eventId}`}
            className="text-sm text-amber-300 hover:text-amber-200"
          >
            ← Back to the fight card
          </Link>
          <Link
            href="/ockock/fights"
            className="text-xs text-neutral-500 hover:text-neutral-300"
          >
            See other events
          </Link>
        </div>
      </div>
    </div>
  )
}
