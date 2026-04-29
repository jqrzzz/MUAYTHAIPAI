import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import { verifyActionToken } from "@/lib/platform-admin/action-tokens"
import {
  executeInviteGym,
  executeUpdateGymStatus,
} from "@/lib/platform-admin/actions"

export async function POST(request: Request) {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const token = body.action_token as string | undefined
  if (!token) {
    return NextResponse.json({ error: "action_token is required" }, { status: 400 })
  }

  const payload = verifyActionToken(token)
  if (!payload) {
    return NextResponse.json(
      { error: "Invalid or expired action token" },
      { status: 400 }
    )
  }

  switch (payload.name) {
    case "invite_gym": {
      const result = await executeInviteGym(
        supabase,
        payload.args as {
          gym_id: string
          email?: string
          send_email?: boolean
        }
      )
      return NextResponse.json(result)
    }
    case "update_gym_status": {
      const result = await executeUpdateGymStatus(
        supabase,
        payload.args as {
          gym_id: string
          status: string
          notes?: string
        }
      )
      return NextResponse.json(result)
    }
    default: {
      return NextResponse.json(
        { error: `Unknown action: ${payload.name}` },
        { status: 400 }
      )
    }
  }
}
