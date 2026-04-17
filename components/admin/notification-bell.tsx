"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Bell, Check, CheckCheck, Calendar, XCircle, Banknote, MessageSquare, Award, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"

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
      return <Calendar className="w-4 h-4 text-orange-400" />
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
    default:
      return <Bell className="w-4 h-4 text-neutral-400" />
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
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) fetchNotifications()
        }}
        className="relative p-2 rounded-lg hover:bg-neutral-800 transition-colors"
      >
        <Bell className="w-5 h-5 text-neutral-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-orange-500 text-white text-[10px] font-bold px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={markAllRead}
                disabled={isLoading}
                className="text-xs text-orange-400 hover:text-orange-300 h-auto py-1 px-2"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-neutral-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-neutral-800/50 hover:bg-neutral-800/50 transition-colors cursor-pointer ${
                    !notification.is_read ? "bg-orange-500/5" : ""
                  }`}
                  onClick={() => {
                    if (!notification.is_read) markOneRead(notification.id)
                  }}
                >
                  <div className="mt-0.5 shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium truncate ${!notification.is_read ? "text-white" : "text-neutral-400"}`}>
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <span className="shrink-0 w-2 h-2 rounded-full bg-orange-500" />
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
                      {notification.body}
                    </p>
                    <p className="text-[10px] text-neutral-600 mt-1">
                      {timeAgo(notification.created_at)}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        markOneRead(notification.id)
                      }}
                      className="shrink-0 p-1 rounded hover:bg-neutral-700 transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5 text-neutral-500" />
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
