"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Code2, Check, Copy, ExternalLink } from "lucide-react"

interface EmbedSnippetCardProps {
  slug: string
}

const SITE_ORIGIN = "https://muaythaipai.com"

export default function EmbedSnippetCard({ slug }: EmbedSnippetCardProps) {
  const [copied, setCopied] = useState(false)

  const snippet = `<script src="${SITE_ORIGIN}/embed.js" data-gym="${slug}" async></script>`
  const previewUrl = `${SITE_ORIGIN}/embed/${slug}`

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea")
      ta.value = snippet
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <Card className="bg-neutral-900/50 border-neutral-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Code2 className="w-5 h-5 text-orange-400" />
          Embed widget
        </CardTitle>
        <CardDescription>
          Drop this on your existing gym website (Wix, Squarespace, WordPress —
          anywhere). Visitors see your services and book directly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-neutral-300 overflow-x-auto">
          <code className="whitespace-nowrap">{snippet}</code>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={onCopy}
            size="sm"
            className="bg-orange-500 hover:bg-orange-400 text-white"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Copy snippet
              </>
            )}
          </Button>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-700 bg-transparent px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Preview
          </a>
        </div>

        <div className="rounded-lg border border-orange-500/20 bg-orange-500/[0.04] p-3 text-xs text-neutral-300 leading-relaxed">
          <p className="font-semibold text-white mb-1.5">How it works</p>
          <ul className="space-y-1 text-neutral-400">
            <li>
              • Paste the snippet wherever you want the widget on your site —
              the iframe sizes itself automatically.
            </li>
            <li>
              • Visitors see your live services, prices, and a Book button that
              opens the full booking flow on muaythaipai.com.
            </li>
            <li>
              • Bookings flow into this dashboard. No double entry, no manual
              syncing.
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
