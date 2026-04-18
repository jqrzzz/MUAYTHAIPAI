import { createClient } from "@supabase/supabase-js"
import { EmailService } from "@/lib/email-service"
import { getLevelById } from "@/lib/certification-levels"

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function notifyStudentCertificateIssued(data: {
  studentId: string
  levelId: string
  certificateNumber: string
  orgId: string
}) {
  const levelConfig = getLevelById(data.levelId)
  if (!levelConfig) return

  const [{ data: student }, { data: org }] = await Promise.all([
    serviceClient.from("users").select("full_name, email").eq("id", data.studentId).single(),
    serviceClient.from("organizations").select("name").eq("id", data.orgId).single(),
  ])

  if (!student?.email) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://muaythaipai.com"

  const emailService = EmailService.getInstance()
  await emailService.sendCertificateIssuedEmail({
    studentName: student.full_name || "Student",
    studentEmail: student.email,
    levelName: levelConfig.name,
    levelIcon: levelConfig.icon,
    levelNumber: levelConfig.number,
    certificateNumber: data.certificateNumber,
    verificationUrl: `${siteUrl}/verify/${data.certificateNumber}`,
    printUrl: `${siteUrl}/verify/${data.certificateNumber}/print`,
    gymName: org?.name || "Your Gym",
    issuedAt: new Date().toISOString(),
  })
}

export async function notifyStudentCourseCompleted(data: {
  studentId: string
  courseTitle: string
  certificateLevel: string
}) {
  const levelConfig = getLevelById(data.certificateLevel)
  if (!levelConfig) return

  const { data: student } = await serviceClient
    .from("users")
    .select("full_name, email")
    .eq("id", data.studentId)
    .single()

  if (!student?.email) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://muaythaipai.com"

  const emailService = EmailService.getInstance()
  await emailService.sendCourseCompletedEmail({
    studentName: student.full_name || "Student",
    studentEmail: student.email,
    courseTitle: data.courseTitle,
    levelName: levelConfig.name,
    levelIcon: levelConfig.icon,
    siteUrl,
  })
}
