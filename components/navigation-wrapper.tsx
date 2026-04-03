"use client"

import { usePathname } from "next/navigation"
import { SiteFooterMenu } from "@/components/site-footer-menu"

// Dashboard routes that have their own navigation
const DASHBOARD_PREFIXES = ["/admin", "/trainer", "/student", "/platform-admin", "/invite"]

export function NavigationWrapper() {
  const pathname = usePathname()

  const isDashboard = DASHBOARD_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (isDashboard) return null

  return <SiteFooterMenu />
}
