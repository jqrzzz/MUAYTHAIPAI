import { resolvePlatformScope, quizGet, quizPost, quizPatch, quizDelete } from "@/lib/courses/api"

export async function GET(request: Request) {
  const r = await resolvePlatformScope({ write: false })
  return r.ok ? quizGet(r.scope, request) : r.res
}
export async function POST(request: Request) {
  const r = await resolvePlatformScope({ write: true })
  return r.ok ? quizPost(r.scope, request) : r.res
}
export async function PATCH(request: Request) {
  const r = await resolvePlatformScope({ write: true })
  return r.ok ? quizPatch(r.scope, request) : r.res
}
export async function DELETE(request: Request) {
  const r = await resolvePlatformScope({ write: true })
  return r.ok ? quizDelete(r.scope, request) : r.res
}
