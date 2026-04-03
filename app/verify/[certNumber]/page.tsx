import { createClient } from "@supabase/supabase-js"
import type { Metadata } from "next"
import { BadgeCheck, XCircle, Award, MapPin, Calendar } from "lucide-react"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Props {
  params: Promise<{ certNumber: string }>
}

const LEVEL_STYLES: Record<string, { color: string; bg: string; border: string; label: string }> = {
  naga: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", label: "Naga" },
  "phayra-nak": { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "Phayra Nak" },
  singha: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "Singha" },
  hanuman: { color: "text-slate-300", bg: "bg-slate-500/10", border: "border-slate-500/30", label: "Hanuman" },
  garuda: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", label: "Garuda" },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { certNumber } = await params
  return {
    title: `Verify Certificate ${certNumber} | MUAYTHAIPAI`,
    description: "Verify a Muay Thai certification issued through the MUAYTHAIPAI network.",
    robots: "noindex",
  }
}

export default async function VerifyCertificatePage({ params }: Props) {
  const { certNumber } = await params

  const { data: cert } = await supabase
    .from("certificates")
    .select(`
      *,
      users:user_id (full_name),
      issued_by_trainer:issued_by (display_name),
      organizations:org_id (name, city, province, slug, verified)
    `)
    .eq("certificate_number", certNumber)
    .single()

  if (!cert) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
        <div className="mx-auto max-w-md text-center">
          <XCircle className="mx-auto mb-4 h-16 w-16 text-red-400" />
          <h1 className="text-2xl font-bold text-white">Certificate Not Found</h1>
          <p className="mt-2 text-sm text-neutral-400">
            No certificate with number <code className="rounded bg-white/10 px-1.5 py-0.5">{certNumber}</code> exists in the MUAYTHAIPAI network.
          </p>
        </div>
      </div>
    )
  }

  const org = cert.organizations as unknown as {
    name: string
    city: string | null
    province: string | null
    slug: string
    verified: boolean
  }
  const student = cert.users as unknown as { full_name: string | null }
  const trainer = cert.issued_by_trainer as unknown as { display_name: string } | null
  const style = LEVEL_STYLES[cert.level] || LEVEL_STYLES.naga
  const isActive = cert.status === "active"

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
      <div className="mx-auto w-full max-w-md">
        {/* Status banner */}
        <div
          className={`mb-6 flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
            isActive
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {isActive ? (
            <>
              <BadgeCheck className="h-4 w-4" />
              Verified Certificate
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              Certificate Revoked
            </>
          )}
        </div>

        {/* Certificate card */}
        <div className={`rounded-2xl border ${style.border} ${style.bg} p-6`}>
          {/* Level badge */}
          <div className="mb-4 text-center">
            <Award className={`mx-auto mb-2 h-12 w-12 ${style.color}`} />
            <p className={`text-xs font-semibold uppercase tracking-widest ${style.color}`}>
              Level {cert.level_number}
            </p>
            <h1 className="text-3xl font-bold text-white">{style.label}</h1>
            <p className="mt-1 text-sm text-neutral-400">Muay Thai Certification</p>
          </div>

          <hr className="my-4 border-white/10" />

          {/* Details */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Student</span>
              <span className="font-medium text-white">{student?.full_name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Issued by</span>
              <span className="font-medium text-white">{trainer?.display_name || "Gym Staff"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Gym</span>
              <span className="font-medium text-white flex items-center gap-1">
                {org.name}
                {org.verified && <BadgeCheck className="h-3.5 w-3.5 text-blue-400" />}
              </span>
            </div>
            {(org.city || org.province) && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Location</span>
                <span className="text-neutral-300 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[org.city, org.province].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Issued</span>
              <span className="text-neutral-300 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(cert.issued_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Certificate #</span>
              <code className="text-xs text-neutral-400">{cert.certificate_number}</code>
            </div>
          </div>
        </div>

        {/* Network badge */}
        <p className="mt-6 text-center text-xs text-neutral-600">
          Issued through the MUAYTHAIPAI Network &middot; Naga-to-Garuda Certification System
        </p>
      </div>
    </div>
  )
}
