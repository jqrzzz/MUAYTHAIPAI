"use client"

/**
 * Packages tab — gym admin manages their catalog of credit bundles.
 *
 * Each package = "10-class pack, ฿2,500, 90-day expiry" or "1-month
 * unlimited, ฿5,000, 30-day expiry" — the named bundles a gym sells.
 *
 * Selling a package to a student happens from the student profile page
 * (/admin/students/[id] → "Sell package" action). That POSTs to
 * /api/admin/students/[id]/buy-package which creates the corresponding
 * student_credits row.
 */

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Loader2,
  Package as PackageIcon,
  Plus,
  Pencil,
  Trash2,
  Star,
  Power,
} from "lucide-react"

interface GymPackage {
  id: string
  name: string
  description: string | null
  display_order: number
  price_thb: number
  price_usd: number | null
  credit_type: string
  credit_count: number | null
  duration_days: number | null
  is_active: boolean
  is_featured: boolean
  created_at: string
}

interface FormState {
  name: string
  description: string
  price_thb: string
  credit_type: string
  credit_count: string
  duration_days: string
  is_featured: boolean
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  price_thb: "",
  credit_type: "sessions",
  credit_count: "",
  duration_days: "",
  is_featured: false,
}

export default function PackagesTab() {
  const [packages, setPackages] = useState<GymPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<GymPackage | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/packages", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to load")
      setPackages(data.packages as GymPackage[])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function openNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setOpen(true)
  }

  function openEdit(pkg: GymPackage) {
    setEditing(pkg)
    setForm({
      name: pkg.name,
      description: pkg.description ?? "",
      price_thb: String(pkg.price_thb),
      credit_type: pkg.credit_type,
      credit_count: pkg.credit_count != null ? String(pkg.credit_count) : "",
      duration_days:
        pkg.duration_days != null ? String(pkg.duration_days) : "",
      is_featured: pkg.is_featured,
    })
    setOpen(true)
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price_thb: Number(form.price_thb || 0),
        credit_type: form.credit_type.trim() || "sessions",
        credit_count: form.credit_count ? Number(form.credit_count) : null,
        duration_days: form.duration_days ? Number(form.duration_days) : null,
        is_featured: form.is_featured,
      }
      const res = editing
        ? await fetch(`/api/admin/packages/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/admin/packages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Save failed")
      setOpen(false)
      setEditing(null)
      setForm(EMPTY_FORM)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(pkg: GymPackage) {
    await fetch(`/api/admin/packages/${pkg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !pkg.is_active }),
    })
    await load()
  }

  async function deletePkg(pkg: GymPackage) {
    if (
      !confirm(
        `Archive "${pkg.name}"? Existing student credits keep their balance — only future sales stop.`,
      )
    ) {
      return
    }
    await fetch(`/api/admin/packages/${pkg.id}`, { method: "DELETE" })
    await load()
  }

  return (
    <div className="space-y-4">
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <PackageIcon className="w-5 h-5 text-indigo-300" />
              Packages
            </CardTitle>
            <CardDescription>
              Named credit bundles you sell — &ldquo;10-class pack&rdquo;,
              &ldquo;1-month unlimited&rdquo;, etc. Sell them from any
              student&apos;s profile page.
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={openNew}
            className="bg-indigo-500 hover:bg-indigo-400 text-white"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New package
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 mb-3">
              {error}
            </div>
          )}
          {loading && packages.length === 0 ? (
            <div className="py-8 text-center text-neutral-500 text-sm">
              <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
              Loading packages…
            </div>
          ) : packages.length === 0 ? (
            <div className="py-10 text-center text-neutral-500">
              <PackageIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No packages yet.</p>
              <p className="text-xs mt-1">
                Add your first one — e.g. &ldquo;10-class pack, ฿2,500, 90-day expiry&rdquo;.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`rounded-xl border p-4 ${
                    pkg.is_active
                      ? "border-neutral-700 bg-neutral-900"
                      : "border-neutral-800 bg-neutral-900/30 opacity-70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">
                        {pkg.name}
                      </p>
                      <p className="text-2xl font-bold text-indigo-300 mt-0.5">
                        ฿{pkg.price_thb.toLocaleString()}
                      </p>
                    </div>
                    {pkg.is_featured && (
                      <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px]">
                        <Star className="h-2.5 w-2.5 mr-0.5" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  {pkg.description && (
                    <p className="text-xs text-neutral-400 mb-3 line-clamp-2">
                      {pkg.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 text-[11px] text-neutral-300 mb-3">
                    <Badge
                      variant="outline"
                      className="border-neutral-700 text-neutral-300"
                    >
                      {pkg.credit_count != null
                        ? `${pkg.credit_count} ${pkg.credit_type}`
                        : `Unlimited ${pkg.credit_type}`}
                    </Badge>
                    {pkg.duration_days != null && (
                      <Badge
                        variant="outline"
                        className="border-neutral-700 text-neutral-300"
                      >
                        {pkg.duration_days}-day expiry
                      </Badge>
                    )}
                    {!pkg.is_active && (
                      <Badge
                        variant="outline"
                        className="border-red-700/40 text-red-300"
                      >
                        Archived
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(pkg)}
                      className="text-neutral-400 hover:text-white text-xs h-7 px-2"
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleActive(pkg)}
                      className="text-neutral-400 hover:text-white text-xs h-7 px-2"
                    >
                      <Power className="w-3 h-3 mr-1" />
                      {pkg.is_active ? "Archive" : "Reactivate"}
                    </Button>
                    {pkg.is_active && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deletePkg(pkg)}
                        className="text-red-400 hover:text-red-300 text-xs h-7 px-2 ml-auto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-700 max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editing ? "Edit package" : "New package"}
            </DialogTitle>
            <DialogDescription>
              Define what students get when they buy this package.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-neutral-300">Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. 10-class pack"
                className="bg-neutral-800 border-neutral-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-neutral-300">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
                placeholder="Optional. Shows on the student profile when selling."
                className="bg-neutral-800 border-neutral-700 text-white mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-neutral-300">Price (THB) *</Label>
                <Input
                  type="number"
                  value={form.price_thb}
                  onChange={(e) =>
                    setForm({ ...form, price_thb: e.target.value })
                  }
                  placeholder="2500"
                  className="bg-neutral-800 border-neutral-700 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-neutral-300">Credit type</Label>
                <Input
                  value={form.credit_type}
                  onChange={(e) =>
                    setForm({ ...form, credit_type: e.target.value })
                  }
                  placeholder="sessions"
                  className="bg-neutral-800 border-neutral-700 text-white mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-neutral-300">
                  Credit count
                  <span className="text-neutral-500 text-xs ml-1">
                    (blank = unlimited)
                  </span>
                </Label>
                <Input
                  type="number"
                  value={form.credit_count}
                  onChange={(e) =>
                    setForm({ ...form, credit_count: e.target.value })
                  }
                  placeholder="10"
                  className="bg-neutral-800 border-neutral-700 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-neutral-300">
                  Expiry (days)
                  <span className="text-neutral-500 text-xs ml-1">
                    (blank = no expiry)
                  </span>
                </Label>
                <Input
                  type="number"
                  value={form.duration_days}
                  onChange={(e) =>
                    setForm({ ...form, duration_days: e.target.value })
                  }
                  placeholder="90"
                  className="bg-neutral-800 border-neutral-700 text-white mt-1"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-neutral-300">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) =>
                  setForm({ ...form, is_featured: e.target.checked })
                }
                className="rounded"
              />
              Featured (highlighted at the top of the catalog)
            </label>
            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={save}
              disabled={saving || !form.name.trim() || !form.price_thb}
              className="bg-indigo-500 hover:bg-indigo-400 text-white"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : null}
              {editing ? "Save changes" : "Create package"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={saving}
              className="text-neutral-400"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
