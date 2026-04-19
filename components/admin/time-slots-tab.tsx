"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Clock,
  Plus,
  Trash2,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"

interface TimeSlot {
  id: string
  start_time: string
  end_time: string | null
  max_bookings: number
  is_active: boolean
  service_id: string | null
  day_of_week: number | null
  services: { name: string } | null
}

interface Service {
  id: string
  name: string
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function formatTime(t: string) {
  return t.slice(0, 5)
}

export default function TimeSlotsTab({ services }: { services: Service[] }) {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({
    start_time: "08:00",
    end_time: "",
    max_bookings: 1,
    service_id: "",
    day_of_week: "",
  })
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const fetchSlots = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/time-slots")
      if (res.ok) {
        const data = await res.json()
        setSlots(data.timeSlots || [])
      }
    } catch {
      // silent
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000)
      return () => clearTimeout(t)
    }
  }, [feedback])

  const handleAdd = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/time-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_time: addForm.start_time + ":00",
          end_time: addForm.end_time ? addForm.end_time + ":00" : null,
          max_bookings: addForm.max_bookings,
          service_id: addForm.service_id || null,
          day_of_week: addForm.day_of_week !== "" ? parseInt(addForm.day_of_week) : null,
        }),
      })
      if (res.ok) {
        setFeedback({ type: "success", message: "Time slot added" })
        setShowAdd(false)
        setAddForm({ start_time: "08:00", end_time: "", max_bookings: 1, service_id: "", day_of_week: "" })
        fetchSlots()
      } else {
        const data = await res.json()
        setFeedback({ type: "error", message: data.error || "Failed" })
      }
    } catch {
      setFeedback({ type: "error", message: "Connection error" })
    }
    setSaving(false)
  }

  const handleToggle = async (slot: TimeSlot) => {
    try {
      const res = await fetch("/api/admin/time-slots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: slot.id, is_active: !slot.is_active }),
      })
      if (res.ok) {
        setSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, is_active: !s.is_active } : s)))
      }
    } catch {
      // silent
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/time-slots?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setSlots((prev) => prev.filter((s) => s.id !== id))
        setFeedback({ type: "success", message: "Time slot removed" })
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to remove" })
    }
  }

  // Group slots: general (no service) vs service-specific
  const generalSlots = slots.filter((s) => !s.service_id)
  const serviceSlots = slots.filter((s) => s.service_id)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <div className={`rounded-lg px-4 py-3 text-sm ${
          feedback.type === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
        }`}>
          {feedback.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Time Slots</h3>
          <p className="text-sm text-neutral-500">Manage when students can book sessions</p>
        </div>
        <Button
          size="sm"
          className="bg-orange-600 hover:bg-orange-700"
          onClick={() => setShowAdd(!showAdd)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Slot
        </Button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Start Time *</label>
                <input
                  type="time"
                  value={addForm.start_time}
                  onChange={(e) => setAddForm({ ...addForm, start_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">End Time</label>
                <input
                  type="time"
                  value={addForm.end_time}
                  onChange={(e) => setAddForm({ ...addForm, end_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Max Bookings</label>
                <input
                  type="number"
                  min={1}
                  value={addForm.max_bookings}
                  onChange={(e) => setAddForm({ ...addForm, max_bookings: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Day (optional)</label>
                <select
                  value={addForm.day_of_week}
                  onChange={(e) => setAddForm({ ...addForm, day_of_week: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="">Every day</option>
                  {DAYS.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Specific Service (optional)</label>
              <select
                value={addForm.service_id}
                onChange={(e) => setAddForm({ ...addForm, service_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-orange-500"
              >
                <option value="">All services (default)</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
                onClick={handleAdd}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Add Time Slot
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAdd(false)}
                className="text-neutral-400"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* General Slots */}
      <div>
        <h4 className="text-sm font-medium text-neutral-400 mb-3">
          Default Slots ({generalSlots.length})
        </h4>
        {generalSlots.length === 0 ? (
          <Card className="bg-neutral-900/30 border-neutral-800 border-dashed">
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
              <p className="text-sm text-neutral-400">No default time slots</p>
              <p className="text-xs text-neutral-600 mt-1">Add slots above — they apply to all services by default</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {generalSlots.map((slot) => (
              <div
                key={slot.id}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                  slot.is_active
                    ? "bg-neutral-900/50 border-neutral-800"
                    : "bg-neutral-900/20 border-neutral-800/50 opacity-50"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">
                    {formatTime(slot.start_time)}
                    {slot.end_time ? ` – ${formatTime(slot.end_time)}` : ""}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {slot.day_of_week !== null && (
                      <span className="text-[10px] text-neutral-500">{DAYS[slot.day_of_week]}</span>
                    )}
                    {slot.max_bookings > 1 && (
                      <span className="text-[10px] text-neutral-500">max {slot.max_bookings}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(slot)}
                  className="p-1 hover:bg-neutral-800 rounded transition-colors"
                  title={slot.is_active ? "Disable" : "Enable"}
                >
                  {slot.is_active ? (
                    <ToggleRight className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-neutral-500" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(slot.id)}
                  className="p-1 hover:bg-red-500/10 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-neutral-600 hover:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service-specific Slots */}
      {serviceSlots.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-neutral-400 mb-3">
            Service-Specific Slots ({serviceSlots.length})
          </h4>
          <div className="space-y-2">
            {serviceSlots.map((slot) => (
              <div
                key={slot.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  slot.is_active
                    ? "bg-neutral-900/50 border-neutral-800"
                    : "bg-neutral-900/20 border-neutral-800/50 opacity-50"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">
                      {formatTime(slot.start_time)}
                      {slot.end_time ? ` – ${formatTime(slot.end_time)}` : ""}
                    </p>
                    {slot.day_of_week !== null && (
                      <Badge className="bg-neutral-800 text-neutral-300 border-0 text-[10px]">
                        {DAYS[slot.day_of_week]}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {(slot.services as { name: string } | null)?.name || "Unknown service"}
                    {slot.max_bookings > 1 ? ` · max ${slot.max_bookings}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleToggle(slot)}
                  className="p-1 hover:bg-neutral-800 rounded transition-colors"
                >
                  {slot.is_active ? (
                    <ToggleRight className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-neutral-500" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(slot.id)}
                  className="p-1 hover:bg-red-500/10 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-neutral-600 hover:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
