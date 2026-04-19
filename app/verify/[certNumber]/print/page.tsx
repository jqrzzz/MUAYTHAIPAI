import { createClient } from "@supabase/supabase-js"
import type { Metadata } from "next"
import { getLevelById } from "@/lib/certification-levels"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Props {
  params: Promise<{ certNumber: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { certNumber } = await params
  return {
    title: `Certificate ${certNumber} | MUAYTHAIPAI`,
    robots: "noindex",
  }
}

export default async function PrintCertificatePage({ params }: Props) {
  const { certNumber } = await params

  const { data: cert } = await supabase
    .from("certificates")
    .select(`
      *,
      users:user_id (full_name),
      issued_by_trainer:issued_by (display_name),
      organizations:org_id (name, city, province)
    `)
    .eq("certificate_number", certNumber)
    .single()

  if (!cert || cert.status !== "active") {
    return (
      <div style={{ padding: "4rem", textAlign: "center", fontFamily: "serif" }}>
        <h1>Certificate Not Found</h1>
        <p>This certificate does not exist or has been revoked.</p>
      </div>
    )
  }

  const org = cert.organizations as unknown as { name: string; city: string | null; province: string | null }
  const student = cert.users as unknown as { full_name: string | null }
  const trainer = cert.issued_by_trainer as unknown as { display_name: string } | null
  const levelConfig = getLevelById(cert.level)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://muaythaipai.com"
  const verifyUrl = `${siteUrl}/verify/${certNumber}`
  const issuedDate = new Date(cert.issued_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const LEVEL_COLORS: Record<string, string> = {
    naga: "#3b82f6",
    "phayra-nak": "#10b981",
    singha: "#f59e0b",
    hanuman: "#94a3b8",
    garuda: "#eab308",
  }
  const accentColor = LEVEL_COLORS[cert.level] || "#f97316"

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .cert-page {
            width: 297mm; height: 210mm;
            page-break-after: always;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        @page { size: landscape A4; margin: 0; }
      `}</style>

      {/* Print button - uses inline script since this is a server component */}
      <div className="no-print" style={{
        position: "fixed", top: "1rem", right: "1rem", zIndex: 50,
        display: "flex", gap: "0.5rem",
      }}>
        <button
          id="print-btn"
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#f97316",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "0.875rem",
          }}
        >
          Print / Save as PDF
        </button>
        <a
          href={`/verify/${certNumber}`}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#262626",
            color: "#a3a3a3",
            border: "1px solid #404040",
            borderRadius: "0.5rem",
            textDecoration: "none",
            fontSize: "0.875rem",
          }}
        >
          Back to verification
        </a>
      </div>
      <script dangerouslySetInnerHTML={{ __html: `document.getElementById('print-btn').addEventListener('click',function(){window.print()})` }} />

      {/* Certificate */}
      <div
        className="cert-page"
        style={{
          width: "297mm",
          height: "210mm",
          margin: "0 auto",
          background: "#0a0a0a",
          position: "relative",
          overflow: "hidden",
          fontFamily: "'Georgia', 'Times New Roman', serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
        }}
      >
        {/* Border frame */}
        <div style={{
          position: "absolute",
          inset: "12mm",
          border: `2px solid ${accentColor}40`,
          borderRadius: "4px",
        }} />
        <div style={{
          position: "absolute",
          inset: "14mm",
          border: `1px solid ${accentColor}20`,
          borderRadius: "2px",
        }} />

        {/* Corner decorations */}
        {[
          { top: "10mm", left: "10mm" },
          { top: "10mm", right: "10mm" },
          { bottom: "10mm", left: "10mm" },
          { bottom: "10mm", right: "10mm" },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              ...pos,
              width: "20mm",
              height: "20mm",
              borderTop: i < 2 ? `3px solid ${accentColor}` : "none",
              borderBottom: i >= 2 ? `3px solid ${accentColor}` : "none",
              borderLeft: i % 2 === 0 ? `3px solid ${accentColor}` : "none",
              borderRight: i % 2 === 1 ? `3px solid ${accentColor}` : "none",
            }}
          />
        ))}

        {/* Content */}
        <div style={{ textAlign: "center", maxWidth: "220mm", padding: "0 20mm" }}>
          {/* Creature icon */}
          {levelConfig && (
            <div style={{ fontSize: "3rem", marginBottom: "4mm" }}>
              {levelConfig.icon}
            </div>
          )}

          {/* Title */}
          <p style={{
            fontSize: "10pt",
            letterSpacing: "4px",
            textTransform: "uppercase",
            color: accentColor,
            marginBottom: "2mm",
          }}>
            Certificate of Achievement
          </p>

          <h1 style={{
            fontSize: "32pt",
            fontWeight: "bold",
            margin: "4mm 0",
            color: "white",
          }}>
            {levelConfig?.name || cert.level}
          </h1>

          <p style={{
            fontSize: "11pt",
            color: "#a3a3a3",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "8mm",
          }}>
            Level {cert.level_number} — Muay Thai Certification
          </p>

          {/* Divider */}
          <div style={{
            width: "60mm",
            height: "1px",
            background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
            margin: "0 auto 8mm",
          }} />

          {/* Awarded to */}
          <p style={{ fontSize: "10pt", color: "#737373", marginBottom: "2mm" }}>
            Awarded to
          </p>
          <h2 style={{
            fontSize: "24pt",
            fontStyle: "italic",
            fontWeight: "normal",
            margin: "0 0 8mm",
            color: "white",
          }}>
            {student?.full_name || "—"}
          </h2>

          {/* Description */}
          <p style={{
            fontSize: "9pt",
            color: "#a3a3a3",
            lineHeight: "1.6",
            maxWidth: "160mm",
            margin: "0 auto 10mm",
          }}>
            For successfully completing the {levelConfig?.name || cert.level} certification program,
            demonstrating proficiency in {levelConfig?.skills.length || 0} assessed competencies
            of authentic Muay Thai at {org.name}
            {org.city ? `, ${org.city}` : ""}
            {org.province ? `, ${org.province}` : ""}, Thailand.
          </p>

          {/* Signatures area */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "40mm",
            marginBottom: "6mm",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "50mm",
                borderBottom: "1px solid #404040",
                marginBottom: "2mm",
                height: "8mm",
              }} />
              <p style={{ fontSize: "8pt", color: "#737373" }}>{trainer?.display_name || "Gym Staff"}</p>
              <p style={{ fontSize: "7pt", color: "#525252" }}>Instructor</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "50mm",
                borderBottom: "1px solid #404040",
                marginBottom: "2mm",
                height: "8mm",
              }} />
              <p style={{ fontSize: "8pt", color: "#737373" }}>{org.name}</p>
              <p style={{ fontSize: "7pt", color: "#525252" }}>Certifying Gym</p>
            </div>
          </div>

          {/* Footer details */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "16mm",
            fontSize: "7pt",
            color: "#525252",
          }}>
            <span>Issued: {issuedDate}</span>
            <span>Certificate #: {cert.certificate_number}</span>
            <span>Verify: {verifyUrl}</span>
          </div>

          {/* Network badge */}
          <p style={{
            fontSize: "7pt",
            color: "#404040",
            marginTop: "6mm",
            letterSpacing: "1px",
          }}>
            MUAYTHAIPAI NETWORK &middot; NAGA-TO-GARUDA CERTIFICATION SYSTEM
          </p>
        </div>
      </div>
    </>
  )
}
