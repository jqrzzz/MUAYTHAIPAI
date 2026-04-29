export type CampaignChannel = "email" | "line" | "whatsapp" | "test"

export type CampaignStatus =
  | "draft"
  | "drafting"
  | "review"
  | "sending"
  | "sent"
  | "archived"

export type SendStatus =
  | "draft"
  | "approved"
  | "rejected"
  | "skipped"
  | "sending"
  | "sent"
  | "failed"
  | "opened"
  | "clicked"
  | "claimed"

/**
 * Filter applied against discovered_gyms when generating campaign
 * targets. All fields optional; combined with AND.
 */
export interface TargetFilter {
  status?: string[]                  // discovery status
  source?: string[]                  // discovery source
  province?: string                  // ilike match
  city?: string                      // ilike match
  has_website?: boolean
  has_extraction?: boolean           // last_extracted_at IS NOT NULL
  has_email?: boolean
  has_phone?: boolean
  ai_tags_any?: string[]             // overlap with ai_tags
  min_rating?: number                // google_rating >=
  exclude_already_in_campaign?: boolean // skip gyms already in *this* campaign
  exclude_onboarded?: boolean        // skip status='onboarded'
  limit?: number
}

export interface Campaign {
  id: string
  name: string
  description: string | null
  channel: CampaignChannel
  target_filter: TargetFilter
  subject_template: string | null
  body_template: string
  personalize_prompt: string | null
  personalize: boolean
  status: CampaignStatus
  from_name: string | null
  from_email: string | null
  total_targets: number
  total_drafted: number
  total_sent: number
  total_claimed: number
  created_by: string | null
  created_at: string
  updated_at: string
  sent_at: string | null
}

export interface CampaignSend {
  id: string
  campaign_id: string
  gym_id: string
  channel: CampaignChannel
  to_address: string | null
  subject: string | null
  body: string | null
  status: SendStatus
  drafted_at: string | null
  approved_at: string | null
  sent_at: string | null
  opened_at: string | null
  clicked_at: string | null
  claimed_at: string | null
  provider_id: string | null
  error: string | null
  created_at: string
  updated_at: string
}
