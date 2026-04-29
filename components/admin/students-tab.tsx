"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Minus, RefreshCw, GraduationCap, History, Award, Eye } from "lucide-react"
import StudentPassportDialog from "./student-passport-dialog"

interface StudentCredit {
  id: string
  credit_type: string
  credits_remaining: number
}

interface CertProgressLevel {
  level: string
  signed_off: number
  total: number
  earned: boolean
  enrolled: boolean
  last_signoff_at: string | null
}

interface CertProgress {
  levels: CertProgressLevel[]
  earned_count: number
  current: CertProgressLevel | null
}

interface Student {
  id: string
  email: string
  full_name: string | null
  display_name: string | null
  phone: string | null
  credits?: StudentCredit[]
  cert_progress?: CertProgress
}

export interface CreditTransaction {
  id: string
  amount: number
  description: string | null
  created_at: string
  payment_amount_thb: number | null
  users?: { full_name: string | null; display_name: string | null }
  [key: string]: unknown
}

interface StudentsTabProps {
  students: Student[]
  studentsLoading: boolean
  studentTransactions: CreditTransaction[]
  onFetchStudents: () => void
  onAddStudent: (form: NewStudentForm) => Promise<{ success: boolean; error?: string }>
  onAddCredits: (studentId: string, form: AddCreditsForm) => Promise<{ success: boolean; error?: string }>
  onUseCredit: (studentId: string, creditId: string) => Promise<void>
}

interface NewStudentForm {
  name: string
  email: string
  phone: string
  creditType: string
  credits: number
  paymentMethod: string
  paymentAmount: number
  notes: string
}

interface AddCreditsForm {
  creditType: string
  credits: number
  notes: string
  paymentMethod: string
  paymentAmount: number
}

