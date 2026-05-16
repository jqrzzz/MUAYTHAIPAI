import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import { SaasShell, SaasHeader, StatusDot } from "@/components/saas"
import BoardroomClient, { type BFile, type BNotes, type BComment, type BUser } from "./client"

export const metadata = {
  title: "Boardroom — MUAYTHAIPAI",
  robots: "noindex, nofollow",
}

const BUCKET = "boardroom"
const SIGNED_URL_TTL = 3600 // 1 hour

export default async function BoardroomPage() {
  const { supabase, user, isPlatformAdmin } = await getPlatformAdmin()
  if (!user) redirect("/admin/login?redirect=/platform-admin/boardroom")
  if (!isPlatformAdmin) redirect("/admin")

  // Pull files + notes + comments. (RLS lets platform admins read these.)
  const [filesRes, notesRes, commentsRes] = await Promise.all([
    supabase
      .from("boardroom_files")
      .select("id, name, storage_path, mime_type, size_bytes, uploaded_by, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("boardroom_notes")
      .select("body, updated_by, updated_at")
      .eq("id", 1)
      .maybeSingle(),
    supabase
      .from("boardroom_comments")
      .select("id, body, author_id, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ])

  const files = (filesRes.data ?? []) as Array<{
    id: string
    name: string
    storage_path: string
    mime_type: string | null
    size_bytes: number | null
    uploaded_by: string | null
    created_at: string
  }>
  const notesRow = notesRes.data as { body: string; updated_by: string | null; updated_at: string | null } | null
  const comments = (commentsRes.data ?? []) as Array<{
    id: string
    body: string
    author_id: string | null
    created_at: string
  }>

  // Resolve user display info in one extra query.
  const userIds = new Set<string>()
  for (const f of files) if (f.uploaded_by) userIds.add(f.uploaded_by)
  if (notesRow?.updated_by) userIds.add(notesRow.updated_by)
  for (const c of comments) if (c.author_id) userIds.add(c.author_id)

  const usersById = new Map<string, BUser>()
  if (userIds.size > 0) {
    const { data: rows } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", Array.from(userIds))
    for (const u of rows ?? []) usersById.set(u.id, u as BUser)
  }

  // Sign download URLs server-side (the bucket is private). Service role
  // so we don't need a separate storage.objects RLS policy.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const service = url && key
    ? createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    : null

  const signedFiles: BFile[] = await Promise.all(
    files.map(async (f) => {
      let signedUrl: string | null = null
      if (service) {
        const { data } = await service.storage.from(BUCKET).createSignedUrl(f.storage_path, SIGNED_URL_TTL)
        signedUrl = data?.signedUrl ?? null
      }
      return {
        id: f.id,
        name: f.name,
        mime_type: f.mime_type,
        size_bytes: f.size_bytes,
        created_at: f.created_at,
        uploaded_by: f.uploaded_by,
        uploader: f.uploaded_by ? usersById.get(f.uploaded_by) ?? null : null,
        signedUrl,
      }
    }),
  )

  const notes: BNotes = {
    body: notesRow?.body ?? "",
    updated_at: notesRow?.updated_at ?? null,
    editor: notesRow?.updated_by ? usersById.get(notesRow.updated_by) ?? null : null,
  }

  const enrichedComments: BComment[] = comments.map((c) => ({
    id: c.id,
    body: c.body,
    created_at: c.created_at,
    author_id: c.author_id,
    author: c.author_id ? usersById.get(c.author_id) ?? null : null,
  }))

  return (
    <SaasShell>
      <SaasHeader
        left={
          <>
            <StatusDot />
            <p className="text-[13px] text-zinc-400">Boardroom</p>
          </>
        }
        right={
          <Link
            href="/platform-admin/today"
            className="inline-flex items-center gap-1 text-[12px] text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Today
          </Link>
        }
      />
      <main className="mx-auto max-w-3xl px-5 py-8">
        {/* Partner deck — the pitch / vision doc, viewable in-app */}
        <Link href="/platform-admin/boardroom/pitch" className="mb-6 block group">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/[0.12] via-indigo-500/[0.04] to-zinc-900/40 p-5 ring-1 ring-indigo-500/30 transition-all hover:ring-indigo-500/50">
            <div className="flex items-center gap-4">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 ring-1 ring-indigo-500/30 text-xl">
                🐃
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-300/80">Partner deck · v0.1</p>
                <p className="mt-0.5 font-display text-[18px] text-white">
                  The operating system for traditional Muay Thai
                </p>
                <p className="mt-1 text-[12px] text-zinc-500 truncate">
                  Vision · wedge · moat · roadmap · the ask — viewable in-app
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-600 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-indigo-300" />
            </div>
          </div>
        </Link>

        <BoardroomClient
          initialFiles={signedFiles}
          initialNotes={notes}
          initialComments={enrichedComments}
        />
      </main>
    </SaasShell>
  )
}
