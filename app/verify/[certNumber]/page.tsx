import { createClient } from "@supabase/supabase-js"
import type { Metadata } from "next"
import { BadgeCheck, XCircle, MapPin, Calendar, Share2, ExternalLink, ScrollText, ChevronRight } from "lucide-react"
import { getLevelById } from "@/lib/certification-levels"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

interface Props {
  params: Promise<{ certNumber: string }>
}

const LEVEL_STYLES: Record<
  string,
  { color: string; bg: string; border: string; ring: string; label: string }
> = {
  naga: { color: "text-blue-300", bg: "bg-blue-500/[0.06]", border: "border-blue-500/25", ring: "ring-blue-500/30", label: "Naga" },
  "phayra-nak": { color: "text-emerald-300", bg: "bg-emerald-500/[0.06]", border: "border-emerald-500/25", ring: "ring-emerald-500/30", label: "Phayra Nak" },
  singha: { color: "text-amber-300", bg: "bg-amber-500/[0.06]", border: "border-amber-500/25", ring: "ring-amber-500/30", label: "Singha" },
  hanuman: { color: "text-slate-300", bg: "bg-slate-500/[0.06]", border: "border-slate-500/25", ring: "ring-slate-500/30", label: "Hanuman" },
  garuda: { color: "text-yellow-300", bg: "bg-yellow-500/[0.06]", border: "border-yellow-500/25", ring: "ring-yellow-500/30", label: "Garuda" },
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
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function VerifyCertificatePage({ params }: Props) {
  const { certNumber } = await params

  const { data: cert } = await supabase
    .from("certificates")
    .select(`
      *,
      users:user_id (id, full_name, public_passport_enabled, public_passport_handle),
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
          <h1 className="font-display text-[28px] text-white">Certificate Not Found</h1>
          <p className="mt-2 text-sm text-neutral-400">
            No certificate with number{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5">{certNumber}</code>{" "}
            exists in the MUAYTHAIPAI network.
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
  const student = cert.users as unknown as {
    id: string
    full_name: string | null
    public_passport_enabled: boolean | null
    public_passport_handle: string | null
  }
  const trainer = cert.issued_by_trainer as unknown as { display_name: string } | null
  const style = LEVEL_STYLES[cert.level] || LEVEL_STYLES.naga
  const levelConfig = getLevelById(cert.level)
  const isActive = cert.status === "active"
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://muaythaipai.com"
  const verifyUrl = `${siteUrl}/verify/${certNumber}`
  const studentName = student?.full_name || "Student"
  const levelName = levelConfig?.name || cert.level

  // Pull per-skill signoffs for this cert's user + level. Joined to
  // users for examiner name + instructor handle. Sorted by skill_index
  // so the syllabus reads in the right order.
  const { data: signoffsRaw } = await supabase
    .from("skill_signoffs")
    .select(`
      skill_index, notes, signed_off_at,
      signed_off_by_user:signed_off_by (
        full_name, public_instructor_enabled, public_instructor_handle
      )
    `)
    .eq("student_id", student.id)
    .eq("level", cert.level)
    .order("skill_index", { ascending: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const signoffs = ((signoffsRaw ?? []) as any[]).map((s) => {
    const signer = Array.isArray(s.signed_off_by_user)
      ? s.signed_off_by_user[0]
      : s.signed_off_by_user
    const instructorHandle =
      signer?.public_instructor_enabled && signer?.public_instructor_handle
        ? (signer.public_instructor_handle as string)
        : null
    return {
      skill_index: s.skill_index as number,
      signed_at: s.signed_off_at as string,
      signer_name: (signer?.full_name as string | null) ?? null,
      signer_handle: instructorHandle,
      notes: s.notes as string | null,
    }
  })
  const signoffByIndex = new Map(signoffs.map((s) => [s.skill_index, s]))

  // Unique examiners — preserve handle if any, deduped by name
  const examinerMap = new Map<string, string | null>()
  for (const s of signoffs) {
    if (s.signer_name && !examinerMap.has(s.signer_name)) {
      examinerMap.set(s.signer_name, s.signer_handle)
    }
  }
  const examiners = Array.from(examinerMap.entries()) as Array<[string, string | null]>

  const shareText = `I earned the ${levelName} certification (Level ${cert.level_number}) in Muay Thai at ${org.name}! 🥊`

  return (
    <div className="min-h-screen bg-neutral-950 py-8 px-4">
      <div className="mx-auto w-full max-w-2xl">
        {/* Status banner */}
        <div
          className={`mb-6 mx-auto inline-flex w-auto items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
            isActive
              ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/25"
              : "bg-red-500/10 text-red-300 ring-1 ring-red-500/25"
          }`}
          style={{ display: "table" }}
        >
          {isActive ? (
            <span className="inline-flex items-center gap-2">
              <BadgeCheck className="h-4 w-4" />
              Verified Certificate
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Certificate Revoked
            </span>
          )}
        </div>

        {/* Certificate card */}
        <div className={`rounded-2xl border ${style.border} ${style.bg} backdrop-blur-sm p-8`}>
          {/* Level badge */}
          <div className="mb-6 text-center">
            {levelConfig && (
              <span className="text-[64px] block leading-none">{levelConfig.icon}</span>
            )}
            <p
              className={`font-display text-[11px] uppercase tracking-[0.28em] mt-3 ${style.color}`}
            >
              {levelConfig?.creature ?? "Muay Thai"} · Level {cert.level_number}
            </p>
            <h1 className="font-display text-[40px] sm:text-[48px] leading-tight text-white mt-2">
              {levelName}
            </h1>
            <p className="font-serif italic text-[15px] text-neutral-400 mt-2">
              {levelConfig?.duration} program · Naga-to-Garuda Certification System
            </p>
          </div>

          <hr className="my-6 border-white/10" />

          {/* Awardee */}
          <div className="text-center mb-6">
            <p className="font-display text-[10px] uppercase tracking-[0.22em] text-neutral-500 mb-1">
              This certifies that
            </p>
            <h2 className="font-display text-[28px] text-white">
              {student.public_passport_enabled && student.public_passport_handle ? (
                <a
                  href={`/p/${student.public_passport_handle}`}
                  className="hover:text-orange-200 transition-colors inline-flex items-center gap-2"
                >
                  {studentName}
                  <ChevronRight className="h-5 w-5 text-zinc-700" />
                </a>
              ) : (
                studentName
              )}
            </h2>
            <p className="font-serif italic text-[14px] text-neutral-500 mt-1">
              has demonstrated mastery of the skills enumerated below.
            </p>
          </div>

          {/* Issued metadata */}
          <div className="grid grid-cols-2 gap-3 text-[13px] mb-6">
            <Detail label="Issued by" value={trainer?.display_name || "Gym Staff"} />
            <Detail
              label="Gym"
              value={org.name}
              icon={org.verified ? <BadgeCheck className="h-3 w-3 text-blue-400" /> : null}
            />
            <Detail
              label="Issued"
              value={new Date(cert.issued_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              icon={<Calendar className="h-3 w-3 text-zinc-500" />}
            />
            {(org.city || org.province) && (
              <Detail
                label="Location"
                value={[org.city, org.province].filter(Boolean).join(", ")}
                icon={<MapPin className="h-3 w-3 text-zinc-500" />}
              />
            )}
            <Detail label="Certificate №" value={cert.certificate_number} mono />
            {examiners.length > 0 && (
              <div>
                <p className="font-display text-[9px] uppercase tracking-[0.16em] text-neutral-500 mb-0.5">
                  {examiners.length === 1 ? "Examiner" : "Examiners"}
                </p>
                <p className="text-neutral-200 text-[13px]">
                  {examiners.map(([name, handle], i) => (
                    <span key={name}>
                      {handle ? (
                        <a
                          href={`/i/${handle}`}
                          className="text-neutral-100 underline decoration-orange-400/40 underline-offset-2 hover:decoration-orange-300 transition-colors"
                        >
                          {name}
                        </a>
                      ) : (
                        name
                      )}
                      {i < examiners.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </p>
              </div>
            )}
          </div>

          {/* SKILLS ATTESTED — the credential substance */}
          {levelConfig && levelConfig.skills.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-baseline justify-between mb-4">
                <p className="font-display text-[10px] uppercase tracking-[0.22em] text-neutral-500 inline-flex items-center gap-1.5">
                  <ScrollText className="h-3 w-3" />
                  Skills Attested
                </p>
                <p className="text-[11px] text-neutral-600 tabular-nums">
                  {signoffs.length}/{levelConfig.skills.length} signed off
                </p>
              </div>
              <ol className="space-y-2">
                {levelConfig.skills.map((skill, i) => {
                  const signoff = signoffByIndex.get(i)
                  return (
                    <li
                      key={i}
                      className={`text-[13px] flex items-start gap-3 ${
                        signoff ? "" : "opacity-60"
                      }`}
                    >
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] tabular-nums font-medium shrink-0 mt-0.5 ${
                          signoff
                            ? `${style.ring} ring-1 ${style.color} bg-white/[0.04]`
                            : "ring-1 ring-white/10 text-neutral-600"
                        }`}
                      >
                        {signoff ? "✓" : i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-neutral-200 leading-snug">{skill}</p>
                        {signoff && (
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            {signoff.signer_name ? (
                              <>
                                Signed by{" "}
                                {signoff.signer_handle ? (
                                  <a
                                    href={`/i/${signoff.signer_handle}`}
                                    className="text-neutral-200 underline decoration-orange-400/40 underline-offset-2 hover:decoration-orange-300 transition-colors font-medium"
                                  >
                                    {signoff.signer_name}
                                  </a>
                                ) : (
                                  <strong className="text-neutral-300">
                                    {signoff.signer_name}
                                  </strong>
                                )}
                              </>
                            ) : (
                              "Signed by gym staff"
                            )}
                            {" · "}
                            {new Date(signoff.signed_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                            {signoff.notes && (
                              <span className="block italic mt-0.5 text-neutral-600 font-serif">
                                &ldquo;{signoff.notes}&rdquo;
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          )}

          {/* Print link */}
          {isActive && (
            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <a
                href={`/verify/${certNumber}/print`}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-xs ${style.color} hover:underline`}
              >
                Print certificate &rarr;
              </a>
            </div>
          )}
        </div>

        {/* Public passport CTA if enabled */}
        {student.public_passport_enabled && student.public_passport_handle && (
          <div className="mt-4 text-center">
            <a
              href={`/p/${student.public_passport_handle}`}
              className="inline-flex items-center gap-1.5 text-[13px] text-orange-300 hover:text-orange-200 transition-colors"
            >
              View {studentName.split(" ")[0]}&apos;s full passport
              <ChevronRight className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Share */}
        {isActive && (
          <div className="mt-6 space-y-3">
            <p className="font-display text-[10px] uppercase tracking-[0.18em] text-neutral-500 text-center inline-flex items-center justify-center gap-1 w-full">
              <Share2 className="h-3 w-3" />
              Share This Achievement
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(verifyUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full bg-blue-600/15 text-blue-300 text-xs font-medium hover:bg-blue-600/25 transition-colors ring-1 ring-blue-500/20"
              >
                Facebook
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(verifyUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full bg-neutral-800 text-neutral-300 text-xs font-medium hover:bg-neutral-700 transition-colors ring-1 ring-white/10"
              >
                X / Twitter
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full bg-blue-700/15 text-blue-200 text-xs font-medium hover:bg-blue-700/25 transition-colors ring-1 ring-blue-500/20"
              >
                LinkedIn
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${verifyUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full bg-green-600/15 text-green-300 text-xs font-medium hover:bg-green-600/25 transition-colors ring-1 ring-green-500/20"
              >
                WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* QR Code */}
        <div className="mt-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(verifyUrl)}&bgcolor=0a0a0a&color=ffffff&format=svg`}
            alt={`QR code for certificate ${certNumber}`}
            width={120}
            height={120}
            className="mx-auto rounded-lg"
          />
          <p className="mt-2 text-[10px] text-neutral-600">Scan to verify</p>
        </div>

        {/* Network footer */}
        <div className="mt-8 text-center space-y-2">
          <p className="font-display text-[10px] uppercase tracking-[0.18em] text-neutral-600">
            MUAYTHAIPAI Network · Naga-to-Garuda Certification System
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

function Detail({
  label,
  value,
  icon,
  mono,
}: {
  label: string
  value: string
  icon?: React.ReactNode
  mono?: boolean
}) {
  return (
    <div>
      <p className="font-display text-[9px] uppercase tracking-[0.16em] text-neutral-500 mb-0.5">
        {label}
      </p>
      <p
        className={`text-neutral-200 inline-flex items-center gap-1 ${
          mono ? "font-mono text-[12px]" : ""
        }`}
      >
        {icon}
        <span className="truncate">{value}</span>
      </p>
    </div>
  )
}
