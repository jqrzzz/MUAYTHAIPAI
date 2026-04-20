"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Users,
  Plus,
  Loader2,
  Crown,
  Shield,
  UserCheck,
  Mail,
  Clock,
  X,
  Check,
  AlertTriangle,
  Send,
} from "lucide-react"

interface TeamMember {
  id: string
  userId: string
  name: string
  email: string
  phone: string | null
  role: string
  status: string
  permissions: {
    canManageBookings: boolean
    canManageServices: boolean
    canManageMembers: boolean
    canViewPayments: boolean
  }
  joinedAt: string
}

interface PendingInvite {
  id: string
  email: string
  role: string
  status: string
  created_at: string
  expires_at: string
}

interface TeamTabProps {
  orgId: string
  onFeedback: (type: "success" | "error", msg: string) => void
}

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Crown; color: string; description: string }> = {
  owner: { label: "Owner", icon: Crown, color: "text-amber-400", description: "Full access to everything" },
  admin: { label: "Admin", icon: Shield, color: "text-blue-400", description: "Manage team, services, bookings" },
  trainer: { label: "Trainer", icon: UserCheck, color: "text-green-400", description: "View bookings, manage own profile" },
}

const PERMISSION_LABELS: Record<string, string> = {
  canManageBookings: "Manage Bookings",
  canManageServices: "Manage Services",
  canManageMembers: "Manage Team",
  canViewPayments: "View Payments",
}

