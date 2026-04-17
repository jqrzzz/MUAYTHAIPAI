"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Users,
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Mail,
  RefreshCw,
  User,
} from "lucide-react"
import Image from "next/image"

interface Trainer {
  id: string
  display_name: string
  title: string | null
  bio: string | null
  photo_url: string | null
  specialties: string[]
  is_available: boolean
  is_featured: boolean
  availability_note: string | null
  years_experience: number | null
  fight_record_wins: number
  fight_record_losses: number
  fight_record_draws: number
}

interface TrainersTabProps {
  initialTrainers: Trainer[]
  orgId: string
  onFeedback: (type: "success" | "error", message: string) => void
}

export default function TrainersTab({ initialTrainers, orgId, onFeedback }: TrainersTabProps) {
  const router = useRouter()
  const [trainers, setTrainers] = useState(initialTrainers)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const [isTrainerDialogOpen, setIsTrainerDialogOpen] = useState(false)
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null)
  const [isSavingTrainer, setIsSavingTrainer] = useState(false)
  const [trainerError, setTrainerError] = useState("")
  const [trainerForm, setTrainerForm] = useState({
    display_name: "", title: "", bio: "", specialties: "",
    is_available: true, is_featured: false,
    years_experience: 0, fight_record_wins: 0, fight_record_losses: 0, fight_record_draws: 0,
  })

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState("")
  const [inviteSuccess, setInviteSuccess] = useState("")

  const [pendingInvites, setPendingInvites] = useState<{ id: string; email: string; role: string; created_at: string; expires_at: string }[]>([])
  const [resendingInvite, setResendingInvite] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingInvites()
  }, [])

  const fetchPendingInvites = async () => {
    try {
      const res = await fetch("/api/admin/invites")
      if (res.ok) {
        const data = await res.json()
        setPendingInvites(data.invites || [])
      }
    } catch { /* non-critical */ }
  }

  const openAddTrainer = () => {
    setEditingTrainer(null)
    setTrainerForm({
      display_name: "", title: "", bio: "", specialties: "",
      is_available: true, is_featured: false,
      years_experience: 0, fight_record_wins: 0, fight_record_losses: 0, fight_record_draws: 0,
    })
    setTrainerError("")
    setIsTrainerDialogOpen(true)
  }

  const openEditTrainer = (trainer: Trainer) => {
    setEditingTrainer(trainer)
    setTrainerForm({
      display_name: trainer.display_name,
      title: trainer.title || "",
      bio: trainer.bio || "",
      specialties: trainer.specialties?.join(", ") || "",
      is_available: trainer.is_available,
      is_featured: trainer.is_featured,
      years_experience: trainer.years_experience || 0,
      fight_record_wins: trainer.fight_record_wins || 0,
      fight_record_losses: trainer.fight_record_losses || 0,
      fight_record_draws: trainer.fight_record_draws || 0,
    })
    setTrainerError("")
    setIsTrainerDialogOpen(true)
  }

  const handleSaveTrainer = async () => {
    setTrainerError("")
    if (!trainerForm.display_name.trim()) { setTrainerError("Trainer name is required"); return }

    setIsSavingTrainer(true)
    try {
      const specialtiesArray = trainerForm.specialties.split(",").map((s) => s.trim()).filter((s) => s.length > 0)
      const payload = {
        display_name: trainerForm.display_name.trim(),
        title: trainerForm.title.trim() || null,
        bio: trainerForm.bio.trim() || null,
        specialties: specialtiesArray,
        is_available: trainerForm.is_available,
        is_featured: trainerForm.is_featured,
        years_experience: trainerForm.years_experience,
        fight_record_wins: trainerForm.fight_record_wins,
        fight_record_losses: trainerForm.fight_record_losses,
        fight_record_draws: trainerForm.fight_record_draws,
      }

      if (editingTrainer) {
        const response = await fetch(`/api/admin/trainers/${editingTrainer.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, org_id: orgId }),
        })
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to update trainer")
        }
        const { trainer } = await response.json()
        setTrainers((prev) => prev.map((t) => (t.id === trainer.id ? trainer : t)))
      } else {
        const response = await fetch("/api/admin/trainers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, org_id: orgId }),
        })
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to add trainer")
        }
        const { trainer } = await response.json()
        setTrainers((prev) => [...prev, trainer])
      }

      setIsTrainerDialogOpen(false)
      router.refresh()
    } catch (error) {
      setTrainerError(error instanceof Error ? error.message : "Failed to save trainer")
    } finally {
      setIsSavingTrainer(false)
    }
  }

  const toggleTrainerAvailable = async (trainer: Trainer) => {
    setIsUpdating(trainer.id)
    try {
      const response = await fetch(`/api/admin/trainers/${trainer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_available: !trainer.is_available, org_id: orgId }),
      })
      if (response.ok) {
        setTrainers((prev) => prev.map((t) => (t.id === trainer.id ? { ...t, is_available: !t.is_available } : t)))
      } else {
        onFeedback("error", "Failed to update trainer availability")
      }
    } catch {
      onFeedback("error", "Network error — couldn't update trainer")
    } finally {
      setIsUpdating(null)
    }
  }

  const deleteTrainer = async (trainerId: string) => {
    if (!confirm("Are you sure you want to remove this trainer?")) return
    setIsUpdating(trainerId)
    try {
      const response = await fetch(`/api/admin/trainers/${trainerId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId }),
      })
      if (response.ok) {
        setTrainers((prev) => prev.filter((t) => t.id !== trainerId))
        onFeedback("success", "Trainer removed")
      } else {
        onFeedback("error", "Failed to remove trainer")
      }
    } catch {
      onFeedback("error", "Network error — couldn't remove trainer")
    } finally {
      setIsUpdating(null)
    }
  }

  const handleSendInvite = async () => {
    setInviteError("")
    setInviteSuccess("")
    if (!inviteEmail.trim()) { setInviteError("Email is required"); return }

    setInviteLoading(true)
    try {
      const response = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(), role: "trainer",
          trainerName: inviteName.trim() || undefined, org_id: orgId,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to send invite")

      setInviteSuccess(`Invite sent to ${inviteEmail}`)
      setInviteEmail("")
      setInviteName("")
      fetchPendingInvites()
      setTimeout(() => { setIsInviteDialogOpen(false); setInviteSuccess("") }, 2000)
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : "Failed to send invite")
    } finally {
      setInviteLoading(false)
    }
  }

  const handleResendInvite = async (inviteId: string) => {
    setResendingInvite(inviteId)
    try {
      const res = await fetch("/api/admin/invites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_id: inviteId }),
      })
      if (res.ok) {
        onFeedback("success", "Invite resent")
        fetchPendingInvites()
      } else {
        onFeedback("error", "Failed to resend invite")
      }
    } catch {
      onFeedback("error", "Network error — couldn't resend invite")
    } finally {
      setResendingInvite(null)
    }
  }

  const handleCancelInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/admin/invites?id=${inviteId}`, { method: "DELETE" })
      if (res.ok) {
        setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId))
        onFeedback("success", "Invite cancelled")
      } else {
        onFeedback("error", "Failed to cancel invite")
      }
    } catch {
      onFeedback("error", "Network error — couldn't cancel invite")
    }
  }

  return (
    <>
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Trainers</CardTitle>
            <CardDescription>Manage your gym&apos;s trainers</CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Invite</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Invite Trainer</DialogTitle>
                  <DialogDescription>Send an email invite to a trainer to join your gym</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email *</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="trainer@email.com"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-name">Name (optional)</Label>
                    <Input
                      id="invite-name"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="e.g. Kru Somchai"
                      className="bg-background/50"
                    />
                  </div>
                  {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}
                  {inviteSuccess && <p className="text-sm text-green-500">{inviteSuccess}</p>}
                  <Button
                    onClick={handleSendInvite}
                    disabled={inviteLoading || !inviteEmail.trim()}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {inviteLoading ? (
                      <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Sending...</>
                    ) : (
                      <><Mail className="h-4 w-4 mr-2" />Send Invite</>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isTrainerDialogOpen} onOpenChange={setIsTrainerDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={openAddTrainer}>
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Add Trainer</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-neutral-900 border-neutral-700 max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {editingTrainer ? "Edit Trainer" : "Add Trainer"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTrainer ? "Update trainer profile" : "Create a new trainer profile"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-neutral-200">Display Name *</Label>
                    <Input
                      value={trainerForm.display_name}
                      onChange={(e) => setTrainerForm((prev) => ({ ...prev, display_name: e.target.value }))}
                      placeholder="e.g. Kru Wisarut"
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-200">Title</Label>
                    <Input
                      value={trainerForm.title}
                      onChange={(e) => setTrainerForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Head Trainer"
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-200">Bio</Label>
                    <Textarea
                      value={trainerForm.bio}
                      onChange={(e) => setTrainerForm((prev) => ({ ...prev, bio: e.target.value }))}
                      placeholder="Brief bio about the trainer..."
                      className="bg-neutral-800 border-neutral-700 text-white min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-200">Specialties</Label>
                    <Input
                      value={trainerForm.specialties}
                      onChange={(e) => setTrainerForm((prev) => ({ ...prev, specialties: e.target.value }))}
                      placeholder="e.g. Muay Femur, Clinch Work, Pad Holding"
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                    <p className="text-xs text-neutral-500">Separate with commas</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-200">Years Experience</Label>
                    <Input
                      type="number"
                      value={trainerForm.years_experience}
                      onChange={(e) => setTrainerForm((prev) => ({ ...prev, years_experience: Number.parseInt(e.target.value) || 0 }))}
                      placeholder="e.g. 15"
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-200">Fight Record</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs text-neutral-400">Wins</Label>
                        <Input
                          type="number"
                          value={trainerForm.fight_record_wins}
                          onChange={(e) => setTrainerForm((prev) => ({ ...prev, fight_record_wins: Number.parseInt(e.target.value) || 0 }))}
                          placeholder="0"
                          className="bg-neutral-800 border-neutral-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-neutral-400">Losses</Label>
                        <Input
                          type="number"
                          value={trainerForm.fight_record_losses}
                          onChange={(e) => setTrainerForm((prev) => ({ ...prev, fight_record_losses: Number.parseInt(e.target.value) || 0 }))}
                          placeholder="0"
                          className="bg-neutral-800 border-neutral-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-neutral-400">Draws</Label>
                        <Input
                          type="number"
                          value={trainerForm.fight_record_draws}
                          onChange={(e) => setTrainerForm((prev) => ({ ...prev, fight_record_draws: Number.parseInt(e.target.value) || 0 }))}
                          placeholder="0"
                          className="bg-neutral-800 border-neutral-700 text-white"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="trainerAvailable"
                        checked={trainerForm.is_available}
                        onChange={(e) => setTrainerForm((prev) => ({ ...prev, is_available: e.target.checked }))}
                        className="w-4 h-4 rounded border-neutral-600 bg-neutral-800"
                      />
                      <Label htmlFor="trainerAvailable" className="text-neutral-300 text-sm">Available</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="trainerFeatured"
                        checked={trainerForm.is_featured}
                        onChange={(e) => setTrainerForm((prev) => ({ ...prev, is_featured: e.target.checked }))}
                        className="w-4 h-4 rounded border-neutral-600 bg-neutral-800"
                      />
                      <Label htmlFor="trainerFeatured" className="text-neutral-300 text-sm">Featured</Label>
                    </div>
                  </div>
                  {trainerError && <p className="text-red-400 text-sm">{trainerError}</p>}
                  <Button
                    onClick={handleSaveTrainer}
                    disabled={isSavingTrainer}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    {isSavingTrainer ? "Saving..." : editingTrainer ? "Update Trainer" : "Add Trainer"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {trainers.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No trainers added yet</p>
              <p className="text-sm mt-2">Click &quot;Add Trainer&quot; to create your first trainer profile</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trainers.map((trainer) => (
                <div
                  key={trainer.id}
                  className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border gap-4 ${
                    trainer.is_available
                      ? "bg-neutral-800/50 border-neutral-700"
                      : "bg-neutral-800/20 border-neutral-800 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative w-14 h-14 rounded-full bg-neutral-700 border-2 border-neutral-600 overflow-hidden flex-shrink-0">
                      {trainer.photo_url ? (
                        <Image
                          src={trainer.photo_url || "/placeholder.svg"}
                          alt={trainer.display_name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-500">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{trainer.display_name}</p>
                        {trainer.is_featured && (
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">Featured</Badge>
                        )}
                      </div>
                      {trainer.title && <p className="text-sm text-neutral-400">{trainer.title}</p>}
                      {trainer.specialties && trainer.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {trainer.specialties.slice(0, 3).map((spec, i) => (
                            <Badge key={i} variant="outline" className="text-xs border-neutral-600 text-neutral-400">
                              {spec}
                            </Badge>
                          ))}
                          {trainer.specialties.length > 3 && (
                            <Badge variant="outline" className="text-xs border-neutral-600 text-neutral-400">
                              +{trainer.specialties.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      {(trainer.fight_record_wins > 0 || trainer.fight_record_losses > 0 || trainer.fight_record_draws > 0) && (
                        <p className="text-xs text-neutral-500 mt-1">
                          Record: {trainer.fight_record_wins}W - {trainer.fight_record_losses}L - {trainer.fight_record_draws}D
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        trainer.is_available
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      }
                    >
                      {trainer.is_available ? "Available" : "Unavailable"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditTrainer(trainer)}
                      className="border-neutral-700 hover:bg-neutral-800"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleTrainerAvailable(trainer)}
                      disabled={isUpdating === trainer.id}
                      className={
                        trainer.is_available
                          ? "border-green-700 text-green-400 hover:bg-green-900/30"
                          : "border-red-700 text-red-400 hover:bg-red-900/30"
                      }
                    >
                      {trainer.is_available ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteTrainer(trainer.id)}
                      disabled={isUpdating === trainer.id}
                      className="border-red-700 text-red-400 hover:bg-red-900/30"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {pendingInvites.length > 0 && (
        <Card className="bg-neutral-900/50 border-neutral-800 mt-4">
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400">Pending Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingInvites.map((inv) => {
                const isExpired = new Date(inv.expires_at) < new Date()
                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-800/30 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm text-white">{inv.email}</p>
                      <p className="text-xs text-neutral-500">
                        {isExpired ? (
                          <span className="text-red-400">Expired</span>
                        ) : (
                          <>Sent {new Date(inv.created_at).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResendInvite(inv.id)}
                        disabled={resendingInvite === inv.id}
                        className="border-neutral-700 hover:bg-neutral-800 text-xs"
                      >
                        {resendingInvite === inv.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          "Resend"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelInvite(inv.id)}
                        className="border-red-700/50 text-red-400 hover:bg-red-900/30 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
