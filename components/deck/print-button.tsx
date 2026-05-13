"use client"

/**
 * Small floating "Save as PDF" button for the long-scroll deck pages.
 * Triggers the browser's print dialog — modern browsers let you save the
 * result as a PDF directly. The button itself hides from the printed
 * output via `print:hidden`; the chrome (SaaS header, OckOck nav/footer,
 * floating chat bubble) is also `print:hidden` so the PDF is just the
 * deck content.
 */
import { Printer } from "lucide-react"

export function PrintButton({ label = "Save as PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined") window.print()
      }}
      aria-label={label}
      title={label}
      className="fixed bottom-5 left-5 z-40 inline-flex h-10 items-center gap-1.5 rounded-xl bg-zinc-900/80 px-4 text-[12px] font-medium text-zinc-200 backdrop-blur ring-1 ring-zinc-800 transition-colors hover:bg-zinc-800 hover:text-white print:hidden"
    >
      <Printer className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}
