// Database types for Supabase
// These match the schema defined in the SQL migrations

export type UserRole = "owner" | "admin" | "trainer" | "student" | "promoter"
export type OrgStatus = "active" | "suspended" | "pending"
export type MemberStatus = "active" | "suspended" | "pending"
export type ServiceCategory = "training" | "certificate" | "membership" | "accommodation"
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show"
export type PaymentStatus = "pending" | "paid" | "refunded" | "failed"
export type PaymentMethod = "stripe" | "cash" | "transfer"
export type CertificateStatus = "active" | "revoked"
export type FightEventStatus = "draft" | "published" | "cancelled" | "completed"
export type BoutStatus = "scheduled" | "confirmed" | "cancelled" | "completed"
export type BoutResult =
  | "red_win_ko" | "red_win_tko" | "red_win_decision"
  | "blue_win_ko" | "blue_win_tko" | "blue_win_decision"
  | "draw" | "no_contest"
export type TicketOrderStatus = "confirmed" | "cancelled" | "refunded"

export interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_image_url: string | null
  country: string
  province: string | null
  city: string | null
  address: string | null
  google_maps_url: string | null
  latitude: number | null
  longitude: number | null
  timezone: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  instagram: string | null
  facebook: string | null
  website: string | null
  stripe_account_id: string | null
  stripe_onboarded: boolean
  status: OrgStatus
  verified: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  full_name: string | null
  display_name: string | null
  avatar_url: string | null
  phone: string | null
  nationality: string | null
  date_of_birth: string | null
  bio: string | null
  preferred_language: string
  notification_email: boolean
  notification_sms: boolean
  notification_whatsapp: boolean
  is_platform_admin: boolean
  created_at: string
  updated_at: string
}

export interface OrgMember {
  id: string
  org_id: string
  user_id: string
  role: UserRole
  status: MemberStatus
  can_manage_bookings: boolean
  can_manage_services: boolean
  can_manage_members: boolean
  can_view_payments: boolean
  joined_at: string
}

export interface Service {
  id: string
  org_id: string
  name: string
  description: string | null
  category: ServiceCategory
  price_thb: number
  price_usd: number | null
  currency: string
  duration_minutes: number | null
  duration_days: number | null
  requires_time_slot: boolean
  max_capacity: number | null
  display_order: number
  is_active: boolean
  is_featured: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface TimeSlot {
  id: string
  org_id: string
  service_id: string | null
  day_of_week: number | null
  start_time: string
  end_time: string | null
  max_bookings: number
  is_active: boolean
  created_at: string
}

export interface TrainerProfile {
  id: string
  org_id: string
  user_id: string
  display_name: string
  title: string | null
  bio: string | null
  specialties: string[] | null
  photo_url: string | null
  video_url: string | null
  fight_record_wins: number
  fight_record_losses: number
  fight_record_draws: number
  years_experience: number | null
  is_available: boolean
  availability_note: string | null
  display_order: number
  is_featured: boolean
  ock_ock_id: string | null
  open_to_fights: boolean
  open_to_events: boolean
  weight_kg: number | null
  height_cm: number | null
  reach_cm: number | null
  weight_class: string | null
  fighter_country: string | null
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  org_id: string
  service_id: string
  user_id: string | null
  guest_name: string | null
  guest_email: string | null
  guest_phone: string | null
  trainer_id: string | null
  booking_date: string
  booking_time: string | null
  status: BookingStatus
  payment_status: PaymentStatus
  payment_method: PaymentMethod | null
  payment_amount_thb: number | null
  stripe_payment_intent_id: string | null
  customer_notes: string | null
  staff_notes: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  org_id: string
  booking_id: string | null
  user_id: string | null
  amount_thb: number
  amount_usd: number | null
  currency: string
  stripe_payment_intent_id: string | null
  stripe_charge_id: string | null
  stripe_receipt_url: string | null
  status: string
  payment_method: string | null
  description: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface Certificate {
  id: string
  org_id: string
  user_id: string
  level: string
  level_number: number | null
  issued_by: string | null
  issued_at: string
  certificate_number: string | null
  verification_url: string | null
  certificate_pdf_url: string | null
  status: CertificateStatus
  created_at: string
}

export interface OrgSettings {
  id: string
  org_id: string
  booking_advance_days: number
  booking_max_days_ahead: number
  allow_guest_bookings: boolean
  require_payment_upfront: boolean
  notify_on_booking_email: boolean
  notify_on_booking_sms: boolean
  notify_on_booking_whatsapp: boolean
  notification_email: string | null
  notification_phone: string | null
  show_prices: boolean
  show_trainer_selection: boolean
  operating_hours: Record<string, { open: string; close: string }>
  custom_settings: Record<string, unknown>
  updated_at: string
}

export interface ActivityLog {
  id: string
  org_id: string | null
  user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, unknown>
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

// ============================================
// Fight Events & Ticket System
// ============================================

export interface FightEvent {
  id: string
  org_id: string
  name: string
  description: string | null
  event_date: string
  event_time: string | null
  cover_image_url: string | null
  venue_name: string | null
  venue_address: string | null
  venue_city: string | null
  venue_province: string | null
  venue_country: string
  venue_latitude: number | null
  venue_longitude: number | null
  max_capacity: number | null
  status: FightEventStatus
  ticket_sales_open: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface EventBout {
  id: string
  event_id: string
  fighter_red_id: string | null
  fighter_blue_id: string | null
  bout_order: number
  weight_class: string | null
  scheduled_rounds: number
  is_main_event: boolean
  status: BoutStatus
  result: BoutResult | null
  winner_id: string | null
  result_round: number | null
  result_notes: string | null
  created_at: string
}

export interface EventTicket {
  id: string
  event_id: string
  tier_name: string
  description: string | null
  price_thb: number
  price_usd: number | null
  quantity_total: number
  quantity_sold: number
  is_active: boolean
  sale_starts_at: string | null
  sale_ends_at: string | null
  created_at: string
}

export interface TicketOrder {
  id: string
  event_id: string
  ticket_id: string
  user_id: string | null
  guest_name: string | null
  guest_email: string | null
  guest_phone: string | null
  quantity: number
  total_price_thb: number
  total_price_usd: number | null
  payment_status: PaymentStatus
  payment_method: PaymentMethod | null
  stripe_payment_intent_id: string | null
  status: TicketOrderStatus
  order_reference: string | null
  created_at: string
}

// Wisarut Family Gym ID (hardcoded for now, will be dynamic later)
export const WISARUT_GYM_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
