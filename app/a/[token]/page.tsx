/**
 * Action-token confirm page.
 *
 * Deeplink target for AI-proposed write actions. The AI (owner or
 * concierge) creates an action_tokens row, then sends the resulting
 * `/a/<id>` URL to the user in chat. The user opens the link in a
 * browser, logs in (if not already), sees the frozen preview, and
 * taps Confirm.
 *
 * Safety:
 *   - Nothing is executed on GET. Rendering is read-only.
 *   - POST /api/actions/[token] is the only path that runs the handler.
 *   - The confirm button POSTs to that endpoint; on success the page
 *     re-renders with ?consumed=1 and shows the result.
 */

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { loadActionToken } from "@/lib/chat/actions/tokens"
import { getActionHandler } from "@/lib/chat/actions/registry"
import ConfirmForm from "./confirm-form"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Confirm action | MUAYTHAIPAI",
  robots: "noindex, nofollow",
}

type PageProps = {
  params: { token: string }
  searchParams?: { consumed?: string; error?: string }
}

export default async function ActionConfirmPage({
  params,
  searchParams,
}: PageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Login page doesn't honor a return-to yet; the confirm link is
    // still live for the full TTL so the user can tap it from chat
    // again after signing in.
    redirect("/admin/login")
  }

  const token = await loadActionToken(supabase, params.token)

  // RLS lets a user view only their own action tokens, so a null here
  // can mean: doesn't exist, or exists but not for this user. Don't
  // leak the difference.
  if (!token) {
    return (
      <Page title="Action not available">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          This action link is invalid, expired, or not available for
          your account.
        </p>
      </Page>
    )
  }

  if (token.userId !== user.id) {
    return (
      <Page title="Not your action">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          This confirmation link was issued to a different account.
        </p>
      </Page>
    )
  }

  const handler = getActionHandler(token.actionType)
  const isExpired = new Date(token.expiresAt).getTime() < Date.now()
  const isConsumed = !!token.consumedAt

  // Post-submit states — read the query string we redirect back to.
  const postError = searchParams?.error
  const postOk = searchParams?.consumed === "1"

  if (postOk) {
    return (
      <Page title="Action confirmed">
        <div className="space-y-4">
          <div className="rounded-md border border-emerald-500/40 bg-emerald-50/60 p-4 dark:bg-emerald-950/30">
            <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
              Done. The action completed successfully.
            </p>
          </div>
          <PreviewBlock preview={token.preview} label={handler?.label} />
        </div>
      </Page>
    )
  }

  if (isConsumed) {
    return (
      <Page title="Already confirmed">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          This link has already been used. Actions are single-use.
        </p>
        <PreviewBlock preview={token.preview} label={handler?.label} />
      </Page>
    )
  }

  if (isExpired) {
    return (
      <Page title="Link expired">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          This confirmation link has expired. Ask the AI to propose the
          action again.
        </p>
        <PreviewBlock preview={token.preview} label={handler?.label} />
      </Page>
    )
  }

  if (!handler) {
    return (
      <Page title="Unknown action type">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          The action type{" "}
          <code className="rounded bg-neutral-200 px-1.5 py-0.5 text-xs dark:bg-neutral-800">
            {token.actionType}
          </code>{" "}
          isn&rsquo;t registered on this deployment. Contact support.
        </p>
      </Page>
    )
  }

  return (
    <Page title="Confirm action">
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-neutral-500">
            Action
          </p>
          <p className="text-sm font-medium">{handler.label}</p>
        </div>
        <PreviewBlock preview={token.preview} />
        {postError && (
          <div className="rounded-md border border-red-500/40 bg-red-50/60 p-3 dark:bg-red-950/30">
            <p className="text-xs font-medium text-red-900 dark:text-red-200">
              {humanizeError(postError)}
            </p>
          </div>
        )}
        <ConfirmForm tokenId={token.id} />
        <p className="text-xs text-neutral-500">
          Expires {new Date(token.expiresAt).toLocaleString()}. Single-use.
        </p>
      </div>
    </Page>
  )
}

function Page({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <h1 className="mb-4 text-lg font-semibold">{title}</h1>
        {children}
      </div>
    </main>
  )
}

function PreviewBlock({
  preview,
  label,
}: {
  preview: string
  label?: string
}) {
  return (
    <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900">
      {label && (
        <p className="mb-1 text-xs uppercase tracking-wider text-neutral-500">
          {label}
        </p>
      )}
      <p className="whitespace-pre-wrap text-neutral-900 dark:text-neutral-100">
        {preview}
      </p>
    </div>
  )
}

function humanizeError(code: string): string {
  const map: Record<string, string> = {
    token_invalid: "This link is no longer valid.",
    token_expired: "The link has expired. Please retry from chat.",
    already_consumed: "This action has already been completed.",
    handler_missing: "This action type isn't supported on this deployment.",
    execute_failed: "The action failed to run. Please try again.",
  }
  return map[code] ?? `Something went wrong (${code}).`
}
