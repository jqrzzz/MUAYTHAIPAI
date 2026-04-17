import { createClient } from "@supabase/supabase-js"
import type { Metadata } from "next"
import { BadgeCheck, XCircle, Award, MapPin, Calendar, Share2, ExternalLink } from "lucide-react"
import { getLevelById } from "@/lib/certification-levels"

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

  const { data: cert } = await supabase
    .from("certificates")
    .select("level, level_number, users:user_id (full_name), organizations:org_id (name)")
    .eq("certificate_number", certNumber)
    .single()

  const levelConfig = cert ? getLevelById(cert.level) : null
  const student = cert?.users as unknown as { full_name: string | null } | null
  const org = cert?.organizations as unknown as { name: string } | null
  const studentName = student?.full_name || "Student"
  const levelName = levelConfig?.name || "Muay Thai"
  const gymName = org?.name || "MUAYTHAIPAI Network"

  const title = cert
    ? `${studentName} — ${levelName} (Level ${cert.level_number}) | MUAYTHAIPAI`
    : `Verify Certificate ${certNumber} | MUAYTHAIPAI`

  const description = cert
    ? `${studentName} earned the ${levelName} certification (Level ${cert.level_number}) at ${gymName}. Verified through the Naga-to-Garuda Muay Thai Certification System.`
    : "Verify a Muay Thai certification issued through the MUAYTHAIPAI network."

  return {
    title,
    description,
    robots: "noindex",
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "MUAYTHAIPAI Certification Network",
      images: [{ url: "/images/muay-thai-logo-og.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
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
  const levelConfig = getLevelById(cert.level)
  const isActive = cert.status === "active"
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://muaythaipai.com"
  const verifyUrl = `${siteUrl}/verify/${certNumber}`
  const studentName = student?.full_name || "Student"
  const levelName = levelConfig?.name || cert.level

  const shareText = `I earned the ${levelName} certification (Level ${cert.level_number}) in Muay Thai at ${org.name}! 🥊`

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
            {levelConfig && (
              <span className="text-5xl mb-2 block">{levelConfig.icon}</span>
            )}
            <Award className={`mx-auto mb-2 h-8 w-8 ${style.color}`} />
            <p className={`text-xs font-semibold uppercase tracking-widest ${style.color}`}>
              Level {cert.level_number}
            </p>
            <h1 className="text-3xl font-bold text-white">{levelName}</h1>
            <p className="mt-1 text-sm text-neutral-400">Muay Thai Certification</p>
            {levelConfig && (
              <p className="mt-0.5 text-xs text-neutral-500">{levelConfig.creature} &middot; {levelConfig.duration} program</p>
            )}
          </div>

          <hr className="my-4 border-white/10" />

          {/* Details */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Student</span>
              <span className="font-medium text-white">{studentName}</span>
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

            {/* Skills count */}
            {levelConfig && (
              <div className="flex justify-between">
                <span className="text-neutral-500">Skills assessed</span>
                <span className="text-neutral-300">{levelConfig.skills.length} competencies</span>
              </div>
            )}
          </div>

          {/* Print certificate link */}
          {isActive && (
            <div className="mt-4 pt-4 border-t border-white/10 text-center">
              <a
                href={`/verify/${certNumber}/print`}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-xs ${style.color} hover:underline`}
              >
                Print Certificate &rarr;
              </a>
            </div>
          )}
        </div>

        {/* Share buttons */}
        {isActive && (
          <div className="mt-4 space-y-3">
            <p className="text-center text-xs text-neutral-500 flex items-center justify-center gap-1">
              <Share2 className="h-3 w-3" />
              Share this achievement
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(verifyUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full bg-blue-600/20 text-blue-400 text-xs font-medium hover:bg-blue-600/30 transition-colors"
              >
                Facebook
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(verifyUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full bg-neutral-700/50 text-neutral-300 text-xs font-medium hover:bg-neutral-700/70 transition-colors"
              >
                X / Twitter
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full bg-blue-700/20 text-blue-300 text-xs font-medium hover:bg-blue-700/30 transition-colors"
              >
                LinkedIn
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${verifyUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full bg-green-600/20 text-green-400 text-xs font-medium hover:bg-green-600/30 transition-colors"
              >
                WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* QR Code section */}
        <div className="mt-6 text-center">
          {/* QR code via public API — lightweight SVG generation */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(verifyUrl)}&bgcolor=0a0a0a&color=ffffff&format=svg`}
            alt={`QR code for certificate ${certNumber}`}
            width={120}
            height={120}
            className="mx-auto rounded-lg"
          />
          <p className="mt-2 text-[10px] text-neutral-600">
            Scan to verify
          </p>
        </div>

        {/* Network badge */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-neutral-600">
            Issued through the MUAYTHAIPAI Network &middot; Naga-to-Garuda Certification System
          </p>
          <a
            href="/certificate-programs"
            className="inline-flex items-center gap-1 text-xs text-orange-500/70 hover:text-orange-400 transition-colors"
          >
            Learn about our certification programs
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  )
}
