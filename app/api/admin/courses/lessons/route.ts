import { resolveGymScope, lessonsGet, lessonsPost, lessonsPatch, lessonsDelete } from "@/lib/courses/api"

export async function GET(request: Request) {
  const r = await resolveGymScope({ write: false })
  return r.ok ? lessonsGet(r.scope, request) : r.res
}
export async function POST(request: Request) {
  const r = await resolveGymScope({ write: true })
  return r.ok ? lessonsPost(r.scope, request) : r.res
}
export async function PATCH(request: Request) {
  const r = await resolveGymScope({ write: true })
  return r.ok ? lessonsPatch(r.scope, request) : r.res
}
export async function DELETE(request: Request) {
  const r = await resolveGymScope({ write: true })
  return r.ok ? lessonsDelete(r.scope, request) : r.res
}