export default function StudentsTab({
  students,
  studentsLoading,
  studentTransactions,
  onFetchStudents,
  onAddStudent,
  onAddCredits,
  onUseCredit,
}: StudentsTabProps) {
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [isAddCreditsOpen, setIsAddCreditsOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [passportStudentId, setPassportStudentId] = useState<string | null>(null)
  const [studentError, setStudentError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const [newStudentForm, setNewStudentForm] = useState<NewStudentForm>({
    name: "",
    email: "",
    phone: "",
    creditType: "sessions",
    credits: 0,
    paymentMethod: "cash",
    paymentAmount: 0,
    notes: "",
  })

  const [addCreditsForm, setAddCreditsForm] = useState<AddCreditsForm>({
    creditType: "private_session",
    credits: 1,
    notes: "",
    paymentMethod: "cash",
    paymentAmount: 0,
  })

  const handleAddStudent = async () => {
    setStudentError("")
    if (!newStudentForm.name.trim() || !newStudentForm.email.trim()) {
      setStudentError("Name and email are required")
      return
    }
    setIsSaving(true)
    const result = await onAddStudent(newStudentForm)
    if (result.success) {
      setIsAddStudentOpen(false)
      setNewStudentForm({
        name: "",
        email: "",
        phone: "",
        creditType: "sessions",
        credits: 0,
        paymentMethod: "cash",
        paymentAmount: 0,
        notes: "",
      })
    } else {
      setStudentError(result.error || "Failed to add student")
    }
    setIsSaving(false)
  }

  const handleAddCredits = async () => {
    if (!selectedStudent) return
    setStudentError("")
    if (addCreditsForm.credits <= 0) {
      setStudentError("Enter a valid number of credits")
      return
    }
    setIsSaving(true)
    const result = await onAddCredits(selectedStudent.id, addCreditsForm)
    if (result.success) {
      setIsAddCreditsOpen(false)
      setSelectedStudent(null)
    } else {
      setStudentError(result.error || "Failed to add credits")
    }
    setIsSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Students</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onFetchStudents}
            className="border-neutral-700 bg-transparent"
            disabled={studentsLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${studentsLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                <Plus className="w-4 h-4 mr-2" /> Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription className="text-neutral-400">
                  Add a student and optionally record their initial payment
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={newStudentForm.name}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                    className="bg-neutral-800 border-neutral-700"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newStudentForm.email}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                    className="bg-neutral-800 border-neutral-700"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={newStudentForm.phone}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, phone: e.target.value })}
                    className="bg-neutral-800 border-neutral-700"
                    placeholder="+66..."
                  />
                </div>
                <hr className="border-neutral-700" />
                <p className="text-sm text-neutral-400">Initial Package (optional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={newStudentForm.creditType}
                      onValueChange={(v) => setNewStudentForm({ ...newStudentForm, creditType: v })}
                    >
                      <SelectTrigger className="bg-neutral-800 border-neutral-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-neutral-700">
                        <SelectItem value="sessions">Sessions</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="private">Private Sessions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Credits</Label>
                    <Input
                      type="number"
                      value={newStudentForm.credits}
                      onChange={(e) =>
                        setNewStudentForm({ ...newStudentForm, credits: Number.parseInt(e.target.value) || 0 })
                      }
                      className="bg-neutral-800 border-neutral-700"
                      placeholder="10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Payment Method</Label>
                    <Select
                      value={newStudentForm.paymentMethod}
                      onValueChange={(v) => setNewStudentForm({ ...newStudentForm, paymentMethod: v })}
                    >
                      <SelectTrigger className="bg-neutral-800 border-neutral-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-neutral-700">
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{"Amount (\u0E3F)"}</Label>
                    <Input
                      type="number"
                      value={newStudentForm.paymentAmount}
                      onChange={(e) =>
                        setNewStudentForm({
                          ...newStudentForm,
                          paymentAmount: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      className="bg-neutral-800 border-neutral-700"
                      placeholder="5000"
                    />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={newStudentForm.notes}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, notes: e.target.value })}
                    className="bg-neutral-800 border-neutral-700"
                    placeholder="Any notes about this student..."
                    rows={2}
                  />
                </div>
                {studentError && <p className="text-red-400 text-sm">{studentError}</p>}
                <Button
                  onClick={handleAddStudent}
                  disabled={isSaving}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {isSaving ? "Saving..." : "Add Student"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {studentsLoading ? (
        <div className="text-center py-12 text-neutral-400">Loading students...</div>
      ) : students.length === 0 ? (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="py-12 text-center">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
            <p className="text-neutral-400 mb-2">No students yet</p>
            <p className="text-neutral-500 text-sm">Add your first student to start tracking their sessions</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <Card key={student.id} className="bg-neutral-900 border-neutral-800">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">
                      {student.full_name || student.display_name || "Unknown"}
                    </h3>
                    <p className="text-sm text-neutral-400 truncate">{student.email}</p>
                    {student.phone && <p className="text-xs text-neutral-500">{student.phone}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {student.credits && student.credits.length > 0 && (
                      <Badge
                        className={
                          student.credits.some((c) => c.credits_remaining > 3)
                            ? "bg-green-600"
                            : student.credits.some((c) => c.credits_remaining > 0)
                              ? "bg-yellow-600"
                              : "bg-red-600"
                        }
                      >
                        {student.credits.reduce((sum, c) => sum + c.credits_remaining, 0)} Credits
                      </Badge>
                    )}
                  </div>
                </div>

                {student.cert_progress && (student.cert_progress.current || student.cert_progress.earned_count > 0) && (
                  <button
                    onClick={() => setPassportStudentId(student.id)}
                    className="w-full mb-3 rounded-md border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-left hover:border-orange-500/40 transition group"
                  >
                    <div className="flex items-center gap-2">
                      <Award
                        className={`h-3.5 w-3.5 shrink-0 ${
                          student.cert_progress.earned_count > 0
                            ? "text-orange-400"
                            : "text-amber-400"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        {student.cert_progress.current ? (
                          <>
                            <p className="text-xs text-neutral-300 capitalize">
                              {student.cert_progress.current.level}{" "}
                              <span className="text-neutral-500 font-mono">
                                {student.cert_progress.current.signed_off}/
                                {student.cert_progress.current.total}
                              </span>
                              {student.cert_progress.current.signed_off >=
                                student.cert_progress.current.total &&
                                student.cert_progress.current.total > 0 && (
                                  <span className="ml-1 text-emerald-400">
                                    · ready
                                  </span>
                                )}
                            </p>
                            <div className="h-1 mt-1 rounded-full bg-neutral-800 overflow-hidden">
                              <div
                                className="h-full bg-amber-500"
                                style={{
                                  width: `${
                                    student.cert_progress.current.total > 0
                                      ? Math.round(
                                          (student.cert_progress.current.signed_off /
                                            student.cert_progress.current.total) *
                                            100
                                        )
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-neutral-300">
                            {student.cert_progress.earned_count} cert
                            {student.cert_progress.earned_count === 1 ? "" : "s"} earned
                          </p>
                        )}
                      </div>
                      <Eye className="h-3 w-3 text-neutral-600 group-hover:text-orange-400 shrink-0" />
                    </div>
                  </button>
                )}
                {student.cert_progress && student.cert_progress.levels.length === 0 && (
                  <button
                    onClick={() => setPassportStudentId(student.id)}
                    className="w-full mb-3 rounded-md border border-dashed border-neutral-800 px-2.5 py-1.5 text-left hover:border-orange-500/40 transition text-xs text-neutral-500"
                  >
                    No cert progress yet · open passport
                  </button>
                )}

                {student.credits && student.credits.length > 0 && (
                  <>
                    {student.credits.map((credit) => (
                      <div key={credit.id} className="text-xs text-neutral-500 mb-1">
                        {credit.credit_type}: {credit.credits_remaining} remaining
                      </div>
                    ))}
                  </>
                )}

                <div className="flex gap-2">
                  {student.credits && student.credits.some((c) => c.credits_remaining > 0) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const creditToDeduct = student.credits?.find(
                          (c) => c.credit_type === "sessions" || c.credit_type === "private_session",
                        )
                        if (creditToDeduct) {
                          onUseCredit(student.id, creditToDeduct.id)
                        } else if (student.credits && student.credits.length > 0) {
                          onUseCredit(student.id, student.credits[0].id)
                        }
                      }}
                      className="border-neutral-700 flex-1"
                    >
                      <Minus className="w-3 h-3 mr-1" /> Use 1 Credit
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedStudent(student)
                      setAddCreditsForm({
                        creditType: student.credits?.[0]?.credit_type || "private_session",
                        credits: 1,
                        notes: "",
                        paymentMethod: "cash",
                        paymentAmount: 0,
                      })
                      setStudentError("")
                      setIsAddCreditsOpen(true)
                    }}
                    className="border-neutral-700 flex-1"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Credits
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {studentTransactions.length > 0 && (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {studentTransactions.slice(0, 10).map((tx) => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center py-2 border-b border-neutral-800 last:border-0"
                >
                  <div>
                    <p className="text-sm">
                      <span className="text-white">
                        {tx.users?.full_name || tx.users?.display_name || "Unknown"}
                      </span>
                      <span className="text-neutral-400"> - {tx.description}</span>
                    </p>
                    <p className="text-xs text-neutral-500">
                      {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className={tx.amount > 0 ? "border-green-600 text-green-400" : "border-red-600 text-red-400"}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount}
                    </Badge>
                    {tx.payment_amount_thb && (
                      <p className="text-xs text-neutral-500">{"\u0E3F"}{tx.payment_amount_thb.toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isAddCreditsOpen} onOpenChange={setIsAddCreditsOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Add Credits</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Add credits for {selectedStudent?.full_name || selectedStudent?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={addCreditsForm.creditType}
                  onValueChange={(v) => setAddCreditsForm({ ...addCreditsForm, creditType: v })}
                >
                  <SelectTrigger className="bg-neutral-800 border-neutral-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="sessions">Sessions</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="private">Private Sessions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Credits to Add</Label>
                <Input
                  type="number"
                  value={addCreditsForm.credits}
                  onChange={(e) =>
                    setAddCreditsForm({ ...addCreditsForm, credits: Number.parseInt(e.target.value) || 0 })
                  }
                  className="bg-neutral-800 border-neutral-700"
                  placeholder="10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Payment Method</Label>
                <Select
                  value={addCreditsForm.paymentMethod}
                  onValueChange={(v) => setAddCreditsForm({ ...addCreditsForm, paymentMethod: v })}
                >
                  <SelectTrigger className="bg-neutral-800 border-neutral-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{"Amount Paid (\u0E3F)"}</Label>
                <Input
                  type="number"
                  value={addCreditsForm.paymentAmount}
                  onChange={(e) =>
                    setAddCreditsForm({ ...addCreditsForm, paymentAmount: Number.parseInt(e.target.value) || 0 })
                  }
                  className="bg-neutral-800 border-neutral-700"
                  placeholder="5000"
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={addCreditsForm.notes}
                onChange={(e) => setAddCreditsForm({ ...addCreditsForm, notes: e.target.value })}
                className="bg-neutral-800 border-neutral-700"
                placeholder="Any notes..."
                rows={2}
              />
            </div>
            {studentError && <p className="text-red-400 text-sm">{studentError}</p>}
            <Button
              onClick={handleAddCredits}
              disabled={isSaving}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {isSaving ? "Saving..." : "Add Credits"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <StudentPassportDialog
        studentId={passportStudentId}
        open={!!passportStudentId}
        onOpenChange={(open) => {
          if (!open) setPassportStudentId(null)
        }}
      />
    </div>
  )
}
