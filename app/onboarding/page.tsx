import OnboardingConversation from "./conversation"
import { loadOnboardingGym } from "./gate"

export const metadata = {
  title: "Set up your gym | OckOck",
  robots: "noindex, nofollow",
}

export default async function OnboardingPage() {
  const { orgId, organization } = await loadOnboardingGym("/onboarding")
  return <OnboardingConversation orgId={orgId} organization={organization} />
}
