"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Bell, Check, CheckCheck, Calendar, XCircle, Banknote, MessageSquare, Award, GraduationCap, Ticket } from "lucide-react"

interface Notification {
  id: string
  type: string
  title: string
  body: string
  metadata: Record<string, unknown>
  is_read: boolean
  created_at: string
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "new_booking":
      return <Calendar className="w-4 h-4 text-indigo-300" />
    case "cancellation":
      return <XCircle className="w-4 h-4 text-red-400" />
    case "payment_received":
      return <Banknote className="w-4 h-4 text-emerald-400" />
    case "contact_form":
      return <MessageSquare className="w-4 h-4 text-blue-400" />
    case "cert_eligible":
      return <Award className="w-4 h-4 text-amber-400" />
    case "course_completed":
      return <GraduationCap className="w-4 h-4 text-purple-400" />
    case "ticket_sold":
      return <Ticket className="w-4 h-4 text-amber-400" />
    default:
      return <Bell className="w-4 h-4 text-zinc-400" />
  }
}

// Per-type deeplink target. Returns null if there's no useful place to
// send the user (just marks read on click). Pull keys from metadata so
// callers can be lazy and just pass IDs without crafting URLs.
function getNotificationHref(n: Notification): string | null {
  const m = n.metadata || {}
  switch (n.type) {
    case "ticket_sold": {
      const eventId = (m.event_id as string | undefined) ?? null
      return eventId ? `/ockock/promoter/events/${eventId}` : null
    }
    default:
      return null
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)

  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications?limit=15")
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
    } catch {
      // Silently fail — non-critical
    }
  }, [])

  // Fetch on mount and poll every 30 seconds
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClick)
      return () => document.removeEventListener("mousedown", handleClick)
    }
  }, [isOpen])

  const markAllRead = async () => {
    setIsLoading(true)
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all_read: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false)
    }
  }

  const markOneRead = async (id: string) => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_ids: [id] }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // Silently fail
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) fetchNotifications()
        }}
        className="relative p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] rounded-full bg-indigo-500 ring-2 ring-zinc-950 text-white text-[9px] font-bold px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-1rem)] rounded-xl ring-1 ring-zinc-800 bg-zinc-950/95 backdrop-blur-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-900">
            <h3 className="text-[13px] font-semibold text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={isLoading}
                className="inline-flex items-center gap-1 text-[11px] text-indigo-300 hover:text-indigo-200 px-2 py-1 rounded transition-colors disabled:opacity-50"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-zinc-600">
                <Bell className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p className="text-[12px]">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 px-4 py-2.5 border-b border-zinc-900/60 hover:bg-zinc-900/40 transition-colors cursor-pointer ${
                    !notification.is_read ? "bg-indigo-500/[0.04]" : ""
                  }`}
                  onClick={() => {
                    if (!notification.is_read) markOneRead(notification.id)
                    // Navigate to the per-notification deeplink target
                    // if there is one. Mark-read fires first so the row
                    // shows the read state immediately even if the page
                    // hasn't navigated yet.
                    const href = getNotificationHref(notification)
                    if (href && typeof window !== "undefined") {
                      window.location.href = href
                    }
                  }}
                >
                  <div className="mt-0.5 shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-[13px] font-medium truncate ${
                          !notification.is_read ? "text-white" : "text-zinc-400"
                        }`}
                      >
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      )}
                    </div>
                    <p className="text-[12px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {notification.body}
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-1">
                      {timeAgo(notification.created_at)}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        markOneRead(notification.id)
                      }}
                      className="shrink-0 p-1 rounded hover:bg-zinc-800 transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-3 h-3 text-zinc-500" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