export default function TeamTab({ orgId, onFeedback }: TeamTabProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [showEditMember, setShowEditMember] = useState<TeamMember | null>(null)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<TeamMember | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const [inviteForm, setInviteForm] = useState({ email: "", role: "trainer", name: "" })

  useEffect(() => {
    fetchTeam()
  }, [])

  const fetchTeam = async () => {
    setLoading(true)
    try {
      const [teamRes, invitesRes] = await Promise.all([
        fetch("/api/admin/team"),
        fetch("/api/admin/invites"),
      ])

      if (teamRes.ok) {
        const data = await teamRes.json()
        setMembers(data.members)
        setCurrentUserId(data.currentUserId)
      }

      if (invitesRes.ok) {
        const data = await invitesRes.json()
        setInvites(data.invites || [])
      }
    } catch {
      onFeedback("error", "Failed to load team data")
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteForm.email) return
    setActionLoading(true)

    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteForm.email,
          role: inviteForm.role,
          trainerName: inviteForm.name || undefined,
          org_id: orgId,
        }),
      })

      if (res.ok) {
        onFeedback("success", `Invite sent to ${inviteForm.email}`)
        setShowInvite(false)
        setInviteForm({ email: "", role: "trainer", name: "" })
        fetchTeam()
      } else {
        const data = await res.json()
        onFeedback("error", data.error || "Failed to send invite")
      }
    } catch {
      onFeedback("error", "Network error sending invite")
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateMember = async () => {
    if (!showEditMember) return
    setActionLoading(true)

    try {
      const res = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: showEditMember.id,
          role: showEditMember.role,
          permissions: showEditMember.permissions,
        }),
      })

      if (res.ok) {
        onFeedback("success", "Member updated")
        setShowEditMember(null)
        fetchTeam()
      } else {
        const data = await res.json()
        onFeedback("error", data.error || "Failed to update member")
      }
    } catch {
      onFeedback("error", "Network error updating member")
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!showRemoveConfirm) return
    setActionLoading(true)

    try {
      const res = await fetch(`/api/admin/team?id=${showRemoveConfirm.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        onFeedback("success", `${showRemoveConfirm.name} removed from team`)
        setShowRemoveConfirm(null)
        fetchTeam()
      } else {
        const data = await res.json()
        onFeedback("error", data.error || "Failed to remove member")
      }
    } catch {
      onFeedback("error", "Network error removing member")
    } finally {
      setActionLoading(false)
    }
  }

  const handleResendInvite = async (inviteId: string) => {
    setActionLoading(true)
    try {
      const res = await fetch("/api/admin/invites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_id: inviteId }),
      })
      if (res.ok) {
        onFeedback("success", "Invite resent")
        fetchTeam()
      } else {
        onFeedback("error", "Failed to resend invite")
      }
    } catch {
      onFeedback("error", "Network error")
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelInvite = async (inviteId: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/invites?id=${inviteId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        onFeedback("success", "Invite cancelled")
        fetchTeam()
      } else {
        onFeedback("error", "Failed to cancel invite")
      }
    } catch {
      onFeedback("error", "Network error")
    } finally {
      setActionLoading(false)
    }
  }

  const isOwner = members.find((m) => m.userId === currentUserId)?.role === "owner"

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Team</h2>
          <p className="text-sm text-neutral-400">{members.length} member{members.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="bg-orange-600 hover:bg-orange-500">
          <Plus className="mr-2 h-4 w-4" />
          Invite
        </Button>
      </div>

      {/* Active members */}
      <div className="space-y-3">
        {members.map((member) => {
          const config = ROLE_CONFIG[member.role] || ROLE_CONFIG.trainer
          const RoleIcon = config.icon
          const isCurrentUser = member.userId === currentUserId

          return (
            <Card key={member.id} className="bg-neutral-900/50 border-neutral-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`rounded-full p-2 bg-neutral-800 ${config.color}`}>
                      <RoleIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{member.name}</p>
                        {isCurrentUser && (
                          <span className="text-[10px] text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded">you</span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 truncate">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>

                    {!isCurrentUser && member.role !== "owner" && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowEditMember({ ...member })}
                          className="text-neutral-400 hover:text-white h-8 px-2"
                        >
                          Edit
                        </Button>
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowRemoveConfirm(member)}
                            className="text-red-400 hover:text-red-300 h-8 px-2"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Permission badges */}
                {member.role !== "owner" && (
                  <div className="flex flex-wrap gap-1.5 mt-3 ml-11">
                    {Object.entries(member.permissions).map(([key, value]) => (
                      <span
                        key={key}
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          value
                            ? "bg-green-500/10 text-green-400"
                            : "bg-neutral-800 text-neutral-600"
                        }`}
                      >
                        {PERMISSION_LABELS[key]}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-neutral-400 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Pending Invites
          </h3>
          {invites.map((invite) => {
            const isExpired = new Date(invite.expires_at) < new Date()
            return (
              <Card key={invite.id} className="bg-neutral-900/50 border-neutral-800 border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="rounded-full p-2 bg-neutral-800 text-neutral-500">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-neutral-300 truncate">{invite.email}</p>
                        <p className="text-xs text-neutral-500">
                          Invited as {invite.role}
                          {isExpired ? " · Expired" : ` · Expires ${new Date(invite.expires_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResendInvite(invite.id)}
                        className="text-neutral-400 hover:text-white h-8 px-2"
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Resend
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelInvite(invite.id)}
                        className="text-red-400 hover:text-red-300 h-8 px-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {members.length === 0 && invites.length === 0 && (
        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardContent className="p-8 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-neutral-600" />
            <p className="text-neutral-400">No team members yet</p>
            <p className="text-sm text-neutral-500">Invite trainers and staff to get started</p>
          </CardContent>
        </Card>
      )}

      {/* Invite dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-neutral-300">Email</Label>
              <Input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="name@email.com"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-neutral-300">Role</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["admin", "trainer"] as const).map((role) => {
                  const config = ROLE_CONFIG[role]
                  const RoleIcon = config.icon
                  return (
                    <button
                      key={role}
                      onClick={() => setInviteForm({ ...inviteForm, role })}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-colors text-left ${
                        inviteForm.role === role
                          ? "border-orange-500 bg-orange-500/10"
                          : "border-neutral-700 bg-neutral-800 hover:border-neutral-600"
                      }`}
                    >
                      <RoleIcon className={`h-4 w-4 ${config.color}`} />
                      <div>
                        <p className="text-sm font-medium text-white">{config.label}</p>
                        <p className="text-[10px] text-neutral-400">{config.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-neutral-300">Name <span className="text-neutral-500">(optional)</span></Label>
              <Input
                value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                placeholder="Their name"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>

            <Button
              onClick={handleInvite}
              disabled={actionLoading || !inviteForm.email}
              className="w-full bg-orange-600 hover:bg-orange-500"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Invite
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit member dialog */}
      <Dialog open={!!showEditMember} onOpenChange={(open) => !open && setShowEditMember(null)}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle>Edit {showEditMember?.name}</DialogTitle>
          </DialogHeader>
          {showEditMember && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-neutral-300">Role</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["admin", "trainer"] as const).map((role) => {
                    const config = ROLE_CONFIG[role]
                    const RoleIcon = config.icon
                    return (
                      <button
                        key={role}
                        onClick={() => setShowEditMember({ ...showEditMember, role })}
                        className={`flex items-center gap-2 p-3 rounded-lg border transition-colors text-left ${
                          showEditMember.role === role
                            ? "border-orange-500 bg-orange-500/10"
                            : "border-neutral-700 bg-neutral-800 hover:border-neutral-600"
                        }`}
                      >
                        <RoleIcon className={`h-4 w-4 ${config.color}`} />
                        <div>
                          <p className="text-sm font-medium text-white">{config.label}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-neutral-300">Permissions</Label>
                {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between py-2 cursor-pointer">
                    <span className="text-sm text-neutral-300">{label}</span>
                    <button
                      onClick={() =>
                        setShowEditMember({
                          ...showEditMember,
                          permissions: {
                            ...showEditMember.permissions,
                            [key]: !showEditMember.permissions[key as keyof typeof showEditMember.permissions],
                          },
                        })
                      }
                      className={`w-10 h-6 rounded-full transition-colors flex items-center ${
                        showEditMember.permissions[key as keyof typeof showEditMember.permissions]
                          ? "bg-green-500 justify-end"
                          : "bg-neutral-700 justify-start"
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white mx-1" />
                    </button>
                  </label>
                ))}
              </div>

              <Button
                onClick={handleUpdateMember}
                disabled={actionLoading}
                className="w-full bg-orange-600 hover:bg-orange-500"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove confirmation dialog */}
      <Dialog open={!!showRemoveConfirm} onOpenChange={(open) => !open && setShowRemoveConfirm(null)}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
          </DialogHeader>
          {showRemoveConfirm && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                <div className="text-sm text-neutral-300">
                  <p>Remove <strong>{showRemoveConfirm.name}</strong> ({showRemoveConfirm.email}) from the team?</p>
                  <p className="text-neutral-500 mt-1">They will lose access to the gym dashboard.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRemoveConfirm(null)}
                  className="flex-1 border-neutral-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRemoveMember}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 hover:bg-red-500"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Remove
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
