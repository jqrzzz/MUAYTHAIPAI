"use client"

import { useEffect } from "react"
import Image from "next/image"
import { ArrowRight, Clock, Calendar, Dumbbell } from "lucide-react"

interface Gym {
  id: string
  name: string
  name_th: string | null
  slug: string
  logo_url: string | null
}

interface Service {
  id: string
  name: string
  description: string | null
  price_thb: number | null
  duration_minutes: number | null
  duration_days: number | null
  category: string | null
}

interface EmbedClientProps {
  gym: Gym
  services: Service[]
}

const SITE_ORIGIN =
  typeof window !== "undefined" ? window.location.origin : "https://muaythaipai.com"

function formatDuration(s: Service): string | null {
  if (s.duration_days) return `${s.duration_days} day${s.duration_days === 1 ? "" : "s"}`
  if (s.duration_minutes) return `${s.duration_minutes} min`
  return null
}

export default function EmbedClient({ gym, services }: EmbedClientProps) {
  // Tell the parent page our height so it can resize the iframe.
  useEffect(() => {
    const reportHeight = () => {
      if (typeof window === "undefined" || window.parent === window) return
      const height = document.documentElement.scrollHeight
      window.parent.postMessage(
        { type: "ockock:embed:resize", slug: gym.slug, height },
        "*"
      )
    }
    reportHeight()
    const observer = new ResizeObserver(reportHeight)
    observer.observe(document.documentElement)
    return () => observer.disconnect()
  }, [gym.slug])

  const bookHref = `${SITE_ORIGIN}/book?gym=${encodeURIComponent(gym.slug)}`

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-white">
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Header */}
        <header className="flex items-center gap-3 mb-6">
          {gym.logo_url ? (
            <Image
              src={gym.logo_url}
              alt={`${gym.name} logo`}
              width={48}
              height={48}
              className="rounded-full border border-neutral-200 dark:border-white/10"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10 text-2xl">
              🥊
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg truncate">{gym.name}</h1>
            {gym.name_th && (
              <p className="text-xs text-neutral-500 truncate">{gym.name_th}</p>
            )}
          </div>
        </header>

        {/* Services */}
        {services.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 dark:border-white/10 p-6 text-center">
            <Dumbbell className="mx-auto h-6 w-6 text-neutral-400 mb-2" />
            <p className="text-sm text-neutral-500">
              No bookable services yet. Check back soon.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {services.map((s) => {
              const duration = formatDuration(s)
              return (
                <li
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.03] p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{s.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500">
                      {duration && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {duration}
                        </span>
                      )}
                      {s.price_thb !== null && s.price_thb > 0 && (
                        <span className="inline-flex items-center gap-1">
                          ฿{s.price_thb.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={bookHref}
                    target="_top"
                    rel="noopener"
                    className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-400 shrink-0"
                  >
                    Book
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </li>
              )
            })}
          </ul>
        )}

        {/* Primary CTA */}
        {services.length > 0 && (
          <a
            href={bookHref}
            target="_top"
            rel="noopener"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-bold text-white hover:bg-orange-400 shadow-lg shadow-orange-500/20"
          >
            <Calendar className="h-4 w-4" />
            Book at {gym.name}
            <ArrowRight className="h-4 w-4" />
          </a>
        )}

        {/* Powered by */}
        <p className="mt-5 text-center text-[11px] text-neutral-400 dark:text-neutral-600">
          <a
            href={`${SITE_ORIGIN}/for-gyms`}
            target="_top"
            rel="noopener"
            className="hover:text-neutral-600 dark:hover:text-neutral-400"
          >
            <span className="text-base align-middle">🐃</span> Powered by OckOck
          </a>
        </p>
      </div>
    </div>
  )
}
