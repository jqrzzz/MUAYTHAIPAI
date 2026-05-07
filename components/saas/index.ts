/**
 * SaaS design-system barrel.
 *
 * Anything used to build operator surfaces (admin, trainer, student,
 * platform-admin) should import from this single entrypoint. Keeps the
 * component contract stable even if internal file layout shifts later.
 *
 *   import { SaasShell, Surface, SectionHeader, StatCard,
 *            EmptyState, SegmentedControl, SaasButton, SaasInput,
 *            SaasTextarea, SaasHeader, StatusDot } from "@/components/saas"
 */
export { SaasShell, SaasHeader, StatusDot } from "./saas-shell"
export { Surface } from "./surface"
export { SectionHeader } from "./section-header"
export { StatCard } from "./stat-card"
export { EmptyState } from "./empty-state"
export { SegmentedControl } from "./segmented-control"
export { SaasButton } from "./saas-button"
export { SaasInput, SaasTextarea, saasFieldClass } from "./saas-input"
export { AuthCard } from "./auth-card"
