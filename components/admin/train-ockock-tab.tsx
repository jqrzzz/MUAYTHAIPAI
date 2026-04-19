"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Trash2,
  RefreshCw,
  Copy,
  Sparkles,
  BookOpen,
  MessageSquare,
  Sprout,
} from "lucide-react"

const OckOckAvatar = ({ size = 32 }: { size?: number }) => (
  <Image src="/images/ockock-avatar.png" alt="OckOck" width={size} height={size} className="rounded-full" />
)

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  is_active: boolean
}

const FAQ_CATEGORIES = [
  { value: "pricing", label: "Pricing" },
  { value: "schedule", label: "Schedule" },
  { value: "location", label: "Location" },
  { value: "training", label: "Training" },
  { value: "booking", label: "Booking" },
  { value: "general", label: "General" },
]

export default function TrainOckockTab() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [faqsLoading, setFaqsLoading] = useState(false)
  const [newFaqForm, setNewFaqForm] = useState({ question: "", answer: "", category: "general" })
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
  const [isSavingFaq, setIsSavingFaq] = useState(false)
  const [quickReplyInput, setQuickReplyInput] = useState("")
  const [quickReplyResponse, setQuickReplyResponse] = useState("")
  const [isGeneratingReply, setIsGeneratingReply] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [seedMessage, setSeedMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchFaqs()
  }, [])

  const fetchFaqs = async () => {
    setFaqsLoading(true)
    try {
      const res = await fetch("/api/admin/faqs")
      if (res.ok) {
        const data = await res.json()
        setFaqs(data.faqs || [])
      }
    } catch (error) {
      console.error("Failed to fetch FAQs:", error)
    }
    setFaqsLoading(false)
  }

  const handleSaveFaq = async () => {
    if (!newFaqForm.question || !newFaqForm.answer) return
    setIsSavingFaq(true)
    try {
      const res = await fetch("/api/admin/faqs", {
        method: editingFaq ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingFaq ? { ...newFaqForm, id: editingFaq.id } : newFaqForm),
      })
      if (res.ok) {
        setNewFaqForm({ question: "", answer: "", category: "general" })
        setEditingFaq(null)
        fetchFaqs()
      }
    } catch (error) {
      console.error("Failed to save FAQ:", error)
    }
    setIsSavingFaq(false)
  }

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return
    try {
      const res = await fetch(`/api/admin/faqs?id=${id}`, { method: "DELETE" })
      if (res.ok) fetchFaqs()
    } catch (error) {
      console.error("Failed to delete FAQ:", error)
    }
  }

  const handleToggleFaq = async (faq: FAQ) => {
    try {
      const res = await fetch("/api/admin/faqs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: faq.id, is_active: !faq.is_active }),
      })
      if (res.ok) fetchFaqs()
    } catch (error) {
      console.error("Failed to toggle FAQ:", error)
    }
  }

  const handleQuickReply = async () => {
    if (!quickReplyInput.trim()) return
    setIsGeneratingReply(true)
    setQuickReplyResponse("")
    try {
      const res = await fetch("/api/admin/quick-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerMessage: quickReplyInput }),
      })
      if (res.ok) {
        const data = await res.json()
        setQuickReplyResponse(data.response)
      }
    } catch (error) {
      console.error("Failed to generate reply:", error)
      setQuickReplyResponse("Sorry, could not generate a response. Please try again.")
    }
    setIsGeneratingReply(false)
  }

  const handleSeedFaqs = async () => {
    setIsSeeding(true)
    setSeedMessage(null)
    try {
      const res = await fetch("/api/admin/faqs/seed", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setSeedMessage(data.message ?? "Seeded from website FAQ")
        fetchFaqs()
      } else {
        setSeedMessage(data.error ?? "Could not seed FAQs")
      }
    } catch (error) {
      console.error("Failed to seed FAQs:", error)
      setSeedMessage("Could not seed FAQs — check your connection and try again.")
    }
    setIsSeeding(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      {/* Header with OckOck branding */}
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <OckOckAvatar size={64} />
              <div>
                <h2 className="text-2xl font-bold text-white">Train Your Water Buffalo</h2>
                <p className="text-neutral-400">Teach OckOck how to answer customer questions</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-2 bg-neutral-700 rounded-full w-48">
                    <div
                      className="h-2 bg-orange-500 rounded-full transition-all"
                      style={{ width: `${Math.min((faqs.length / 20) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-neutral-400">{faqs.length} answers learned</span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedFaqs}
              disabled={isSeeding}
              className="border-neutral-700 bg-transparent shrink-0"
              title="Import the canned Q&A from the public /faq page"
            >
              {isSeeding ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Seeding...
                </>
              ) : (
                <>
                  <Sprout className="w-4 h-4 mr-2" /> Seed from website FAQ
                </>
              )}
            </Button>
          </div>
          {seedMessage && (
            <p className="text-sm text-neutral-400 mt-3">{seedMessage}</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Reply Box */}
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Quick Reply
          </CardTitle>
          <CardDescription>Paste a customer message and OckOck will generate a response</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-neutral-200">Customer Message</Label>
            <Textarea
              value={quickReplyInput}
              onChange={(e) => setQuickReplyInput(e.target.value)}
              placeholder="Paste the customer's message here..."
              className="bg-neutral-800 border-neutral-700 text-white min-h-[80px]"
            />
          </div>
          <Button
            onClick={handleQuickReply}
            disabled={isGeneratingReply || !quickReplyInput.trim()}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isGeneratingReply ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" /> Generate Reply
              </>
            )}
          </Button>

          {quickReplyResponse && (
            <div className="mt-4 p-4 bg-neutral-800 rounded-lg border border-neutral-700">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <OckOckAvatar size={32} />
                  <div>
                    <p className="text-sm text-neutral-400 mb-1">OckOck suggests:</p>
                    <p className="text-white whitespace-pre-wrap">{quickReplyResponse}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(quickReplyResponse)}
                  className="border-neutral-600 bg-transparent shrink-0"
                >
                  <Copy className="w-4 h-4 mr-1" /> Copy
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New FAQ */}
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="w-5 h-5" /> {editingFaq ? "Edit Answer" : "Teach OckOck Something New"}
          </CardTitle>
          <CardDescription>
            {editingFaq ? "Update this Q&A pair" : "Add a question and answer for OckOck to learn"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 space-y-2">
              <Label className="text-neutral-200">When someone asks:</Label>
              <Input
                value={newFaqForm.question}
                onChange={(e) => setNewFaqForm((prev) => ({ ...prev, question: e.target.value }))}
                placeholder="e.g., How much for a private session?"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-200">Category</Label>
              <Select
                value={newFaqForm.category}
                onValueChange={(v) => setNewFaqForm((prev) => ({ ...prev, category: v }))}
              >
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FAQ_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-neutral-200">OckOck should say:</Label>
            <Textarea
              value={newFaqForm.answer}
              onChange={(e) => setNewFaqForm((prev) => ({ ...prev, answer: e.target.value }))}
              placeholder="e.g., Private sessions are 800 baht for 1 hour with a trainer."
              className="bg-neutral-800 border-neutral-700 text-white min-h-[80px]"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSaveFaq}
              disabled={isSavingFaq || !newFaqForm.question || !newFaqForm.answer}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSavingFaq ? "Saving..." : editingFaq ? "Update" : "Teach OckOck"}
            </Button>
            {editingFaq && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingFaq(null)
                  setNewFaqForm({ question: "", answer: "", category: "general" })
                }}
                className="border-neutral-700 bg-transparent"
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Add Common Questions */}
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Quick Add Common Questions</CardTitle>
          <CardDescription>Click to add pre-made questions (customize the answers)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { q: "How much for a private session?", cat: "pricing" },
              { q: "What time are morning classes?", cat: "schedule" },
              { q: "Is it good for beginners?", cat: "training" },
              { q: "Where are you located?", cat: "location" },
              { q: "How do I book?", cat: "booking" },
              { q: "Do you have group classes?", cat: "training" },
              { q: "What should I bring?", cat: "general" },
              { q: "Do you offer accommodation?", cat: "general" },
            ].map((item, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => setNewFaqForm((prev) => ({ ...prev, question: item.q, category: item.cat }))}
                className="border-neutral-700 bg-transparent text-neutral-300 hover:text-white"
              >
                <Plus className="w-3 h-3 mr-1" /> {item.q}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Existing FAQs */}
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> What OckOck Knows ({faqs.length})
              </CardTitle>
              <CardDescription>All the Q&A pairs OckOck has learned</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFaqs}
              disabled={faqsLoading}
              className="border-neutral-700 bg-transparent"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${faqsLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {faqsLoading ? (
            <div className="text-center py-8 text-neutral-400">Loading...</div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>OckOck hasn't learned anything yet.</p>
              <p className="text-sm">Add your first Q&A above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {FAQ_CATEGORIES.map((cat) => {
                const categoryFaqs = faqs.filter((f) => f.category === cat.value)
                if (categoryFaqs.length === 0) return null
                return (
                  <div key={cat.value} className="space-y-2">
                    <h4 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
                      {cat.label} ({categoryFaqs.length})
                    </h4>
                    {categoryFaqs.map((faq) => (
                      <div
                        key={faq.id}
                        className={`p-3 rounded-lg border ${faq.is_active ? "bg-neutral-800/50 border-neutral-700" : "bg-neutral-900 border-neutral-800 opacity-60"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white">Q: {faq.question}</p>
                            <p className="text-neutral-400 mt-1">A: {faq.answer}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleFaq(faq)}
                              className="h-8 w-8 p-0"
                              title={faq.is_active ? "Disable" : "Enable"}
                            >
                              {faq.is_active ? (
                                <ToggleRight className="w-4 h-4 text-green-500" />
                              ) : (
                                <ToggleLeft className="w-4 h-4 text-neutral-500" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingFaq(faq)
                                setNewFaqForm({ question: faq.question, answer: faq.answer, category: faq.category })
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFaq(faq.id)}
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
