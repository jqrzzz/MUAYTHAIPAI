"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, ToggleLeft, ToggleRight } from "lucide-react"

interface Service {
  id: string
  name: string
  description: string | null
  category: string
  price_thb: number
  duration_minutes: number | null
  requires_time_slot: boolean
  is_active: boolean
  is_featured: boolean
  display_order: number
}

const SERVICE_CATEGORIES = [
  { value: "training", label: "Training" },
  { value: "certificate", label: "Certificate" },
  { value: "membership", label: "Membership" },
  { value: "accommodation", label: "Accommodation" },
]

interface ServicesTabProps {
  initialServices: Service[]
  orgId: string
  onFeedback: (type: "success" | "error", message: string) => void
  onServicesChange?: (services: Service[]) => void
}

export default function ServicesTab({ initialServices, orgId, onFeedback, onServicesChange }: ServicesTabProps) {
  const router = useRouter()
  const [services, setServices] = useState(initialServices)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "training",
    price_thb: 0,
    duration_minutes: 60,
    requires_time_slot: true,
    is_active: true,
    is_featured: false,
  })

  const updateServices = (newServices: Service[]) => {
    setServices(newServices)
    onServicesChange?.(newServices)
  }

  const openAdd = () => {
    setEditingService(null)
    setForm({
      name: "", description: "", category: "training", price_thb: 0,
      duration_minutes: 60, requires_time_slot: true, is_active: true, is_featured: false,
    })
    setError("")
    setIsDialogOpen(true)
  }

  const openEdit = (service: Service) => {
    setEditingService(service)
    setForm({
      name: service.name,
      description: service.description || "",
      category: service.category,
      price_thb: service.price_thb,
      duration_minutes: service.duration_minutes || 60,
      requires_time_slot: service.requires_time_slot,
      is_active: service.is_active,
      is_featured: service.is_featured,
    })
    setError("")
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    setError("")
    if (!form.name.trim()) { setError("Service name is required"); return }
    if (form.price_thb <= 0) { setError("Valid price is required"); return }

    setIsSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category,
        price_thb: form.price_thb,
        duration_minutes: form.duration_minutes,
        requires_time_slot: form.requires_time_slot,
        is_active: form.is_active,
        is_featured: form.is_featured,
      }

      if (editingService) {
        const response = await fetch(`/api/admin/services/${editingService.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, org_id: orgId }),
        })
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to update service")
        }
        const { service } = await response.json()
        updateServices(services.map((s) => (s.id === service.id ? service : s)))
      } else {
        const response = await fetch("/api/admin/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, org_id: orgId }),
        })
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to create service")
        }
        const { service } = await response.json()
        updateServices([...services, service])
      }

      setIsDialogOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save service")
    } finally {
      setIsSaving(false)
    }
  }

  const toggleActive = async (service: Service) => {
    setIsUpdating(service.id)
    try {
      const response = await fetch(`/api/admin/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !service.is_active, org_id: orgId }),
      })
      if (response.ok) {
        updateServices(services.map((s) => (s.id === service.id ? { ...s, is_active: !s.is_active } : s)))
      } else {
        onFeedback("error", "Failed to update service")
      }
    } catch {
      onFeedback("error", "Network error — couldn't update service")
    } finally {
      setIsUpdating(null)
    }
  }

  return (
    <>
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Services</CardTitle>
            <CardDescription>Manage services and pricing</CardDescription>
          </div>
          <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.id}
                className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border gap-4 ${
                  service.is_active
                    ? "bg-neutral-800/50 border-neutral-700"
                    : "bg-neutral-800/20 border-neutral-800 opacity-60"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{service.name}</p>
                    {service.is_featured && (
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">Featured</Badge>
                    )}
                  </div>
                  <p className="text-sm text-neutral-400 capitalize">{service.category}</p>
                  {service.duration_minutes && (
                    <p className="text-xs text-neutral-500">{service.duration_minutes} minutes</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-amber-400">฿{service.price_thb.toLocaleString()}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(service)}
                    className="border-neutral-700 hover:bg-neutral-800"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(service)}
                    disabled={isUpdating === service.id}
                    className={
                      service.is_active
                        ? "border-green-700 text-green-400 hover:bg-green-900/30"
                        : "border-red-700 text-red-400 hover:bg-red-900/30"
                    }
                  >
                    {service.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-700 max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-white">{editingService ? "Edit Service" : "Add Service"}</DialogTitle>
            <DialogDescription>
              {editingService ? "Update service details" : "Create a new service"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-neutral-200">Service Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Private Lesson"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-neutral-200">Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) => setForm((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-700">
                  {SERVICE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value} className="text-white">
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-neutral-200">Price (THB) *</Label>
                <Input
                  type="number"
                  value={form.price_thb}
                  onChange={(e) => setForm((prev) => ({ ...prev, price_thb: Number.parseInt(e.target.value) || 0 }))}
                  placeholder="500"
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-200">Duration (min)</Label>
                <Input
                  type="number"
                  value={form.duration_minutes}
                  onChange={(e) => setForm((prev) => ({ ...prev, duration_minutes: Number.parseInt(e.target.value) || 0 }))}
                  placeholder="60"
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-neutral-200">Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requiresTimeSlot"
                  checked={form.requires_time_slot}
                  onChange={(e) => setForm((prev) => ({ ...prev, requires_time_slot: e.target.checked }))}
                  className="w-4 h-4 rounded border-neutral-600 bg-neutral-800"
                />
                <Label htmlFor="requiresTimeSlot" className="text-neutral-300 text-sm">Requires time slot</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={form.is_featured}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_featured: e.target.checked }))}
                  className="w-4 h-4 rounded border-neutral-600 bg-neutral-800"
                />
                <Label htmlFor="isFeatured" className="text-neutral-300 text-sm">Featured</Label>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {isSaving ? "Saving..." : editingService ? "Update Service" : "Add Service"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
