/**
 * OckOckFooter — the public footer for the OckOck product site. A real
 * footer (brand blurb + link columns), not the Pai gym's bottom-nav.
 * Dark / Inter, server component.
 */
import Link from "next/link"

const PRODUCT_LINKS = [
  { href: "/for-gyms", label: "Overview" },
  { href: "/for-gyms#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/signup", label: "Start free trial" },
  { href: "/login", label: "Log in" },
] as const

const COMPANY_LINKS = [
  { href: "/vision", label: "Our story" },
  { href: "/about", label: "About" },
  { href: "mailto:hello@muaythaipai.com", label: "Contact", external: true },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
] as const

function FooterLink({ href, label, external }: { href: string; label: string; external?: boolean }) {
  const cls = "text-[13px] text-zinc-400 transition-colors hover:text-zinc-100"
  return external ? (
    <a href={href} className={cls}>
      {label}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {label}
    </Link>
  )
}

export function OckOckFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-zinc-900/80 bg-zinc-950 print:hidden">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-[1.4fr_1fr_1fr]">
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

          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-zinc-600">Product</p>
            <ul className="space-y-2">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.href}>
                  <FooterLink {...l} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-zinc-600">Company</p>
            <ul className="space-y-2">
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}>
                  <FooterLink {...l} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-1.5 border-t border-zinc-900/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-zinc-600">© {year} OckOck · Part of the MUAYTHAIPAI network</p>
          <p className="text-[12px] text-zinc-600">Made in Thailand 🇹🇭</p>
        </div>
      </div>
    </footer>
  )
}
