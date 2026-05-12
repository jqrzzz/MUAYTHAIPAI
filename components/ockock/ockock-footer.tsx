/**
 * OckOckFooter — the public footer for the OckOck product site. A real
 * footer (brand blurb + product links), not the Pai gym's bottom-nav.
 * Dark / Inter, server component.
 */
import Link from "next/link"

const FOOTER_LINKS = [
  { href: "/for-gyms", label: "Overview" },
  { href: "/for-gyms#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/login", label: "Log in" },
  { href: "/signup", label: "Start free trial" },
] as const

export function OckOckFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-zinc-900/80 bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-lg leading-none">🐃</span>
              <span className="text-[15px] font-semibold tracking-[0.04em] text-zinc-100">OckOck</span>
            </div>
            <p className="text-[13px] leading-relaxed text-zinc-500">
              The friendly way to run a Muay Thai gym in Thailand — bookings, the
              Naga–Garuda cert ladder, and a receptionist who answers your
              customers in your gym&apos;s voice.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[13px] text-zinc-400 transition-colors hover:text-zinc-100"
              >
                {l.label}
              </Link>
            ))}
            <a
              href="mailto:hello@muaythaipai.com"
              className="text-[13px] text-zinc-400 transition-colors hover:text-zinc-100"
            >
              Contact
            </a>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-1.5 border-t border-zinc-900/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-zinc-600">
            © {year} OckOck · Part of the MUAYTHAIPAI network
          </p>
          <p className="text-[12px] text-zinc-600">Made in Thailand 🇹🇭</p>
        </div>
      </div>
    </footer>
  )
}
