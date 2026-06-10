import { resolvePlatformScope, modulesGet, modulesPost, modulesPatch, modulesDelete } from "@/lib/courses/api"

export async function GET(request: Request) {
  const r = await resolvePlatformScope({ write: false })
  return r.ok ? modulesGet(r.scope, request) : r.res
}
export async function POST(request: Request) {
  const r = await resolvePlatformScope({ write: true })
  return r.ok ? modulesPost(r.scope, request) : r.res
}
export async function PATCH(request: Request) {
  const r = await resolvePlatformScope({ write: true })
  return r.ok ? modulesPatch(r.scope, request) : r.res
}
export async function DELETE(request: Request) {
  const r = await resolvePlatformScope({ write: true })
  return r.ok ? modulesDelete(r.scope, request) : r.res
}
