"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, FileText, Loader2 } from "lucide-react"

interface Gym {
  id: string
  name: string
  logo_url: string | null
  city: string | null
}

interface Waiver {
  id: string
  version: number
  title: string
  body: string
}

interface Props {
  gym: Gym
  waiver: Waiver | null
  isLoggedIn: boolean
  userEmail: string | null
  alreadySigned: boolean
}

export default function WaiverSignClient({
  gym,
  waiver,
  isLoggedIn,
  userEmail,
  alreadySigned,
}: Props) {
  const [signedName, setSignedName] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!waiver) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white px-4">
        <Card className="bg-neutral-900 border-neutral-800 max-w-md w-full">
          <CardContent className="py-10 text-center">
            <FileText className="h-10 w-10 text-neutral-500 mx-auto mb-3" />
            <p className="font-semibold mb-1">No waiver published</p>
            <p className="text-sm text-neutral-400">
              {gym.name} hasn&apos;t published a liability waiver yet. Ask the
              gym to set one up — they can do it from /admin → Settings.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (alreadySigned || success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white px-4">
        <Card className="bg-neutral-900 border-emerald-700/40 max-w-md w-full">
          <CardContent className="py-10 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
            <p className="font-semibold text-emerald-200 mb-1">
              Signed — you&apos;re all set
            </p>
            <p className="text-sm text-neutral-400">
              Your liability waiver for {gym.name} is on file. You can close
              this page.
            </p>
            <Link
              href="/student"
              className="mt-5 inline-block text-orange-400 hover:underline text-sm"
            >
              Go to my dashboard →
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white px-4">
        <Card className="bg-neutral-900 border-neutral-800 max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Sign in to continue</CardTitle>
            <CardDescription>
              You need to be signed in so we can record your signature against
              your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link
              href={`/student/login?redirect=${encodeURIComponent(`/waivers/${gym.id}`)}`}
              className="inline-flex items-center justify-center rounded-lg bg-orange-500 hover:bg-orange-400 px-6 py-2.5 text-sm font-semibold text-white"
            >
              Sign in to sign waiver
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  async function submit() {
    if (!signedName.trim() || !agreed) {
      setError("Type your name and agree to the terms.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/student/waivers/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: gym.id,
          signed_name: signedName.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Could not save signature")
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="text-center">
          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
            Liability waiver
          </p>
          <h1 className="text-2xl font-bold">
            {gym.name}
            {gym.city ? <span className="text-neutral-500"> · {gym.city}</span> : ""}
          </h1>
        </div>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              {waiver.title}
            </CardTitle>
            <CardDescription>
              Version {waiver.version} · please read in full before signing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-neutral-950 border border-neutral-800 p-4 max-h-96 overflow-y-auto whitespace-pre-wrap text-sm text-neutral-200 leading-relaxed">
              {waiver.body}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-orange-500/30">
          <CardContent className="space-y-4 py-5">
            <div>
              <Label htmlFor="signed-name" className="text-neutral-300">
                Type your full legal name as your signature *
              </Label>
              <Input
                id="signed-name"
                value={signedName}
                onChange={(e) => setSignedName(e.target.value)}
                placeholder="Your full name"
                className="bg-neutral-800 border-neutral-700 text-white mt-1.5"
                disabled={submitting}
              />
              {userEmail && (
                <p className="text-xs text-neutral-500 mt-1">
                  Signing as {userEmail}
                </p>
              )}
            </div>
            <label className="flex items-start gap-2 text-sm text-neutral-200">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                disabled={submitting}
                className="rounded mt-0.5"
              />
              <span>
                I have read the waiver above and I agree to its terms. I
                understand my signature will be recorded against my account
                with timestamp + IP for {gym.name}&apos;s records.
              </span>
            </label>
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <Button
              onClick={submit}
              disabled={submitting || !signedName.trim() || !agreed}
              className="bg-orange-500 hover:bg-orange-400 text-white w-full"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Sign waiver
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
