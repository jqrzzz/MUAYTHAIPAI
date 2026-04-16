"use client"

import { useState } from "react"

export default function ConfirmForm({ tokenId }: { tokenId: string }) {
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)

    try {
      const res = await fetch(`/api/actions/${tokenId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (res.ok) {
        window.location.href = `/a/${tokenId}?consumed=1`
      } else {
        const body = await res.json().catch(() => ({}))
        const code =
          typeof body?.error === "string" ? body.error : "execute_failed"
        window.location.href = `/a/${tokenId}?error=${encodeURIComponent(code)}`
      }
    } catch {
      window.location.href = `/a/${tokenId}?error=execute_failed`
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <button
        type="submit"
        disabled={submitting}
        className="flex-1 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:bg-orange-700 disabled:opacity-60"
      >
        {submitting ? "Confirming…" : "Confirm"}
      </button>
      <a
        href="/"
        className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
      >
        Cancel
      </a>
    </form>
  )
}
