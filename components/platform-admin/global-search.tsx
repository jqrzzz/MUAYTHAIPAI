"use client"

/**
 * Cmd+K global search modal for /platform-admin.
 *
 * Hotkey: Cmd/Ctrl+K toggles open. Esc closes. ↑↓ navigate, Enter
 * jumps. Debounced fetch (180ms). Categorizes results into Gyms /
 * Users / Bookings / Discovered / Tickets / Stripe.
 */
import { useCallback, useEffect, useRef, useState } from "react"
import {
  Building2,
  Calendar,
  ExternalLink,
  LifeBuoy,
  Map,
  Search,
  User,
  X,
  type LucideIcon,
} from "lucide-react"

interface Result {
  kind: "gym" | "user" | "booking" | "discovered_gym" | "stripe" | "ticket"
  id: string
  label: string
  sub?: string
  jump_to: string
  score: number
}

const KIND_LABEL: Record<Result["kind"], string> = {
  gym: "Gyms",
  user: "Users",
  booking: "Bookings",
  discovered_gym: "Discovery",
  ticket: "Support tickets",
  stripe: "Stripe",
}

const KIND_ICON: Record<Result["kind"], LucideIcon> = {
  gym: Building2,
  user: User,
  booking: Calendar,
  discovered_gym: Map,
  ticket: LifeBuoy,
  stripe: ExternalLink,
}

export function GlobalSearchButton() {
  const [open, setOpen] = useState(false)

  // Hotkey
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((s) => !s)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 ring-1 ring-zinc-800 px-2.5 py-1.5 text-[12px] text-zinc-500 hover:text-zinc-200 transition-colors"
        title="Search (⌘K)"
      >
        <Search className="h-3 w-3" />
        <span className="hidden md:inline">Search</span>
        <span className="hidden md:inline text-[10px] text-zinc-600 font-mono ml-1">⌘K</span>
      </button>
      {open && <SearchModal onClose={() => setOpen(false)} />}
    </>
  )
}

function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Debounced fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/platform-admin/search?q=${encodeURIComponent(query.trim())}`,
          { cache: "no-store" },
        )
        const data = await res.json()
        if (res.ok) {
          setResults(data.results ?? [])
          setActiveIndex(0)
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }, 180)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const jump = useCallback(
    (r: Result) => {
      if (r.jump_to.startsWith("http")) {
        window.open(r.jump_to, "_blank", "noopener,noreferrer")
      } else {
        window.location.href = r.jump_to
      }
      onClose()
    },
    [onClose],
  )

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onClose()
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(0, i - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const r = results[activeIndex]
      if (r) jump(r)
    }
  }

  // Group results by kind for the section headers
  const grouped = results.reduce<Record<Result["kind"], Result[]>>(
    (acc, r) => {
      if (!acc[r.kind]) acc[r.kind] = []
      acc[r.kind].push(r)
      return acc
    },
    {} as Record<Result["kind"], Result[]>,
  )

  // Build a flat index → kind mapping for keyboard nav
  const flat: Result[] = []
  for (const kind of Object.keys(grouped) as Result["kind"][]) {
    for (const r of grouped[kind]) flat.push(r)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl ring-1 ring-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-900">
          <Search className="h-4 w-4 text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search gyms, users, bookings, Stripe IDs…"
            className="flex-1 bg-transparent outline-none text-[14px] text-zinc-100 placeholder:text-zinc-600"
          />
          <kbd className="hidden md:inline text-[10px] text-zinc-600 font-mono">esc</kbd>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 p-1 -mr-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim().length < 2 ? (
            <div className="px-4 py-8 text-center text-[12px] text-zinc-500">
              Type at least 2 characters to search.
              <p className="text-[10px] text-zinc-600 mt-2">
                Tries: gym name, slug, user email, customer name, Stripe charge
                or PaymentIntent ID, ticket subject.
              </p>
            </div>
          ) : loading && results.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12px] text-zinc-500">
              Searching…
            </div>
          ) : flat.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12px] text-zinc-500">
              No matches for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              {(Object.keys(grouped) as Result["kind"][]).map((kind) => (
                <div key={kind}>
                  <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                    {KIND_LABEL[kind]}
                  </div>
                  <ul>
                    {grouped[kind].map((r) => {
                      const Icon = KIND_ICON[r.kind]
                      const flatIdx = flat.findIndex((x) => x.id === r.id && x.kind === r.kind)
                      const active = flatIdx === activeIndex
                      return (
                        <li key={`${r.kind}:${r.id}`}>
                          <button
                            onClick={() => jump(r)}
                            onMouseEnter={() => setActiveIndex(flatIdx)}
                            className={`w-full text-left px-4 py-2 flex items-center gap-3 text-[12px] transition-colors ${
                              active
                                ? "bg-indigo-500/10 ring-1 ring-inset ring-indigo-500/20"
                                : "hover:bg-zinc-900/40"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-zinc-100 truncate">{r.label}</p>
                              {r.sub && (
                                <p className="text-[10px] text-zinc-600 truncate">
                                  {r.sub}
                                </p>
                              )}
                            </div>
                            {r.kind === "stripe" && (
                              <ExternalLink className="h-2.5 w-2.5 text-zinc-600 shrink-0" />
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
              <div className="px-4 py-2 border-t border-zinc-900 text-[10px] text-zinc-600 flex items-center gap-3">
                <span>
                  <kbd className="font-mono">↑↓</kbd> navigate
                </span>
                <span>
                  <kbd className="font-mono">↵</kbd> open
                </span>
                <span>
                  <kbd className="font-mono">esc</kbd> close
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
