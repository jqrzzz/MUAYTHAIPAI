import OnboardingClient from "../client"
import { loadOnboardingGym } from "../gate"

// The step-by-step onboarding form, kept as the alternative to the
// conversational flow at /onboarding (linked from there as "prefer a form?").
export const metadata = {
  title: "Set up your gym | OckOck",
  robots: "noindex, nofollow",
}

export default async function OnboardingFormPage() {
  const { orgId, organization } = await loadOnboardingGym("/onboarding/form")
  return <OnboardingClient orgId={orgId} organization={organization} />
}
