import { resolvePlatformScope, coursesGet, coursesPost, coursesPatch, coursesDelete } from "@/lib/courses/api"

export async function GET() {
  const r = await resolvePlatformScope({ write: false })
  return r.ok ? coursesGet(r.scope) : r.res
}
export async function POST(request: Request) {
  const r = await resolvePlatformScope({ write: true })
  return r.ok ? coursesPost(r.scope, request) : r.res
}
export async function PATCH(request: Request) {
  const r = await resolvePlatformScope({ write: true })
  return r.ok ? coursesPatch(r.scope, request) : r.res
}
export async function DELETE(request: Request) {
  const r = await resolvePlatformScope({ write: true })
  return r.ok ? coursesDelete(r.scope, request) : r.res
}
