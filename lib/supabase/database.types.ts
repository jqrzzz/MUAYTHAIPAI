/**
 * Generated Supabase types for the LIVE database (project: Nomadex MCP).
 *
 * Generated 2026-06-14 via the Supabase MCP `generate_typescript_types`,
 * after applying migrations 20260610000000-20260610000005. Regenerate with
 * the same tool (or `npx supabase gen types typescript --linked`) after any
 * future schema migration.
 *
 * DO NOT EDIT BY HAND — regenerate instead.
 *
 * NOTE: this database is SHARED across several apps — tables outside the
 * MUAYTHAIPAI/OckOck surface (scoot/hostel/northcrest/factory/...) appear
 * here too. That is intentional: the types document reality, and the service
 * client can technically reach all of them.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          org_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          org_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          org_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_suggestions: {
        Row: {
          created_at: string
          id: string
          platform: string | null
          property_id: string
          reason: string | null
          resolved_at: string | null
          source_data: Json | null
          status: string
          suggested_change: string | null
          suggestion_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string | null
          property_id: string
          reason?: string | null
          resolved_at?: string | null
          source_data?: Json | null
          status?: string
          suggested_change?: string | null
          suggestion_type: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string | null
          property_id?: string
          reason?: string | null
          resolved_at?: string | null
          source_data?: Json | null
          status?: string
          suggested_change?: string | null
          suggestion_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_posts: {
        Row: {
          created_at: string | null
          destination: string
          expires_at: string
          from_location: string | null
          geog: unknown
          girls_only: boolean
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          message: string | null
          post_type: string | null
          rider_id: string
        }
        Insert: {
          created_at?: string | null
          destination: string
          expires_at: string
          from_location?: string | null
          geog?: unknown
          girls_only?: boolean
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          message?: string | null
          post_type?: string | null
          rider_id: string
        }
        Update: {
          created_at?: string | null
          destination?: string
          expires_at?: string
          from_location?: string | null
          geog?: unknown
          girls_only?: boolean
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          message?: string | null
          post_type?: string | null
          rider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_posts_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blacklist: {
        Row: {
          added_by_org_id: string | null
          added_by_user_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          nationality: string | null
          photo_url: string | null
        }
        Insert: {
          added_by_org_id?: string | null
          added_by_user_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          nationality?: string | null
          photo_url?: string | null
        }
        Update: {
          added_by_org_id?: string | null
          added_by_user_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          nationality?: string | null
          photo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blacklist_added_by_org_id_fkey"
            columns: ["added_by_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blacklist_added_by_user_id_fkey"
            columns: ["added_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      blacklist_comments: {
        Row: {
          blacklist_id: string
          comment: string
          created_at: string | null
          id: string
          org_id: string
          user_id: string | null
        }
        Insert: {
          blacklist_id: string
          comment: string
          created_at?: string | null
          id?: string
          org_id: string
          user_id?: string | null
        }
        Update: {
          blacklist_id?: string
          comment?: string
          created_at?: string | null
          id?: string
          org_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blacklist_comments_blacklist_id_fkey"
            columns: ["blacklist_id"]
            isOneToOne: false
            referencedRelation: "blacklist"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blacklist_comments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blacklist_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      blacklist_reports: {
        Row: {
          categories: string[]
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          property_id: string
          tourist_id: string
        }
        Insert: {
          categories?: string[]
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          property_id: string
          tourist_id: string
        }
        Update: {
          categories?: string[]
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          property_id?: string
          tourist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blacklist_reports_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blacklist_reports_tourist_id_fkey"
            columns: ["tourist_id"]
            isOneToOne: false
            referencedRelation: "tourist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blacklist_scores: {
        Row: {
          category_counts: Json
          last_report_at: string | null
          score: string
          total_reports: number
          tourist_id: string
          updated_at: string
        }
        Insert: {
          category_counts?: Json
          last_report_at?: string | null
          score?: string
          total_reports?: number
          tourist_id: string
          updated_at?: string
        }
        Update: {
          category_counts?: Json
          last_report_at?: string | null
          score?: string
          total_reports?: number
          tourist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blacklist_scores_tourist_id_fkey"
            columns: ["tourist_id"]
            isOneToOne: true
            referencedRelation: "tourist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      boardroom_comments: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boardroom_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      boardroom_files: {
        Row: {
          created_at: string
          id: string
          mime_type: string | null
          name: string
          size_bytes: number | null
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          mime_type?: string | null
          name: string
          size_bytes?: number | null
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mime_type?: string | null
          name?: string
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boardroom_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      boardroom_notes: {
        Row: {
          body: string
          id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body?: string
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boardroom_notes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          booking_time: string | null
          commission_amount_usd: number | null
          commission_rate: number | null
          created_at: string | null
          customer_notes: string | null
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          metadata: Json | null
          org_id: string
          payment_amount_thb: number | null
          payment_amount_usd: number | null
          payment_collected_at: string | null
          payment_collected_by: string | null
          payment_currency: string | null
          payment_method: string | null
          payment_status: string | null
          refunded_amount_cents: number | null
          refunded_at: string | null
          service_id: string | null
          staff_notes: string | null
          status: string | null
          stripe_application_fee_amount: number | null
          stripe_balance_transaction_id: string | null
          stripe_charge_id: string | null
          stripe_destination_account_id: string | null
          stripe_fee_cents: number | null
          stripe_net_cents: number | null
          stripe_payment_intent_id: string | null
          trainer_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          booking_date: string
          booking_time?: string | null
          commission_amount_usd?: number | null
          commission_rate?: number | null
          created_at?: string | null
          customer_notes?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          metadata?: Json | null
          org_id: string
          payment_amount_thb?: number | null
          payment_amount_usd?: number | null
          payment_collected_at?: string | null
          payment_collected_by?: string | null
          payment_currency?: string | null
          payment_method?: string | null
          payment_status?: string | null
          refunded_amount_cents?: number | null
          refunded_at?: string | null
          service_id?: string | null
          staff_notes?: string | null
          status?: string | null
          stripe_application_fee_amount?: number | null
          stripe_balance_transaction_id?: string | null
          stripe_charge_id?: string | null
          stripe_destination_account_id?: string | null
          stripe_fee_cents?: number | null
          stripe_net_cents?: number | null
          stripe_payment_intent_id?: string | null
          trainer_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          booking_date?: string
          booking_time?: string | null
          commission_amount_usd?: number | null
          commission_rate?: number | null
          created_at?: string | null
          customer_notes?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string
          payment_amount_thb?: number | null
          payment_amount_usd?: number | null
          payment_collected_at?: string | null
          payment_collected_by?: string | null
          payment_currency?: string | null
          payment_method?: string | null
          payment_status?: string | null
          refunded_amount_cents?: number | null
          refunded_at?: string | null
          service_id?: string | null
          staff_notes?: string | null
          status?: string | null
          stripe_application_fee_amount?: number | null
          stripe_balance_transaction_id?: string | null
          stripe_charge_id?: string | null
          stripe_destination_account_id?: string | null
          stripe_fee_cents?: number | null
          stripe_net_cents?: number | null
          stripe_payment_intent_id?: string | null
          trainer_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_payment_collected_by_fkey"
            columns: ["payment_collected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bout_invitations: {
        Row: {
          bout_id: string
          corner: string
          created_at: string
          decline_reason: string | null
          fighter_id: string | null
          id: string
          invited_by_org_id: string
          invited_by_user_id: string
          message: string | null
          responded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          bout_id: string
          corner: string
          created_at?: string
          decline_reason?: string | null
          fighter_id?: string | null
          id?: string
          invited_by_org_id: string
          invited_by_user_id: string
          message?: string | null
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          bout_id?: string
          corner?: string
          created_at?: string
          decline_reason?: string | null
          fighter_id?: string | null
          id?: string
          invited_by_org_id?: string
          invited_by_user_id?: string
          message?: string | null
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bout_invitations_bout_id_fkey"
            columns: ["bout_id"]
            isOneToOne: false
            referencedRelation: "event_bouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bout_invitations_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "trainer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bout_invitations_invited_by_org_id_fkey"
            columns: ["invited_by_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bout_invitations_invited_by_user_id_fkey"
            columns: ["invited_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_sends: {
        Row: {
          approved_at: string | null
          body: string | null
          campaign_id: string
          channel: string
          claimed_at: string | null
          clicked_at: string | null
          created_at: string | null
          drafted_at: string | null
          error: string | null
          gym_id: string
          id: string
          opened_at: string | null
          provider_id: string | null
          sent_at: string | null
          status: string
          subject: string | null
          to_address: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          body?: string | null
          campaign_id: string
          channel: string
          claimed_at?: string | null
          clicked_at?: string | null
          created_at?: string | null
          drafted_at?: string | null
          error?: string | null
          gym_id: string
          id?: string
          opened_at?: string | null
          provider_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          to_address?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          body?: string | null
          campaign_id?: string
          channel?: string
          claimed_at?: string | null
          clicked_at?: string | null
          created_at?: string | null
          drafted_at?: string | null
          error?: string | null
          gym_id?: string
          id?: string
          opened_at?: string | null
          provider_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          to_address?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_sends_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "discovered_gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          body_template: string
          channel: string
          created_at: string | null
          created_by: string | null
          description: string | null
          from_email: string | null
          from_name: string | null
          id: string
          name: string
          personalize: boolean | null
          personalize_prompt: string | null
          sent_at: string | null
          status: string
          subject_template: string | null
          target_filter: Json
          total_claimed: number | null
          total_drafted: number | null
          total_sent: number | null
          total_targets: number | null
          updated_at: string | null
        }
        Insert: {
          body_template: string
          channel?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          name: string
          personalize?: boolean | null
          personalize_prompt?: string | null
          sent_at?: string | null
          status?: string
          subject_template?: string | null
          target_filter?: Json
          total_claimed?: number | null
          total_drafted?: number | null
          total_sent?: number | null
          total_targets?: number | null
          updated_at?: string | null
        }
        Update: {
          body_template?: string
          channel?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          name?: string
          personalize?: boolean | null
          personalize_prompt?: string | null
          sent_at?: string | null
          status?: string
          subject_template?: string | null
          target_filter?: Json
          total_claimed?: number | null
          total_drafted?: number | null
          total_sent?: number | null
          total_targets?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cert_level_skills: {
        Row: {
          level_id: string
          position: number
          skill: string
          updated_at: string
        }
        Insert: {
          level_id: string
          position: number
          skill: string
          updated_at?: string
        }
        Update: {
          level_id?: string
          position?: number
          skill?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_number: string | null
          certificate_pdf_url: string | null
          created_at: string | null
          id: string
          issued_at: string | null
          issued_by: string | null
          level: string
          level_number: number | null
          org_id: string
          status: string | null
          user_id: string
          verification_url: string | null
        }
        Insert: {
          certificate_number?: string | null
          certificate_pdf_url?: string | null
          created_at?: string | null
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          level: string
          level_number?: number | null
          org_id: string
          status?: string | null
          user_id: string
          verification_url?: string | null
        }
        Update: {
          certificate_number?: string | null
          certificate_pdf_url?: string | null
          created_at?: string | null
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          level?: string
          level_number?: number | null
          org_id?: string
          status?: string | null
          user_id?: string
          verification_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "trainer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      certification_enrollments: {
        Row: {
          booking_id: string | null
          certificate_id: string | null
          completed_at: string | null
          created_at: string
          enrolled_at: string
          id: string
          level: string
          notes: string | null
          org_id: string
          payment_amount_thb: number | null
          payment_status: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          certificate_id?: string | null
          completed_at?: string | null
          created_at?: string
          enrolled_at?: string
          id?: string
          level: string
          notes?: string | null
          org_id: string
          payment_amount_thb?: number | null
          payment_status?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          certificate_id?: string | null
          completed_at?: string | null
          created_at?: string
          enrolled_at?: string
          id?: string
          level?: string
          notes?: string | null
          org_id?: string
          payment_amount_thb?: number | null
          payment_status?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certification_enrollments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_enrollments_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_enrollments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_group_members: {
        Row: {
          chat_group_id: string
          display_name: string | null
          external_user_id: string
          first_seen_at: string
          id: string
          last_seen_at: string
          permissions: Json
          role: Database["public"]["Enums"]["sc_chat_member_role"]
          team_member_id: string | null
        }
        Insert: {
          chat_group_id: string
          display_name?: string | null
          external_user_id: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["sc_chat_member_role"]
          team_member_id?: string | null
        }
        Update: {
          chat_group_id?: string
          display_name?: string | null
          external_user_id?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["sc_chat_member_role"]
          team_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_group_members_chat_group_id_fkey"
            columns: ["chat_group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_group_members_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_groups: {
        Row: {
          bot_muted: boolean
          chat_title: string | null
          created_at: string
          external_chat_id: string
          id: string
          language_preference: string
          last_message_at: string | null
          metadata: Json
          permissions: Json
          platform: Database["public"]["Enums"]["sc_chat_platform"]
          property_id: string | null
          status: Database["public"]["Enums"]["sc_chat_group_status"]
          updated_at: string
        }
        Insert: {
          bot_muted?: boolean
          chat_title?: string | null
          created_at?: string
          external_chat_id: string
          id?: string
          language_preference?: string
          last_message_at?: string | null
          metadata?: Json
          permissions?: Json
          platform: Database["public"]["Enums"]["sc_chat_platform"]
          property_id?: string | null
          status?: Database["public"]["Enums"]["sc_chat_group_status"]
          updated_at?: string
        }
        Update: {
          bot_muted?: boolean
          chat_title?: string | null
          created_at?: string
          external_chat_id?: string
          id?: string
          language_preference?: string
          last_message_at?: string | null
          metadata?: Json
          permissions?: Json
          platform?: Database["public"]["Enums"]["sc_chat_platform"]
          property_id?: string | null
          status?: Database["public"]["Enums"]["sc_chat_group_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_groups_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          body: string | null
          body_translated: string | null
          chat_group_id: string
          created_at: string
          id: string
          metadata: Json
          platform_message_id: string | null
          reply_to_message_id: string | null
          sender_display_name: string | null
          sender_external_id: string | null
          sender_member_id: string | null
          sender_type: Database["public"]["Enums"]["sc_chat_sender_type"]
          sent_at: string
          source_language: string | null
        }
        Insert: {
          body?: string | null
          body_translated?: string | null
          chat_group_id: string
          created_at?: string
          id?: string
          metadata?: Json
          platform_message_id?: string | null
          reply_to_message_id?: string | null
          sender_display_name?: string | null
          sender_external_id?: string | null
          sender_member_id?: string | null
          sender_type: Database["public"]["Enums"]["sc_chat_sender_type"]
          sent_at?: string
          source_language?: string | null
        }
        Update: {
          body?: string | null
          body_translated?: string | null
          chat_group_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          platform_message_id?: string | null
          reply_to_message_id?: string | null
          sender_display_name?: string | null
          sender_external_id?: string | null
          sender_member_id?: string | null
          sender_type?: Database["public"]["Enums"]["sc_chat_sender_type"]
          sent_at?: string
          source_language?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_group_id_fkey"
            columns: ["chat_group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_member_id_fkey"
            columns: ["sender_member_id"]
            isOneToOne: false
            referencedRelation: "chat_group_members"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_ota_drafts: {
        Row: {
          applied_at: string | null
          chat_group_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          enqueued_task_ids: string[]
          error: string | null
          expires_at: string
          id: string
          kind: Database["public"]["Enums"]["sc_chat_ota_draft_kind"]
          params: Json
          property_id: string
          shadow_message_id: string
          status: Database["public"]["Enums"]["sc_chat_ota_draft_status"]
        }
        Insert: {
          applied_at?: string | null
          chat_group_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          enqueued_task_ids?: string[]
          error?: string | null
          expires_at?: string
          id?: string
          kind: Database["public"]["Enums"]["sc_chat_ota_draft_kind"]
          params: Json
          property_id: string
          shadow_message_id: string
          status?: Database["public"]["Enums"]["sc_chat_ota_draft_status"]
        }
        Update: {
          applied_at?: string | null
          chat_group_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          enqueued_task_ids?: string[]
          error?: string | null
          expires_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["sc_chat_ota_draft_kind"]
          params?: Json
          property_id?: string
          shadow_message_id?: string
          status?: Database["public"]["Enums"]["sc_chat_ota_draft_status"]
        }
        Relationships: [
          {
            foreignKeyName: "chat_ota_drafts_chat_group_id_fkey"
            columns: ["chat_group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_ota_drafts_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "chat_group_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_ota_drafts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_ota_drafts_shadow_message_id_fkey"
            columns: ["shadow_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_passport_drafts: {
        Row: {
          applied_at: string | null
          chat_group_id: string
          created_at: string
          created_guest_id: string | null
          created_tourist_profile_id: string | null
          decided_at: string | null
          decided_by: string | null
          error: string | null
          expires_at: string
          extracted: Json
          id: string
          photo_url: string
          property_id: string
          shadow_message_id: string
          status: Database["public"]["Enums"]["sc_chat_passport_draft_status"]
        }
        Insert: {
          applied_at?: string | null
          chat_group_id: string
          created_at?: string
          created_guest_id?: string | null
          created_tourist_profile_id?: string | null
          decided_at?: string | null
          decided_by?: string | null
          error?: string | null
          expires_at?: string
          extracted: Json
          id?: string
          photo_url: string
          property_id: string
          shadow_message_id: string
          status?: Database["public"]["Enums"]["sc_chat_passport_draft_status"]
        }
        Update: {
          applied_at?: string | null
          chat_group_id?: string
          created_at?: string
          created_guest_id?: string | null
          created_tourist_profile_id?: string | null
          decided_at?: string | null
          decided_by?: string | null
          error?: string | null
          expires_at?: string
          extracted?: Json
          id?: string
          photo_url?: string
          property_id?: string
          shadow_message_id?: string
          status?: Database["public"]["Enums"]["sc_chat_passport_draft_status"]
        }
        Relationships: [
          {
            foreignKeyName: "chat_passport_drafts_chat_group_id_fkey"
            columns: ["chat_group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_passport_drafts_created_guest_id_fkey"
            columns: ["created_guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_passport_drafts_created_tourist_profile_id_fkey"
            columns: ["created_tourist_profile_id"]
            isOneToOne: false
            referencedRelation: "tourist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_passport_drafts_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "chat_group_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_passport_drafts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_passport_drafts_shadow_message_id_fkey"
            columns: ["shadow_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          arrival_date: string
          bed_id: string | null
          checked_in_at: string
          checked_in_by: string | null
          created_at: string
          departure_date: string | null
          id: string
          previous_stay_address: string | null
          print_status: Database["public"]["Enums"]["sc_print_status"]
          property_id: string
          room_number: string | null
          room_type_id: string | null
          source: string | null
          status: Database["public"]["Enums"]["sc_guest_status"]
          tourist_id: string | null
          updated_at: string
        }
        Insert: {
          arrival_date?: string
          bed_id?: string | null
          checked_in_at?: string
          checked_in_by?: string | null
          created_at?: string
          departure_date?: string | null
          id?: string
          previous_stay_address?: string | null
          print_status?: Database["public"]["Enums"]["sc_print_status"]
          property_id: string
          room_number?: string | null
          room_type_id?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["sc_guest_status"]
          tourist_id?: string | null
          updated_at?: string
        }
        Update: {
          arrival_date?: string
          bed_id?: string | null
          checked_in_at?: string
          checked_in_by?: string | null
          created_at?: string
          departure_date?: string | null
          id?: string
          previous_stay_address?: string | null
          print_status?: Database["public"]["Enums"]["sc_print_status"]
          property_id?: string
          room_number?: string | null
          room_type_id?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["sc_guest_status"]
          tourist_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_bed_id_fk"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "room_beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_room_type_id_fk"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_tourist_id_fkey"
            columns: ["tourist_id"]
            isOneToOne: false
            referencedRelation: "tourist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string | null
          last_read_at: string | null
          user_id: string
          user_type: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id: string
          user_type: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          type?: string
        }
        Relationships: []
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          id: string
          module_order: number
          summary: string | null
          summary_generated_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          module_order?: number
          summary?: string | null
          summary_generated_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          module_order?: number
          summary?: string | null
          summary_generated_at?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          certificate_level: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          display_order: number | null
          estimated_hours: number | null
          id: string
          is_featured: boolean | null
          is_free: boolean | null
          org_id: string | null
          price_thb: number | null
          published_at: string | null
          short_description: string | null
          slug: string
          status: string | null
          title: string
          total_lessons: number | null
          total_modules: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          certificate_level?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          display_order?: number | null
          estimated_hours?: number | null
          id?: string
          is_featured?: boolean | null
          is_free?: boolean | null
          org_id?: string | null
          price_thb?: number | null
          published_at?: string | null
          short_description?: string | null
          slug: string
          status?: string | null
          title: string
          total_lessons?: number | null
          total_modules?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          certificate_level?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          display_order?: number | null
          estimated_hours?: number | null
          id?: string
          is_featured?: boolean | null
          is_free?: boolean | null
          org_id?: string | null
          price_thb?: number | null
          published_at?: string | null
          short_description?: string | null
          slug?: string
          status?: string | null
          title?: string
          total_lessons?: number | null
          total_modules?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          description: string | null
          id: string
          org_id: string
          payment_amount_thb: number | null
          payment_method: string | null
          recorded_by: string | null
          student_credit_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          org_id: string
          payment_amount_thb?: number | null
          payment_method?: string | null
          recorded_by?: string | null
          student_credit_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          org_id?: string
          payment_amount_thb?: number | null
          payment_method?: string | null
          recorded_by?: string | null
          student_credit_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_student_credit_id_fkey"
            columns: ["student_credit_id"]
            isOneToOne: false
            referencedRelation: "student_credits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_execution_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          job_name: string
          properties_processed: number | null
          result: Json | null
          started_at: string
          status: Database["public"]["Enums"]["sc_cron_status"]
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          job_name: string
          properties_processed?: number | null
          result?: Json | null
          started_at?: string
          status?: Database["public"]["Enums"]["sc_cron_status"]
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          job_name?: string
          properties_processed?: number | null
          result?: Json | null
          started_at?: string
          status?: Database["public"]["Enums"]["sc_cron_status"]
        }
        Relationships: []
      }
      discovered_gyms: {
        Row: {
          address: string | null
          ai_summary: string | null
          ai_tags: string[] | null
          auto_draft_body: string | null
          auto_draft_subject: string | null
          auto_drafted_at: string | null
          city: string | null
          claimed_at: string | null
          country: string | null
          crawl_count: number | null
          created_at: string | null
          duplicate_of: string | null
          email: string | null
          facebook: string | null
          google_photos: Json | null
          google_place_id: string | null
          google_rating: number | null
          google_review_count: number | null
          google_types: string[] | null
          id: string
          instagram: string | null
          invite_email: string | null
          invite_token: string | null
          invited_at: string | null
          last_crawled_at: string | null
          last_extracted_at: string | null
          last_nudged_at: string | null
          lat: number | null
          line_id: string | null
          linked_org_id: string | null
          lng: number | null
          name: string
          name_th: string | null
          notes: string | null
          phone: string | null
          province: string | null
          raw_extraction: Json | null
          raw_scrape_md: string | null
          slug: string | null
          source: string
          source_query: string | null
          status: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          ai_summary?: string | null
          ai_tags?: string[] | null
          auto_draft_body?: string | null
          auto_draft_subject?: string | null
          auto_drafted_at?: string | null
          city?: string | null
          claimed_at?: string | null
          country?: string | null
          crawl_count?: number | null
          created_at?: string | null
          duplicate_of?: string | null
          email?: string | null
          facebook?: string | null
          google_photos?: Json | null
          google_place_id?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          google_types?: string[] | null
          id?: string
          instagram?: string | null
          invite_email?: string | null
          invite_token?: string | null
          invited_at?: string | null
          last_crawled_at?: string | null
          last_extracted_at?: string | null
          last_nudged_at?: string | null
          lat?: number | null
          line_id?: string | null
          linked_org_id?: string | null
          lng?: number | null
          name: string
          name_th?: string | null
          notes?: string | null
          phone?: string | null
          province?: string | null
          raw_extraction?: Json | null
          raw_scrape_md?: string | null
          slug?: string | null
          source?: string
          source_query?: string | null
          status?: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          ai_summary?: string | null
          ai_tags?: string[] | null
          auto_draft_body?: string | null
          auto_draft_subject?: string | null
          auto_drafted_at?: string | null
          city?: string | null
          claimed_at?: string | null
          country?: string | null
          crawl_count?: number | null
          created_at?: string | null
          duplicate_of?: string | null
          email?: string | null
          facebook?: string | null
          google_photos?: Json | null
          google_place_id?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          google_types?: string[] | null
          id?: string
          instagram?: string | null
          invite_email?: string | null
          invite_token?: string | null
          invited_at?: string | null
          last_crawled_at?: string | null
          last_extracted_at?: string | null
          last_nudged_at?: string | null
          lat?: number | null
          line_id?: string | null
          linked_org_id?: string | null
          lng?: number | null
          name?: string
          name_th?: string | null
          notes?: string | null
          phone?: string | null
          province?: string | null
          raw_extraction?: Json | null
          raw_scrape_md?: string | null
          slug?: string | null
          source?: string
          source_query?: string | null
          status?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discovered_gyms_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "discovered_gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovered_gyms_linked_org_id_fkey"
            columns: ["linked_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_integrations: {
        Row: {
          access_token: string | null
          created_at: string
          error_message: string | null
          id: string
          last_sync_at: string | null
          property_id: string
          provider: Database["public"]["Enums"]["sc_email_provider"]
          refresh_token: string | null
          status: Database["public"]["Enums"]["sc_email_status"]
          sync_cursor: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          property_id: string
          provider: Database["public"]["Enums"]["sc_email_provider"]
          refresh_token?: string | null
          status?: Database["public"]["Enums"]["sc_email_status"]
          sync_cursor?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          property_id?: string
          provider?: Database["public"]["Enums"]["sc_email_provider"]
          refresh_token?: string | null
          status?: Database["public"]["Enums"]["sc_email_status"]
          sync_cursor?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_integrations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          error_message: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          recipient_email: string
          recipient_user_id: string | null
          resend_message_id: string | null
          sent_at: string
          sequence: string
          status: string
          trigger_ref: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          recipient_email: string
          recipient_user_id?: string | null
          resend_message_id?: string | null
          sent_at?: string
          sequence: string
          status?: string
          trigger_ref: string
        }
        Update: {
          error_message?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          recipient_email?: string
          recipient_user_id?: string | null
          resend_message_id?: string | null
          sent_at?: string
          sequence?: string
          status?: string
          trigger_ref?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_send_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_send_log_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          completed_at: string | null
          completed_lessons: number | null
          course_id: string
          enrolled_at: string | null
          id: string
          last_accessed_at: string | null
          payment_amount_thb: number | null
          payment_method: string | null
          progress_pct: number | null
          status: string | null
          total_lessons: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_lessons?: number | null
          course_id: string
          enrolled_at?: string | null
          id?: string
          last_accessed_at?: string | null
          payment_amount_thb?: number | null
          payment_method?: string | null
          progress_pct?: number | null
          status?: string | null
          total_lessons?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_lessons?: number | null
          course_id?: string
          enrolled_at?: string | null
          id?: string
          last_accessed_at?: string | null
          payment_amount_thb?: number | null
          payment_method?: string | null
          progress_pct?: number | null
          status?: string | null
          total_lessons?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      event_bouts: {
        Row: {
          bout_order: number | null
          created_at: string | null
          event_id: string
          fighter_blue_id: string | null
          fighter_red_id: string | null
          id: string
          is_main_event: boolean | null
          method: string | null
          result: string | null
          result_notes: string | null
          result_round: number | null
          scheduled_rounds: number | null
          status: string | null
          updated_at: string | null
          weight_class: string | null
          winner_id: string | null
        }
        Insert: {
          bout_order?: number | null
          created_at?: string | null
          event_id: string
          fighter_blue_id?: string | null
          fighter_red_id?: string | null
          id?: string
          is_main_event?: boolean | null
          method?: string | null
          result?: string | null
          result_notes?: string | null
          result_round?: number | null
          scheduled_rounds?: number | null
          status?: string | null
          updated_at?: string | null
          weight_class?: string | null
          winner_id?: string | null
        }
        Update: {
          bout_order?: number | null
          created_at?: string | null
          event_id?: string
          fighter_blue_id?: string | null
          fighter_red_id?: string | null
          id?: string
          is_main_event?: boolean | null
          method?: string | null
          result?: string | null
          result_notes?: string | null
          result_round?: number | null
          scheduled_rounds?: number | null
          status?: string | null
          updated_at?: string | null
          weight_class?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_bouts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "fight_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_bouts_fighter_blue_id_fkey"
            columns: ["fighter_blue_id"]
            isOneToOne: false
            referencedRelation: "trainer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_bouts_fighter_red_id_fkey"
            columns: ["fighter_red_id"]
            isOneToOne: false
            referencedRelation: "trainer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_bouts_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "trainer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tickets: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          is_active: boolean
          price_thb: number
          price_usd: number | null
          quantity_sold: number
          quantity_total: number
          sale_ends_at: string | null
          sale_starts_at: string | null
          tier_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          is_active?: boolean
          price_thb?: number
          price_usd?: number | null
          quantity_sold?: number
          quantity_total?: number
          sale_ends_at?: string | null
          sale_starts_at?: string | null
          tier_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          is_active?: boolean
          price_thb?: number
          price_usd?: number | null
          quantity_sold?: number
          quantity_total?: number
          sale_ends_at?: string | null
          sale_starts_at?: string | null
          tier_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "fight_events"
            referencedColumns: ["id"]
          },
        ]
      }
      factory_agent_profiles: {
        Row: {
          blurb: string
          created_at: string
          default_in_team: boolean
          default_position: number
          emoji: string
          id: string
          is_template: boolean
          model: string
          name: string
          owner_id: string | null
          role: string
          sees_visuals: boolean
          system_prompt: string
          tools: Json
          updated_at: string
        }
        Insert: {
          blurb?: string
          created_at?: string
          default_in_team?: boolean
          default_position?: number
          emoji?: string
          id?: string
          is_template?: boolean
          model?: string
          name: string
          owner_id?: string | null
          role: string
          sees_visuals?: boolean
          system_prompt?: string
          tools?: Json
          updated_at?: string
        }
        Update: {
          blurb?: string
          created_at?: string
          default_in_team?: boolean
          default_position?: number
          emoji?: string
          id?: string
          is_template?: boolean
          model?: string
          name?: string
          owner_id?: string | null
          role?: string
          sees_visuals?: boolean
          system_prompt?: string
          tools?: Json
          updated_at?: string
        }
        Relationships: []
      }
      factory_assets: {
        Row: {
          created_at: string
          filename: string | null
          height: number | null
          id: string
          kind: string
          metadata: Json
          mime_type: string | null
          note: string
          project_id: string
          storage_path: string
          url: string
          width: number | null
        }
        Insert: {
          created_at?: string
          filename?: string | null
          height?: number | null
          id?: string
          kind: string
          metadata?: Json
          mime_type?: string | null
          note?: string
          project_id: string
          storage_path: string
          url: string
          width?: number | null
        }
        Update: {
          created_at?: string
          filename?: string | null
          height?: number | null
          id?: string
          kind?: string
          metadata?: Json
          mime_type?: string | null
          note?: string
          project_id?: string
          storage_path?: string
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "factory_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "factory_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      factory_feedback: {
        Row: {
          created_at: string
          id: string
          note: string | null
          rater_id: string
          rating: number | null
          scene_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          rater_id: string
          rating?: number | null
          scene_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          rater_id?: string
          rating?: number | null
          scene_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "factory_feedback_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "factory_scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      factory_generations: {
        Row: {
          completed_at: string | null
          cost_usd: number | null
          created_at: string
          error: string | null
          id: string
          kind: string
          model: string
          output_url: string | null
          project_id: string
          provider: string
          request: Json | null
          response: Json | null
          scene_id: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          cost_usd?: number | null
          created_at?: string
          error?: string | null
          id?: string
          kind?: string
          model: string
          output_url?: string | null
          project_id: string
          provider: string
          request?: Json | null
          response?: Json | null
          scene_id?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          cost_usd?: number | null
          created_at?: string
          error?: string | null
          id?: string
          kind?: string
          model?: string
          output_url?: string | null
          project_id?: string
          provider?: string
          request?: Json | null
          response?: Json | null
          scene_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "factory_generations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "factory_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factory_generations_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "factory_scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      factory_messages: {
        Row: {
          content: Json
          created_at: string
          id: string
          role: string
          sub_agent_role: string | null
          thread_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          role: string
          sub_agent_role?: string | null
          thread_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          role?: string
          sub_agent_role?: string | null
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "factory_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "factory_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      factory_project_agents: {
        Row: {
          created_at: string
          id: string
          name_override: string | null
          position: number
          profile_id: string
          project_id: string
          system_prompt_override: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name_override?: string | null
          position?: number
          profile_id: string
          project_id: string
          system_prompt_override?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name_override?: string | null
          position?: number
          profile_id?: string
          project_id?: string
          system_prompt_override?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "factory_project_agents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "factory_agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factory_project_agents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "factory_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      factory_projects: {
        Row: {
          brand_context: string
          brand_kit: Json
          cover_url: string | null
          created_at: string
          default_image_provider: string | null
          default_video_provider: string | null
          default_voice_id: string | null
          id: string
          name: string
          notes: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          brand_context?: string
          brand_kit?: Json
          cover_url?: string | null
          created_at?: string
          default_image_provider?: string | null
          default_video_provider?: string | null
          default_voice_id?: string | null
          id?: string
          name: string
          notes?: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          brand_context?: string
          brand_kit?: Json
          cover_url?: string | null
          created_at?: string
          default_image_provider?: string | null
          default_video_provider?: string | null
          default_voice_id?: string | null
          id?: string
          name?: string
          notes?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      factory_renders: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_seconds: number | null
          error: string | null
          id: string
          output_url: string | null
          project_id: string
          scene_ids: string[]
          status: string
          title: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          error?: string | null
          id?: string
          output_url?: string | null
          project_id: string
          scene_ids: string[]
          status?: string
          title?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          error?: string | null
          id?: string
          output_url?: string | null
          project_id?: string
          scene_ids?: string[]
          status?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "factory_renders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "factory_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      factory_scenes: {
        Row: {
          aspect_ratio: string
          created_at: string
          dialogue: string
          duration_seconds: number
          error: string | null
          id: string
          motion_prompt: string
          order_idx: number
          preferred_provider: string | null
          project_id: string
          source_asset_id: string | null
          status: string
          template: string | null
          updated_at: string
          video_url: string | null
          voiceover_url: string | null
        }
        Insert: {
          aspect_ratio?: string
          created_at?: string
          dialogue?: string
          duration_seconds?: number
          error?: string | null
          id?: string
          motion_prompt?: string
          order_idx?: number
          preferred_provider?: string | null
          project_id: string
          source_asset_id?: string | null
          status?: string
          template?: string | null
          updated_at?: string
          video_url?: string | null
          voiceover_url?: string | null
        }
        Update: {
          aspect_ratio?: string
          created_at?: string
          dialogue?: string
          duration_seconds?: number
          error?: string | null
          id?: string
          motion_prompt?: string
          order_idx?: number
          preferred_provider?: string | null
          project_id?: string
          source_asset_id?: string | null
          status?: string
          template?: string | null
          updated_at?: string
          video_url?: string | null
          voiceover_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "factory_scenes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "factory_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factory_scenes_source_asset_id_fkey"
            columns: ["source_asset_id"]
            isOneToOne: false
            referencedRelation: "factory_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      factory_threads: {
        Row: {
          created_at: string
          id: string
          project_agent_id: string
          project_id: string
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          project_agent_id: string
          project_id: string
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          project_agent_id?: string
          project_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "factory_threads_project_agent_id_fkey"
            columns: ["project_agent_id"]
            isOneToOne: false
            referencedRelation: "factory_project_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factory_threads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "factory_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_events: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          event_date: string
          event_time: string | null
          event_type: string | null
          id: string
          max_capacity: number | null
          metadata: Json | null
          name: string
          org_id: string
          slug: string | null
          status: string | null
          ticket_price_thb: number | null
          ticket_price_usd: number | null
          ticket_sales_open: boolean
          updated_at: string | null
          venue_address: string | null
          venue_city: string | null
          venue_country: string | null
          venue_name: string | null
          venue_province: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_date: string
          event_time?: string | null
          event_type?: string | null
          id?: string
          max_capacity?: number | null
          metadata?: Json | null
          name: string
          org_id: string
          slug?: string | null
          status?: string | null
          ticket_price_thb?: number | null
          ticket_price_usd?: number | null
          ticket_sales_open?: boolean
          updated_at?: string | null
          venue_address?: string | null
          venue_city?: string | null
          venue_country?: string | null
          venue_name?: string | null
          venue_province?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string | null
          id?: string
          max_capacity?: number | null
          metadata?: Json | null
          name?: string
          org_id?: string
          slug?: string | null
          status?: string | null
          ticket_price_thb?: number | null
          ticket_price_usd?: number | null
          ticket_sales_open?: boolean
          updated_at?: string | null
          venue_address?: string | null
          venue_city?: string | null
          venue_country?: string | null
          venue_name?: string | null
          venue_province?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fighters: {
        Row: {
          bio: string | null
          created_at: string | null
          draws: number | null
          gym_id: string | null
          id: string
          losses: number | null
          no_contests: number | null
          open_to_events: boolean | null
          open_to_fights: boolean | null
          photo_url: string | null
          photos: string[] | null
          ring_name: string | null
          stance: string | null
          status: string | null
          trainer_profile_id: string | null
          updated_at: string | null
          user_id: string
          weight_class: string | null
          wins: number | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          draws?: number | null
          gym_id?: string | null
          id?: string
          losses?: number | null
          no_contests?: number | null
          open_to_events?: boolean | null
          open_to_fights?: boolean | null
          photo_url?: string | null
          photos?: string[] | null
          ring_name?: string | null
          stance?: string | null
          status?: string | null
          trainer_profile_id?: string | null
          updated_at?: string | null
          user_id: string
          weight_class?: string | null
          wins?: number | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          draws?: number | null
          gym_id?: string | null
          id?: string
          losses?: number | null
          no_contests?: number | null
          open_to_events?: boolean | null
          open_to_fights?: boolean | null
          photo_url?: string | null
          photos?: string[] | null
          ring_name?: string | null
          stance?: string | null
          status?: string | null
          trainer_profile_id?: string | null
          updated_at?: string | null
          user_id?: string
          weight_class?: string | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fighters_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fighters_trainer_profile_id_fkey"
            columns: ["trainer_profile_id"]
            isOneToOne: false
            referencedRelation: "trainer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fighters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      group_rides: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          duration_minutes: number | null
          geog: unknown
          id: string
          is_active: boolean | null
          max_participants: number | null
          meeting_lat: number | null
          meeting_lng: number | null
          meeting_point: string
          organizer_id: string
          ride_type: string | null
          start_time: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          geog?: unknown
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          meeting_lat?: number | null
          meeting_lng?: number | null
          meeting_point: string
          organizer_id: string
          ride_type?: string | null
          start_time: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          geog?: unknown
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          meeting_lat?: number | null
          meeting_lng?: number | null
          meeting_point?: string
          organizer_id?: string
          ride_type?: string | null
          start_time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_rides_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_notes: {
        Row: {
          created_at: string
          guest_id: string
          id: string
          note: string
          property_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          guest_id: string
          id?: string
          note: string
          property_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          guest_id?: string
          id?: string
          note?: string
          property_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_notes_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_notes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          arrival_date: string | null
          created_at: string
          date_of_birth: string | null
          departure_date: string | null
          full_name: string
          gender: Database["public"]["Enums"]["sc_gender"] | null
          id: string
          nationality: string | null
          passport_image_url: string | null
          passport_number: string | null
          print_status: Database["public"]["Enums"]["sc_print_status"]
          property_id: string
          room_number: string | null
          source: string | null
          status: Database["public"]["Enums"]["sc_guest_status"]
          updated_at: string
        }
        Insert: {
          arrival_date?: string | null
          created_at?: string
          date_of_birth?: string | null
          departure_date?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["sc_gender"] | null
          id?: string
          nationality?: string | null
          passport_image_url?: string | null
          passport_number?: string | null
          print_status?: Database["public"]["Enums"]["sc_print_status"]
          property_id: string
          room_number?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["sc_guest_status"]
          updated_at?: string
        }
        Update: {
          arrival_date?: string | null
          created_at?: string
          date_of_birth?: string | null
          departure_date?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["sc_gender"] | null
          id?: string
          nationality?: string | null
          passport_image_url?: string | null
          passport_number?: string | null
          print_status?: Database["public"]["Enums"]["sc_print_status"]
          property_id?: string
          room_number?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["sc_guest_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_ai_persona: {
        Row: {
          greeting: string | null
          guidelines: string | null
          language_mode: string
          org_id: string
          updated_at: string
          voice: string | null
        }
        Insert: {
          greeting?: string | null
          guidelines?: string | null
          language_mode?: string
          org_id: string
          updated_at?: string
          voice?: string | null
        }
        Update: {
          greeting?: string | null
          guidelines?: string | null
          language_mode?: string
          org_id?: string
          updated_at?: string
          voice?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gym_ai_persona_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_faqs: {
        Row: {
          answer: string
          category: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean
          org_id: string
          question: string
          updated_at: string | null
          usage_count: number
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean
          org_id: string
          question: string
          updated_at?: string | null
          usage_count?: number
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean
          org_id?: string
          question?: string
          updated_at?: string | null
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "gym_faqs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_faqs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_notifications: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_read: boolean | null
          metadata: Json | null
          org_id: string
          title: string
          type: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          org_id: string
          title: string
          type: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          org_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_packages: {
        Row: {
          created_at: string | null
          credit_count: number | null
          credit_type: string
          description: string | null
          display_order: number | null
          duration_days: number | null
          id: string
          is_active: boolean
          is_featured: boolean
          name: string
          org_id: string
          price_thb: number
          price_usd: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credit_count?: number | null
          credit_type?: string
          description?: string | null
          display_order?: number | null
          duration_days?: number | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          org_id: string
          price_thb: number
          price_usd?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credit_count?: number | null
          credit_type?: string
          description?: string | null
          display_order?: number | null
          duration_days?: number | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          org_id?: string
          price_thb?: number
          price_usd?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gym_packages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_payouts: {
        Row: {
          commission_usd: number | null
          created_at: string | null
          exchange_rate: number | null
          id: string
          notes: string | null
          org_id: string
          paid_at: string | null
          paid_by: string | null
          payment_reference: string | null
          payout_thb: number | null
          payout_usd: number | null
          period_end: string
          period_start: string
          status: string | null
          total_bookings: number | null
          total_collected_usd: number | null
          updated_at: string | null
        }
        Insert: {
          commission_usd?: number | null
          created_at?: string | null
          exchange_rate?: number | null
          id?: string
          notes?: string | null
          org_id: string
          paid_at?: string | null
          paid_by?: string | null
          payment_reference?: string | null
          payout_thb?: number | null
          payout_usd?: number | null
          period_end: string
          period_start: string
          status?: string | null
          total_bookings?: number | null
          total_collected_usd?: number | null
          updated_at?: string | null
        }
        Update: {
          commission_usd?: number | null
          created_at?: string | null
          exchange_rate?: number | null
          id?: string
          notes?: string | null
          org_id?: string
          paid_at?: string | null
          paid_by?: string | null
          payment_reference?: string | null
          payout_thb?: number | null
          payout_usd?: number | null
          period_end?: string
          period_start?: string
          status?: string | null
          total_bookings?: number | null
          total_collected_usd?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gym_payouts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_payouts_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_subscription_invoices: {
        Row: {
          amount_due_usd_cents: number | null
          amount_paid_usd_cents: number
          created_at: string
          fee_usd_cents: number | null
          gym_subscription_id: string | null
          id: string
          net_usd_cents: number | null
          org_id: string
          paid_at: string
          period_end: string | null
          period_start: string | null
          status: string
          stripe_balance_transaction_id: string | null
          stripe_charge_id: string | null
          stripe_invoice_id: string
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount_due_usd_cents?: number | null
          amount_paid_usd_cents: number
          created_at?: string
          fee_usd_cents?: number | null
          gym_subscription_id?: string | null
          id?: string
          net_usd_cents?: number | null
          org_id: string
          paid_at?: string
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_balance_transaction_id?: string | null
          stripe_charge_id?: string | null
          stripe_invoice_id: string
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount_due_usd_cents?: number | null
          amount_paid_usd_cents?: number
          created_at?: string
          fee_usd_cents?: number | null
          gym_subscription_id?: string | null
          id?: string
          net_usd_cents?: number | null
          org_id?: string
          paid_at?: string
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_balance_transaction_id?: string | null
          stripe_charge_id?: string | null
          stripe_invoice_id?: string
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gym_subscription_invoices_gym_subscription_id_fkey"
            columns: ["gym_subscription_id"]
            isOneToOne: false
            referencedRelation: "gym_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_subscription_invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_subscriptions: {
        Row: {
          activated_at: string | null
          billing_cycle: string | null
          cancelled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          monthly_price_usd_cents: number | null
          notes: string | null
          org_id: string
          plan: string | null
          price_thb: number | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          trial_nudge_1d_sent_at: string | null
          trial_nudge_7d_sent_at: string | null
          trial_nudge_expired_sent_at: string | null
          trial_starts_at: string | null
          updated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          billing_cycle?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          monthly_price_usd_cents?: number | null
          notes?: string | null
          org_id: string
          plan?: string | null
          price_thb?: number | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          trial_nudge_1d_sent_at?: string | null
          trial_nudge_7d_sent_at?: string | null
          trial_nudge_expired_sent_at?: string | null
          trial_starts_at?: string | null
          updated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          billing_cycle?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          monthly_price_usd_cents?: number | null
          notes?: string | null
          org_id?: string
          plan?: string | null
          price_thb?: number | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          trial_nudge_1d_sent_at?: string | null
          trial_nudge_7d_sent_at?: string | null
          trial_nudge_expired_sent_at?: string | null
          trial_starts_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gym_subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_website_ai_messages: {
        Row: {
          actions: Json | null
          content: string
          created_at: string
          id: string
          org_id: string
          role: string
          user_id: string | null
        }
        Insert: {
          actions?: Json | null
          content: string
          created_at?: string
          id?: string
          org_id: string
          role: string
          user_id?: string | null
        }
        Update: {
          actions?: Json | null
          content?: string
          created_at?: string
          id?: string
          org_id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gym_website_ai_messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_website_ai_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_websites: {
        Row: {
          created_at: string
          id: string
          org_id: string
          published_at: string | null
          sections: Json
          seo_description: string | null
          seo_image_url: string | null
          seo_title: string | null
          status: string
          theme: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          published_at?: string | null
          sections?: Json
          seo_description?: string | null
          seo_image_url?: string | null
          seo_title?: string | null
          status?: string
          theme?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          published_at?: string | null
          sections?: Json
          seo_description?: string | null
          seo_image_url?: string | null
          seo_title?: string | null
          status?: string
          theme?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_websites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_allotments: {
        Row: {
          beds_allocated: number
          created_at: string
          id: string
          platform: string
          property_id: string
          updated_at: string
        }
        Insert: {
          beds_allocated?: number
          created_at?: string
          id?: string
          platform: string
          property_id: string
          updated_at?: string
        }
        Update: {
          beds_allocated?: number
          created_at?: string
          id?: string
          platform?: string
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_allotments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_logs: {
        Row: {
          action: string
          created_at: string
          created_by: string | null
          id: string
          new_value: number | null
          old_value: number | null
          platform: string | null
          property_id: string
          source: string | null
        }
        Insert: {
          action: string
          created_at?: string
          created_by?: string | null
          id?: string
          new_value?: number | null
          old_value?: number | null
          platform?: string | null
          property_id: string
          source?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          created_by?: string | null
          id?: string
          new_value?: number | null
          old_value?: number | null
          platform?: string | null
          property_id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_logs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_settings: {
        Row: {
          booking_confidence_threshold: number
          created_at: string
          id: string
          property_id: string
          total_beds: number
          updated_at: string
        }
        Insert: {
          booking_confidence_threshold?: number
          created_at?: string
          id?: string
          property_id: string
          total_beds?: number
          updated_at?: string
        }
        Update: {
          booking_confidence_threshold?: number
          created_at?: string
          id?: string
          property_id?: string
          total_beds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_settings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string | null
          org_id: string
          platform_admin_role: string | null
          role: string
          status: string | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          org_id: string
          platform_admin_role?: string | null
          role?: string
          status?: string | null
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          org_id?: string
          platform_admin_role?: string | null
          role?: string
          status?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          id: string
          lesson_id: string
          quiz_answers: Json | null
          quiz_score: number | null
          started_at: string | null
          status: string | null
          user_id: string
          video_position_seconds: number | null
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          id?: string
          lesson_id: string
          quiz_answers?: Json | null
          quiz_score?: number | null
          started_at?: string | null
          status?: string | null
          user_id: string
          video_position_seconds?: number | null
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          id?: string
          lesson_id?: string
          quiz_answers?: Json | null
          quiz_score?: number | null
          started_at?: string | null
          status?: string | null
          user_id?: string
          video_position_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content_type: string | null
          course_id: string
          created_at: string | null
          description: string | null
          drill_duration_minutes: number | null
          drill_instructions: string | null
          estimated_minutes: number | null
          gallery: Json
          hero_image_url: string | null
          id: string
          is_preview: boolean | null
          lesson_order: number
          module_id: string
          text_content: string | null
          title: string
          updated_at: string | null
          video_duration_seconds: number | null
          video_url: string | null
        }
        Insert: {
          content_type?: string | null
          course_id: string
          created_at?: string | null
          description?: string | null
          drill_duration_minutes?: number | null
          drill_instructions?: string | null
          estimated_minutes?: number | null
          gallery?: Json
          hero_image_url?: string | null
          id?: string
          is_preview?: boolean | null
          lesson_order?: number
          module_id: string
          text_content?: string | null
          title: string
          updated_at?: string | null
          video_duration_seconds?: number | null
          video_url?: string | null
        }
        Update: {
          content_type?: string | null
          course_id?: string
          created_at?: string | null
          description?: string | null
          drill_duration_minutes?: number | null
          drill_instructions?: string | null
          estimated_minutes?: number | null
          gallery?: Json
          hero_image_url?: string | null
          id?: string
          is_preview?: boolean | null
          lesson_order?: number
          module_id?: string
          text_content?: string | null
          title?: string
          updated_at?: string | null
          video_duration_seconds?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      magic_link_tokens: {
        Row: {
          booking_id: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token: string
          used: boolean | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          token: string
          used?: boolean | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "magic_link_tokens_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "rental_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_drafts: {
        Row: {
          caption: string
          created_at: string
          event_id: string
          generated_by: string | null
          hashtags: string[] | null
          id: string
          language: string
          platform: string
          prompt_version: string
          status: string
          used_at: string | null
        }
        Insert: {
          caption: string
          created_at?: string
          event_id: string
          generated_by?: string | null
          hashtags?: string[] | null
          id?: string
          language: string
          platform: string
          prompt_version?: string
          status?: string
          used_at?: string | null
        }
        Update: {
          caption?: string
          created_at?: string
          event_id?: string
          generated_by?: string | null
          hashtags?: string[] | null
          id?: string
          language?: string
          platform?: string
          prompt_version?: string
          status?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_drafts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "fight_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_drafts_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      matchmaker_suggestions: {
        Row: {
          accepted_bout_id: string | null
          created_at: string
          estimated_draw: string | null
          event_id: string
          fighter_blue_id: string | null
          fighter_red_id: string | null
          generated_by: string | null
          id: string
          prompt_version: string
          reasoning: string | null
          resolved_at: string | null
          scheduled_rounds: number | null
          status: string
          weight_class: string | null
        }
        Insert: {
          accepted_bout_id?: string | null
          created_at?: string
          estimated_draw?: string | null
          event_id: string
          fighter_blue_id?: string | null
          fighter_red_id?: string | null
          generated_by?: string | null
          id?: string
          prompt_version?: string
          reasoning?: string | null
          resolved_at?: string | null
          scheduled_rounds?: number | null
          status?: string
          weight_class?: string | null
        }
        Update: {
          accepted_bout_id?: string | null
          created_at?: string
          estimated_draw?: string | null
          event_id?: string
          fighter_blue_id?: string | null
          fighter_red_id?: string | null
          generated_by?: string | null
          id?: string
          prompt_version?: string
          reasoning?: string | null
          resolved_at?: string | null
          scheduled_rounds?: number | null
          status?: string
          weight_class?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matchmaker_suggestions_accepted_bout_id_fkey"
            columns: ["accepted_bout_id"]
            isOneToOne: false
            referencedRelation: "event_bouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchmaker_suggestions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "fight_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchmaker_suggestions_fighter_blue_id_fkey"
            columns: ["fighter_blue_id"]
            isOneToOne: false
            referencedRelation: "trainer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchmaker_suggestions_fighter_red_id_fkey"
            columns: ["fighter_red_id"]
            isOneToOne: false
            referencedRelation: "trainer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchmaker_suggestions_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string | null
          id: string
          image_url: string | null
          location_expires_at: string | null
          location_lat: number | null
          location_lng: number | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          location_expires_at?: string | null
          location_lat?: number | null
          location_lng?: number | null
          sender_id: string
          sender_type: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          location_expires_at?: string | null
          location_lat?: number | null
          location_lng?: number | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      mtp_action_tokens: {
        Row: {
          action_type: string
          consumed_at: string | null
          consumed_result: Json | null
          created_at: string | null
          expires_at: string
          id: string
          org_id: string
          params: Json
          preview: string
          proposed_by_conversation: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          consumed_at?: string | null
          consumed_result?: Json | null
          created_at?: string | null
          expires_at: string
          id?: string
          org_id: string
          params: Json
          preview: string
          proposed_by_conversation?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          consumed_at?: string | null
          consumed_result?: Json | null
          created_at?: string | null
          expires_at?: string
          id?: string
          org_id?: string
          params?: Json
          preview?: string
          proposed_by_conversation?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mtp_action_tokens_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtp_action_tokens_proposed_by_conversation_fkey"
            columns: ["proposed_by_conversation"]
            isOneToOne: false
            referencedRelation: "mtp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtp_action_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mtp_channel_credentials: {
        Row: {
          auto_send_enabled: boolean
          channel: string
          created_at: string | null
          credentials: Json
          id: string
          is_active: boolean
          is_verified: boolean
          last_error: string | null
          last_verified_at: string | null
          org_id: string
          updated_at: string | null
        }
        Insert: {
          auto_send_enabled?: boolean
          channel: string
          created_at?: string | null
          credentials?: Json
          id?: string
          is_active?: boolean
          is_verified?: boolean
          last_error?: string | null
          last_verified_at?: string | null
          org_id: string
          updated_at?: string | null
        }
        Update: {
          auto_send_enabled?: boolean
          channel?: string
          created_at?: string | null
          credentials?: Json
          id?: string
          is_active?: boolean
          is_verified?: boolean
          last_error?: string | null
          last_verified_at?: string | null
          org_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mtp_channel_credentials_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mtp_chat_group_channels: {
        Row: {
          channel: string
          created_at: string | null
          display_label: string | null
          external_account_id: string
          group_id: string
          id: string
          is_active: boolean
          last_inbound_at: string | null
          updated_at: string | null
        }
        Insert: {
          channel: string
          created_at?: string | null
          display_label?: string | null
          external_account_id: string
          group_id: string
          id?: string
          is_active?: boolean
          last_inbound_at?: string | null
          updated_at?: string | null
        }
        Update: {
          channel?: string
          created_at?: string | null
          display_label?: string | null
          external_account_id?: string
          group_id?: string
          id?: string
          is_active?: boolean
          last_inbound_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mtp_chat_group_channels_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "mtp_chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      mtp_chat_group_members: {
        Row: {
          channel: string
          channel_chat_id: string | null
          channel_user_id: string
          created_at: string | null
          display_name: string | null
          group_id: string
          id: string
          role: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          channel: string
          channel_chat_id?: string | null
          channel_user_id: string
          created_at?: string | null
          display_name?: string | null
          group_id: string
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          channel?: string
          channel_chat_id?: string | null
          channel_user_id?: string
          created_at?: string | null
          display_name?: string | null
          group_id?: string
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mtp_chat_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "mtp_chat_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtp_chat_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mtp_chat_groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          org_id: string
          purpose: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          purpose: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          purpose?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mtp_chat_groups_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mtp_communication_log: {
        Row: {
          body: string
          channel: string
          conversation_id: string
          created_at: string | null
          direction: string
          draft_status: string | null
          external_message_id: string | null
          handled_by: string | null
          id: string
          metadata: Json | null
          needs_review: boolean
          org_id: string
          recipient: string | null
          sender: string | null
        }
        Insert: {
          body: string
          channel: string
          conversation_id: string
          created_at?: string | null
          direction: string
          draft_status?: string | null
          external_message_id?: string | null
          handled_by?: string | null
          id?: string
          metadata?: Json | null
          needs_review?: boolean
          org_id: string
          recipient?: string | null
          sender?: string | null
        }
        Update: {
          body?: string
          channel?: string
          conversation_id?: string
          created_at?: string | null
          direction?: string
          draft_status?: string | null
          external_message_id?: string | null
          handled_by?: string | null
          id?: string
          metadata?: Json | null
          needs_review?: boolean
          org_id?: string
          recipient?: string | null
          sender?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mtp_communication_log_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "mtp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtp_communication_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mtp_conversations: {
        Row: {
          assigned_to: string | null
          channel: string
          created_at: string | null
          external_thread_id: string
          group_id: string
          id: string
          language: string | null
          last_message_at: string | null
          last_message_preview: string | null
          org_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          channel: string
          created_at?: string | null
          external_thread_id: string
          group_id: string
          id?: string
          language?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          org_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          channel?: string
          created_at?: string | null
          external_thread_id?: string
          group_id?: string
          id?: string
          language?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          org_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mtp_conversations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtp_conversations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "mtp_chat_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtp_conversations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      northcrest_agent_conversations: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          last_message_at: string | null
          message_count: number
          pinned: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id?: string
          last_message_at?: string | null
          message_count?: number
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          last_message_at?: string | null
          message_count?: number
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "northcrest_agent_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "northcrest_users"
            referencedColumns: ["id"]
          },
        ]
      }
      northcrest_agent_messages: {
        Row: {
          content: Json
          conversation_id: string
          created_at: string
          id: string
          role: string
          usage: Json | null
        }
        Insert: {
          content: Json
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          usage?: Json | null
        }
        Update: {
          content?: Json
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          usage?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "northcrest_agent_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "northcrest_agent_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      northcrest_blocked_handles: {
        Row: {
          blocked_at: string
          blocked_by: string | null
          channel: string
          handle: string
          reason: string | null
        }
        Insert: {
          blocked_at?: string
          blocked_by?: string | null
          channel: string
          handle: string
          reason?: string | null
        }
        Update: {
          blocked_at?: string
          blocked_by?: string | null
          channel?: string
          handle?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "northcrest_blocked_handles_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "northcrest_users"
            referencedColumns: ["id"]
          },
        ]
      }
      northcrest_corrections: {
        Row: {
          context: Json | null
          corrected_by: string | null
          corrected_value: string | null
          created_at: string
          field: string
          id: string
          original_value: string | null
          record_id: string
          table_name: string
        }
        Insert: {
          context?: Json | null
          corrected_by?: string | null
          corrected_value?: string | null
          created_at?: string
          field: string
          id?: string
          original_value?: string | null
          record_id: string
          table_name: string
        }
        Update: {
          context?: Json | null
          corrected_by?: string | null
          corrected_value?: string | null
          created_at?: string
          field?: string
          id?: string
          original_value?: string | null
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "northcrest_corrections_corrected_by_fkey"
            columns: ["corrected_by"]
            isOneToOne: false
            referencedRelation: "northcrest_users"
            referencedColumns: ["id"]
          },
        ]
      }
      northcrest_customers: {
        Row: {
          archived: boolean
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          primary_address: string | null
          primary_email: string | null
          primary_phone: string | null
          updated_at: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          primary_address?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          updated_at?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          primary_address?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "northcrest_customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "northcrest_users"
            referencedColumns: ["id"]
          },
        ]
      }
      northcrest_faqs: {
        Row: {
          answer: string
          archived: boolean
          category: string | null
          created_at: string
          created_by: string | null
          id: string
          last_used_at: string | null
          question: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          answer: string
          archived?: boolean
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_used_at?: string | null
          question: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          answer?: string
          archived?: boolean
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_used_at?: string | null
          question?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "northcrest_faqs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "northcrest_users"
            referencedColumns: ["id"]
          },
        ]
      }
      northcrest_inbound_messages: {
        Row: {
          body: string | null
          channel: string
          external_id: string
          from_handle: string | null
          from_name: string | null
          id: string
          lead_id: string | null
          raw: Json | null
          received_at: string
        }
        Insert: {
          body?: string | null
          channel: string
          external_id: string
          from_handle?: string | null
          from_name?: string | null
          id?: string
          lead_id?: string | null
          raw?: Json | null
          received_at?: string
        }
        Update: {
          body?: string | null
          channel?: string
          external_id?: string
          from_handle?: string | null
          from_name?: string | null
          id?: string
          lead_id?: string | null
          raw?: Json | null
          received_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "northcrest_inbound_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "northcrest_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      northcrest_insights_cache: {
        Row: {
          cache_key: string
          created_at: string
          expires_at: string
          payload: Json
        }
        Insert: {
          cache_key: string
          created_at?: string
          expires_at: string
          payload: Json
        }
        Update: {
          cache_key?: string
          created_at?: string
          expires_at?: string
          payload?: Json
        }
        Relationships: []
      }
      northcrest_invites: {
        Row: {
          accepted_at: string | null
          email: string
          full_name: string | null
          hourly_rate_cents: number | null
          invited_at: string
          invited_by: string | null
          role: Database["public"]["Enums"]["northcrest_role"]
        }
        Insert: {
          accepted_at?: string | null
          email: string
          full_name?: string | null
          hourly_rate_cents?: number | null
          invited_at?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["northcrest_role"]
        }
        Update: {
          accepted_at?: string | null
          email?: string
          full_name?: string | null
          hourly_rate_cents?: number | null
          invited_at?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["northcrest_role"]
        }
        Relationships: [
          {
            foreignKeyName: "northcrest_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "northcrest_users"
            referencedColumns: ["id"]
          },
        ]
      }
      northcrest_job_assignments: {
        Row: {
          assigned_at: string
          job_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          job_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "northcrest_job_assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "northcrest_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "northcrest_job_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "northcrest_users"
            referencedColumns: ["id"]
          },
        ]
      }
      northcrest_jobs: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          estimated_hours: number | null
          id: string
          notes: string | null
          quoted_amount_cents: number | null
          scheduled_for: string | null
          status: Database["public"]["Enums"]["northcrest_job_status"]
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          estimated_hours?: number | null
          id?: string
          notes?: string | null
          quoted_amount_cents?: number | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["northcrest_job_status"]
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          estimated_hours?: number | null
          id?: string
          notes?: string | null
          quoted_amount_cents?: number | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["northcrest_job_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "northcrest_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "northcrest_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "northcrest_jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "northcrest_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      northcrest_lead_events: {
        Row: {
          actor_label: string | null
          actor_user_id: string | null
          content: Json
          created_at: string
          id: string
          kind: string
          lead_id: string
        }
        Insert: {
          actor_label?: string | null
          actor_user_id?: string | null
          content: Json
          created_at?: string
          id?: string
          kind: string
          lead_id: string
        }
        Update: {
          actor_label?: string | null
          actor_user_id?: string | null
          content?: Json
          created_at?: string
          id?: string
          kind?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "northcrest_lead_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "northcrest_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "northcrest_lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "northcrest_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      northcrest_leads: {
        Row: {
          address: string | null
          ai_priority_reason: string | null
          ai_suggested_reply: string | null
          ai_summary: string | null
          ai_triaged_at: string | null
          assigned_to: string | null
          created_at: string
          customer_id: string | null
          email: string | null
          id: string
          job_id: string | null
          last_activity_at: string
          message: string | null
          name: string | null
          phone: string | null
          priority:
            | Database["public"]["Enums"]["northcrest_lead_priority"]
            | null
          service_interest: string | null
          source: Database["public"]["Enums"]["northcrest_lead_source"]
          source_detail: string | null
          status: Database["public"]["Enums"]["northcrest_lead_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          ai_priority_reason?: string | null
          ai_suggested_reply?: string | null
          ai_summary?: string | null
          ai_triaged_at?: string | null
          assigned_to?: string | null
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          job_id?: string | null
          last_activity_at?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          priority?:
            | Database["public"]["Enums"]["northcrest_lead_priority"]
            | null
          service_interest?: string | null
          source?: Database["public"]["Enums"]["northcrest_lead_source"]
          source_detail?: string | null
          status?: Database["public"]["Enums"]["northcrest_lead_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          ai_priority_reason?: string | null
          ai_suggested_reply?: string | null
          ai_summary?: string | null
          ai_triaged_at?: string | null
          assigned_to?: string | null
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          job_id?: string | null
          last_activity_at?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          priority?:
            | Database["public"]["Enums"]["northcrest_lead_priority"]
            | null
          service_interest?: string | null
          source?: Database["public"]["Enums"]["northcrest_lead_source"]
          source_detail?: string | null
          status?: Database["public"]["Enums"]["northcrest_lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "northcrest_leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "northcrest_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "northcrest_leads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "northcrest_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "northcrest_leads_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "northcrest_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      northcrest_receipts: {
        Row: {
          category:
            | Database["public"]["Enums"]["northcrest_expense_category"]
            | null
          created_at: string
          currency: string | null
          hst_cents: number | null
          id: string
          image_path: string
          job_id: string | null
          purchased_at: string | null
          raw_extraction: Json | null
          status: Database["public"]["Enums"]["northcrest_receipt_status"]
          subtotal_cents: number | null
          summary: string | null
          total_cents: number | null
          updated_at: string
          user_id: string
          vendor: string | null
        }
        Insert: {
          category?:
            | Database["public"]["Enums"]["northcrest_expense_category"]
            | null
          created_at?: string
          currency?: string | null
          hst_cents?: number | null
          id?: string
          image_path: string
          job_id?: string | null
          purchased_at?: string | null
          raw_extraction?: Json | null
          status?: Database["public"]["Enums"]["northcrest_receipt_status"]
          subtotal_cents?: number | null
          summary?: string | null
          total_cents?: number | null
          updated_at?: string
          user_id: string
          vendor?: string | null
        }
        Update: {
          category?:
            | Database["public"]["Enums"]["northcrest_expense_category"]
            | null
          created_at?: string
          currency?: string | null
          hst_cents?: number | null
          id?: string
          image_path?: string
          job_id?: string | null
          purchased_at?: string | null
          raw_extraction?: Json | null
          status?: Database["public"]["Enums"]["northcrest_receipt_status"]
          subtotal_cents?: number | null
          summary?: string | null
          total_cents?: number | null
          updated_at?: string
          user_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "northcrest_receipts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "northcrest_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "northcrest_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "northcrest_users"
            referencedColumns: ["id"]
          },
        ]
      }
      northcrest_time_entries: {
        Row: {
          clock_in_accuracy_m: number | null
          clock_in_at: string
          clock_in_lat: number | null
          clock_in_lng: number | null
          clock_out_accuracy_m: number | null
          clock_out_at: string | null
          clock_out_lat: number | null
          clock_out_lng: number | null
          created_at: string
          id: string
          job_id: string | null
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          clock_in_accuracy_m?: number | null
          clock_in_at?: string
          clock_in_lat?: number | null
          clock_in_lng?: number | null
          clock_out_accuracy_m?: number | null
          clock_out_at?: string | null
          clock_out_lat?: number | null
          clock_out_lng?: number | null
          created_at?: string
          id?: string
          job_id?: string | null
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          clock_in_accuracy_m?: number | null
          clock_in_at?: string
          clock_in_lat?: number | null
          clock_in_lng?: number | null
          clock_out_accuracy_m?: number | null
          clock_out_at?: string | null
          clock_out_lat?: number | null
          clock_out_lng?: number | null
          created_at?: string
          id?: string
          job_id?: string | null
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "northcrest_time_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "northcrest_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "northcrest_time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "northcrest_users"
            referencedColumns: ["id"]
          },
        ]
      }
      northcrest_users: {
        Row: {
          active: boolean
          certifications: string | null
          created_at: string
          email: string
          full_name: string | null
          hourly_rate_cents: number | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["northcrest_role"]
          specialties: string[]
          start_date: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          certifications?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          hourly_rate_cents?: number | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["northcrest_role"]
          specialties?: string[]
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          certifications?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          hourly_rate_cents?: number | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["northcrest_role"]
          specialties?: string[]
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_events: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string | null
          read: boolean | null
          recipient_id: string
          sender_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean | null
          recipient_id: string
          sender_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean | null
          recipient_id?: string
          sender_id?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      org_members: {
        Row: {
          id: string
          joined_at: string | null
          org_id: string
          role: string
          status: string | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          org_id: string
          role: string
          status?: string | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          org_id?: string
          role?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      org_settings: {
        Row: {
          allow_guest_bookings: boolean | null
          booking_advance_days: number | null
          booking_max_days_ahead: number | null
          custom_settings: Json | null
          email_cert_congrats_enabled: boolean
          email_lapsed_enabled: boolean
          email_welcome_enabled: boolean
          id: string
          notification_email: string | null
          notification_emails: string[] | null
          notification_phone: string | null
          notify_on_booking_email: boolean | null
          notify_on_booking_sms: boolean | null
          notify_on_booking_whatsapp: boolean | null
          notify_on_cancellation: boolean | null
          notify_on_payment: boolean | null
          operating_hours: Json | null
          org_id: string
          require_payment_upfront: boolean | null
          show_prices: boolean | null
          show_trainer_selection: boolean | null
          updated_at: string | null
        }
        Insert: {
          allow_guest_bookings?: boolean | null
          booking_advance_days?: number | null
          booking_max_days_ahead?: number | null
          custom_settings?: Json | null
          email_cert_congrats_enabled?: boolean
          email_lapsed_enabled?: boolean
          email_welcome_enabled?: boolean
          id?: string
          notification_email?: string | null
          notification_emails?: string[] | null
          notification_phone?: string | null
          notify_on_booking_email?: boolean | null
          notify_on_booking_sms?: boolean | null
          notify_on_booking_whatsapp?: boolean | null
          notify_on_cancellation?: boolean | null
          notify_on_payment?: boolean | null
          operating_hours?: Json | null
          org_id: string
          require_payment_upfront?: boolean | null
          show_prices?: boolean | null
          show_trainer_selection?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allow_guest_bookings?: boolean | null
          booking_advance_days?: number | null
          booking_max_days_ahead?: number | null
          custom_settings?: Json | null
          email_cert_congrats_enabled?: boolean
          email_lapsed_enabled?: boolean
          email_welcome_enabled?: boolean
          id?: string
          notification_email?: string | null
          notification_emails?: string[] | null
          notification_phone?: string | null
          notify_on_booking_email?: boolean | null
          notify_on_booking_sms?: boolean | null
          notify_on_booking_whatsapp?: boolean | null
          notify_on_cancellation?: boolean | null
          notify_on_payment?: boolean | null
          operating_hours?: Json | null
          org_id?: string
          require_payment_upfront?: boolean | null
          show_prices?: boolean | null
          show_trainer_selection?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_waivers: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_active: boolean
          org_id: string
          title: string
          updated_at: string | null
          version: number
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          org_id: string
          title: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          org_id?: string
          title?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "org_waivers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          email: string | null
          facebook: string | null
          gallery_urls: string[] | null
          google_maps_url: string | null
          id: string
          instagram: string | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          phone: string | null
          promptpay_id: string | null
          province: string | null
          slug: string
          status: string | null
          stripe_account_id: string | null
          stripe_onboarded: boolean | null
          timezone: string | null
          updated_at: string | null
          verified: boolean | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          facebook?: string | null
          gallery_urls?: string[] | null
          google_maps_url?: string | null
          id?: string
          instagram?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          phone?: string | null
          promptpay_id?: string | null
          province?: string | null
          slug: string
          status?: string | null
          stripe_account_id?: string | null
          stripe_onboarded?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          facebook?: string | null
          gallery_urls?: string[] | null
          google_maps_url?: string | null
          id?: string
          instagram?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          phone?: string | null
          promptpay_id?: string | null
          province?: string | null
          slug?: string
          status?: string | null
          stripe_account_id?: string | null
          stripe_onboarded?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      ota_accounts: {
        Row: {
          account_name: string | null
          created_at: string
          id: string
          last_verified_at: string | null
          platform: Database["public"]["Enums"]["sc_ota_platform"]
          property_id: string
          status: Database["public"]["Enums"]["sc_ota_account_status"]
        }
        Insert: {
          account_name?: string | null
          created_at?: string
          id?: string
          last_verified_at?: string | null
          platform: Database["public"]["Enums"]["sc_ota_platform"]
          property_id: string
          status?: Database["public"]["Enums"]["sc_ota_account_status"]
        }
        Update: {
          account_name?: string | null
          created_at?: string
          id?: string
          last_verified_at?: string | null
          platform?: Database["public"]["Enums"]["sc_ota_platform"]
          property_id?: string
          status?: Database["public"]["Enums"]["sc_ota_account_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ota_accounts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ota_agent_logs: {
        Row: {
          action: string
          action_details: Json | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          platform: string | null
          property_id: string
          status: Database["public"]["Enums"]["sc_ota_log_status"]
        }
        Insert: {
          action: string
          action_details?: Json | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          platform?: string | null
          property_id: string
          status?: Database["public"]["Enums"]["sc_ota_log_status"]
        }
        Update: {
          action?: string
          action_details?: Json | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          platform?: string | null
          property_id?: string
          status?: Database["public"]["Enums"]["sc_ota_log_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ota_agent_logs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ota_conversations: {
        Row: {
          created_at: string
          guest_email: string | null
          guest_name: string | null
          id: string
          last_message_at: string | null
          last_message_snippet: string | null
          ota_account_id: string
          platform: Database["public"]["Enums"]["sc_ota_platform"]
          property_id: string
          reservation_id: string | null
          status: Database["public"]["Enums"]["sc_ota_conversation_status"]
          thread_key: string
          unread_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          last_message_at?: string | null
          last_message_snippet?: string | null
          ota_account_id: string
          platform: Database["public"]["Enums"]["sc_ota_platform"]
          property_id: string
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["sc_ota_conversation_status"]
          thread_key: string
          unread_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          last_message_at?: string | null
          last_message_snippet?: string | null
          ota_account_id?: string
          platform?: Database["public"]["Enums"]["sc_ota_platform"]
          property_id?: string
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["sc_ota_conversation_status"]
          thread_key?: string
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ota_conversations_ota_account_id_fkey"
            columns: ["ota_account_id"]
            isOneToOne: false
            referencedRelation: "ota_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ota_conversations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ota_credentials: {
        Row: {
          created_at: string
          id: string
          last_login_at: string | null
          password: string | null
          platform: string
          property_code: string | null
          property_id: string
          status: Database["public"]["Enums"]["sc_ota_credential_status"]
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_login_at?: string | null
          password?: string | null
          platform: string
          property_code?: string | null
          property_id: string
          status?: Database["public"]["Enums"]["sc_ota_credential_status"]
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_login_at?: string | null
          password?: string | null
          platform?: string
          property_code?: string | null
          property_id?: string
          status?: Database["public"]["Enums"]["sc_ota_credential_status"]
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ota_credentials_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ota_email_parsings: {
        Row: {
          check_in_date: string | null
          check_out_date: string | null
          email_from: string | null
          email_subject: string | null
          guest_name: string | null
          id: string
          parsed_at: string
          platform: string | null
          processed: boolean
          property_id: string
          raw_content: string | null
          room_type: string | null
        }
        Insert: {
          check_in_date?: string | null
          check_out_date?: string | null
          email_from?: string | null
          email_subject?: string | null
          guest_name?: string | null
          id?: string
          parsed_at?: string
          platform?: string | null
          processed?: boolean
          property_id: string
          raw_content?: string | null
          room_type?: string | null
        }
        Update: {
          check_in_date?: string | null
          check_out_date?: string | null
          email_from?: string | null
          email_subject?: string | null
          guest_name?: string | null
          id?: string
          parsed_at?: string
          platform?: string | null
          processed?: boolean
          property_id?: string
          raw_content?: string | null
          room_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ota_email_parsings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ota_encrypted_credentials: {
        Row: {
          created_at: string
          id: string
          ota_account_id: string
          password_encrypted: string
          updated_at: string
          username_encrypted: string
        }
        Insert: {
          created_at?: string
          id?: string
          ota_account_id: string
          password_encrypted: string
          updated_at?: string
          username_encrypted: string
        }
        Update: {
          created_at?: string
          id?: string
          ota_account_id?: string
          password_encrypted?: string
          updated_at?: string
          username_encrypted?: string
        }
        Relationships: [
          {
            foreignKeyName: "ota_encrypted_credentials_ota_account_id_fkey"
            columns: ["ota_account_id"]
            isOneToOne: true
            referencedRelation: "ota_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ota_message_drafts: {
        Row: {
          conversation_id: string
          created_at: string
          created_by: string | null
          draft_body: string
          id: string
          property_id: string
          source: Database["public"]["Enums"]["sc_ota_draft_source"]
          updated_at: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          created_by?: string | null
          draft_body: string
          id?: string
          property_id: string
          source?: Database["public"]["Enums"]["sc_ota_draft_source"]
          updated_at?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          created_by?: string | null
          draft_body?: string
          id?: string
          property_id?: string
          source?: Database["public"]["Enums"]["sc_ota_draft_source"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ota_message_drafts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ota_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ota_message_drafts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ota_messages: {
        Row: {
          body: string
          body_html: string | null
          conversation_id: string
          created_at: string
          direction: Database["public"]["Enums"]["sc_ota_message_direction"]
          id: string
          message_id: string | null
          ota_account_id: string
          property_id: string
          raw_payload: Json | null
          read_at: string | null
          sender_name: string | null
          sender_type: Database["public"]["Enums"]["sc_ota_sender_type"]
          sent_at: string
          status: Database["public"]["Enums"]["sc_ota_message_status"]
          updated_at: string
        }
        Insert: {
          body: string
          body_html?: string | null
          conversation_id: string
          created_at?: string
          direction: Database["public"]["Enums"]["sc_ota_message_direction"]
          id?: string
          message_id?: string | null
          ota_account_id: string
          property_id: string
          raw_payload?: Json | null
          read_at?: string | null
          sender_name?: string | null
          sender_type: Database["public"]["Enums"]["sc_ota_sender_type"]
          sent_at?: string
          status?: Database["public"]["Enums"]["sc_ota_message_status"]
          updated_at?: string
        }
        Update: {
          body?: string
          body_html?: string | null
          conversation_id?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["sc_ota_message_direction"]
          id?: string
          message_id?: string | null
          ota_account_id?: string
          property_id?: string
          raw_payload?: Json | null
          read_at?: string | null
          sender_name?: string | null
          sender_type?: Database["public"]["Enums"]["sc_ota_sender_type"]
          sent_at?: string
          status?: Database["public"]["Enums"]["sc_ota_message_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ota_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ota_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ota_messages_ota_account_id_fkey"
            columns: ["ota_account_id"]
            isOneToOne: false
            referencedRelation: "ota_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ota_messages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ota_sessions: {
        Row: {
          account_id: string
          cookies: string | null
          created_at: string
          device: string
          id: string
          updated_at: string
        }
        Insert: {
          account_id: string
          cookies?: string | null
          created_at?: string
          device?: string
          id?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          cookies?: string | null
          created_at?: string
          device?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ota_sessions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ota_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ota_sync_jobs: {
        Row: {
          created_at: string
          error_message: string | null
          finished_at: string | null
          id: string
          job_type: Database["public"]["Enums"]["sc_ota_job_type"]
          ota_account_id: string
          payload: Json | null
          result: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["sc_ota_job_status"]
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_type: Database["public"]["Enums"]["sc_ota_job_type"]
          ota_account_id: string
          payload?: Json | null
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["sc_ota_job_status"]
        }
        Update: {
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_type?: Database["public"]["Enums"]["sc_ota_job_type"]
          ota_account_id?: string
          payload?: Json | null
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["sc_ota_job_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ota_sync_jobs_ota_account_id_fkey"
            columns: ["ota_account_id"]
            isOneToOne: false
            referencedRelation: "ota_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ota_task_queue: {
        Row: {
          command: Database["public"]["Enums"]["sc_ota_command"]
          created_at: string
          id: string
          ota_account_id: string
          payload: Json | null
          priority: number
          processed_at: string | null
        }
        Insert: {
          command: Database["public"]["Enums"]["sc_ota_command"]
          created_at?: string
          id?: string
          ota_account_id: string
          payload?: Json | null
          priority?: number
          processed_at?: string | null
        }
        Update: {
          command?: Database["public"]["Enums"]["sc_ota_command"]
          created_at?: string
          id?: string
          ota_account_id?: string
          payload?: Json | null
          priority?: number
          processed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ota_task_queue_ota_account_id_fkey"
            columns: ["ota_account_id"]
            isOneToOne: false
            referencedRelation: "ota_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_thb: number
          amount_usd: number | null
          booking_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          metadata: Json | null
          org_id: string
          payment_method: string | null
          status: string | null
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          stripe_receipt_url: string | null
          user_id: string | null
        }
        Insert: {
          amount_thb: number
          amount_usd?: number | null
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          org_id: string
          payment_method?: string | null
          status?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_receipt_url?: string | null
          user_id?: string | null
        }
        Update: {
          amount_thb?: number
          amount_usd?: number | null
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string
          payment_method?: string | null
          status?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_receipt_url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_user_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          target_id: string | null
          target_label: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_label?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_label?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          name: string | null
          role: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          name?: string | null
          role?: string
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          name?: string | null
          role?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_signals: {
        Row: {
          acted_at: string | null
          acted_by: string | null
          action_payload: Json | null
          created_at: string
          dedup_key: string | null
          detail: string | null
          dismissed_at: string | null
          dismissed_by: string | null
          evidence: Json | null
          expires_at: string | null
          generated_at: string
          id: string
          kind: string
          severity: string
          status: string
          suggested_action: string | null
          summary: string
          target_org_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          acted_at?: string | null
          acted_by?: string | null
          action_payload?: Json | null
          created_at?: string
          dedup_key?: string | null
          detail?: string | null
          dismissed_at?: string | null
          dismissed_by?: string | null
          evidence?: Json | null
          expires_at?: string | null
          generated_at?: string
          id?: string
          kind: string
          severity?: string
          status?: string
          suggested_action?: string | null
          summary: string
          target_org_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          acted_at?: string | null
          acted_by?: string | null
          action_payload?: Json | null
          created_at?: string
          dedup_key?: string | null
          detail?: string | null
          dismissed_at?: string | null
          dismissed_by?: string | null
          evidence?: Json | null
          expires_at?: string | null
          generated_at?: string
          id?: string
          kind?: string
          severity?: string
          status?: string
          suggested_action?: string | null
          summary?: string
          target_org_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_signals_acted_by_fkey"
            columns: ["acted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_signals_dismissed_by_fkey"
            columns: ["dismissed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_signals_target_org_id_fkey"
            columns: ["target_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_base_rates: {
        Row: {
          base_price_usd: number
          created_at: string
          id: string
          property_id: string
          room_type_id: string
          updated_at: string
        }
        Insert: {
          base_price_usd?: number
          created_at?: string
          id?: string
          property_id: string
          room_type_id: string
          updated_at?: string
        }
        Update: {
          base_price_usd?: number
          created_at?: string
          id?: string
          property_id?: string
          room_type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_base_rates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_base_rates_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_recommendations: {
        Row: {
          applied_price_thb: number | null
          applied_quantity_total: number | null
          comparable_event_count: number
          confidence: string | null
          created_at: string
          current_price_thb: number | null
          current_quantity_total: number | null
          event_id: string
          generated_by: string | null
          id: string
          projected_sold: number | null
          prompt_version: string
          reasoning: string | null
          recommended_price_thb: number
          recommended_quantity_total: number | null
          resolved_at: string | null
          signal: string | null
          status: string
          tier_id: string | null
          tier_name: string
        }
        Insert: {
          applied_price_thb?: number | null
          applied_quantity_total?: number | null
          comparable_event_count?: number
          confidence?: string | null
          created_at?: string
          current_price_thb?: number | null
          current_quantity_total?: number | null
          event_id: string
          generated_by?: string | null
          id?: string
          projected_sold?: number | null
          prompt_version?: string
          reasoning?: string | null
          recommended_price_thb: number
          recommended_quantity_total?: number | null
          resolved_at?: string | null
          signal?: string | null
          status?: string
          tier_id?: string | null
          tier_name: string
        }
        Update: {
          applied_price_thb?: number | null
          applied_quantity_total?: number | null
          comparable_event_count?: number
          confidence?: string | null
          created_at?: string
          current_price_thb?: number | null
          current_quantity_total?: number | null
          event_id?: string
          generated_by?: string | null
          id?: string
          projected_sold?: number | null
          prompt_version?: string
          reasoning?: string | null
          recommended_price_thb?: number
          recommended_quantity_total?: number | null
          resolved_at?: string | null
          signal?: string | null
          status?: string
          tier_id?: string | null
          tier_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_recommendations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "fight_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_recommendations_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_recommendations_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "event_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          created_at: string
          day_of_week: number[] | null
          end_date: string | null
          id: string
          is_active: boolean
          max_los: number | null
          max_occupancy: number | null
          min_los: number | null
          min_occupancy: number | null
          name: string
          percentage: number
          platform: string | null
          priority: number
          property_id: string
          room_type_id: string | null
          rule_type: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number[] | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          max_los?: number | null
          max_occupancy?: number | null
          min_los?: number | null
          min_occupancy?: number | null
          name: string
          percentage?: number
          platform?: string | null
          priority?: number
          property_id: string
          room_type_id?: string | null
          rule_type: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number[] | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          max_los?: number | null
          max_occupancy?: number | null
          min_los?: number | null
          min_occupancy?: number | null
          name?: string
          percentage?: number
          platform?: string | null
          priority?: number
          property_id?: string
          room_type_id?: string | null
          rule_type?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_rules_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          allow_location_sharing: boolean | null
          allow_male_messages: boolean | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          email_notifications: boolean | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          expiration_date: string | null
          full_name: string
          gender: string | null
          has_seen_map_hints: boolean | null
          has_seen_social_hints: boolean | null
          id: string
          issuance_date: string | null
          issuing_country: string | null
          license_expiry: string | null
          license_number: string | null
          onboarding_completed: boolean | null
          passport_full_name: string | null
          passport_number: string | null
          passport_photo_url: string | null
          passport_verified_at: string | null
          payment_added: boolean | null
          payment_method_added: boolean | null
          phone: string | null
          place_of_birth: string | null
          preferred_language: string | null
          profile_photo_url: string | null
          promo_notifications: boolean | null
          push_notifications: boolean | null
          ride_preferences: string[] | null
          rider_verified: boolean | null
          shop_verified: boolean | null
          show_online_status: boolean | null
          updated_at: string | null
          verification_complete: boolean | null
        }
        Insert: {
          allow_location_sharing?: boolean | null
          allow_male_messages?: boolean | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email_notifications?: boolean | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          expiration_date?: string | null
          full_name: string
          gender?: string | null
          has_seen_map_hints?: boolean | null
          has_seen_social_hints?: boolean | null
          id: string
          issuance_date?: string | null
          issuing_country?: string | null
          license_expiry?: string | null
          license_number?: string | null
          onboarding_completed?: boolean | null
          passport_full_name?: string | null
          passport_number?: string | null
          passport_photo_url?: string | null
          passport_verified_at?: string | null
          payment_added?: boolean | null
          payment_method_added?: boolean | null
          phone?: string | null
          place_of_birth?: string | null
          preferred_language?: string | null
          profile_photo_url?: string | null
          promo_notifications?: boolean | null
          push_notifications?: boolean | null
          ride_preferences?: string[] | null
          rider_verified?: boolean | null
          shop_verified?: boolean | null
          show_online_status?: boolean | null
          updated_at?: string | null
          verification_complete?: boolean | null
        }
        Update: {
          allow_location_sharing?: boolean | null
          allow_male_messages?: boolean | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email_notifications?: boolean | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          expiration_date?: string | null
          full_name?: string
          gender?: string | null
          has_seen_map_hints?: boolean | null
          has_seen_social_hints?: boolean | null
          id?: string
          issuance_date?: string | null
          issuing_country?: string | null
          license_expiry?: string | null
          license_number?: string | null
          onboarding_completed?: boolean | null
          passport_full_name?: string | null
          passport_number?: string | null
          passport_photo_url?: string | null
          passport_verified_at?: string | null
          payment_added?: boolean | null
          payment_method_added?: boolean | null
          phone?: string | null
          place_of_birth?: string | null
          preferred_language?: string | null
          profile_photo_url?: string | null
          promo_notifications?: boolean | null
          push_notifications?: boolean | null
          ride_preferences?: string[] | null
          rider_verified?: boolean | null
          shop_verified?: boolean | null
          show_online_status?: boolean | null
          updated_at?: string | null
          verification_complete?: boolean | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          created_at: string
          current_period_end: string | null
          district: string | null
          id: string
          language_preference: Database["public"]["Enums"]["sc_language_preference"]
          license_number: string | null
          owner_full_name: string | null
          phone: string | null
          property_name: string
          property_type: Database["public"]["Enums"]["sc_property_type"]
          province: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: Database["public"]["Enums"]["sc_subscription_status"]
          subscription_tier: string | null
          timezone: string
          trial_end_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          current_period_end?: string | null
          district?: string | null
          id?: string
          language_preference?: Database["public"]["Enums"]["sc_language_preference"]
          license_number?: string | null
          owner_full_name?: string | null
          phone?: string | null
          property_name?: string
          property_type?: Database["public"]["Enums"]["sc_property_type"]
          province?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: Database["public"]["Enums"]["sc_subscription_status"]
          subscription_tier?: string | null
          timezone?: string
          trial_end_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          current_period_end?: string | null
          district?: string | null
          id?: string
          language_preference?: Database["public"]["Enums"]["sc_language_preference"]
          license_number?: string | null
          owner_full_name?: string | null
          phone?: string | null
          property_name?: string
          property_type?: Database["public"]["Enums"]["sc_property_type"]
          province?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: Database["public"]["Enums"]["sc_subscription_status"]
          subscription_tier?: string | null
          timezone?: string
          trial_end_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      property_health_scores: {
        Row: {
          created_at: string
          evaluation: Json | null
          id: string
          property_id: string
          reasons: Json
          score: number
        }
        Insert: {
          created_at?: string
          evaluation?: Json | null
          id?: string
          property_id: string
          reasons?: Json
          score: number
        }
        Update: {
          created_at?: string
          evaluation?: Json | null
          id?: string
          property_id?: string
          reasons?: Json
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "property_health_scores_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_link_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          property_id: string
          token: string
          used_at: string | null
          used_by_chat_group_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          property_id: string
          token: string
          used_at?: string | null
          used_by_chat_group_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          property_id?: string
          token?: string
          used_at?: string | null
          used_by_chat_group_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_link_tokens_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_link_tokens_used_by_chat_group_id_fkey"
            columns: ["used_by_chat_group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string | null
          created_at: string | null
          explanation: string | null
          id: string
          lesson_id: string
          options: Json | null
          question_order: number | null
          question_text: string
          question_type: string | null
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string | null
          explanation?: string | null
          id?: string
          lesson_id: string
          options?: Json | null
          question_order?: number | null
          question_text: string
          question_type?: string | null
        }
        Update: {
          correct_answer?: string | null
          created_at?: string | null
          explanation?: string | null
          id?: string
          lesson_id?: string
          options?: Json | null
          question_order?: number | null
          question_text?: string
          question_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_buckets: {
        Row: {
          count: number
          expires_at: string
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          expires_at: string
          key: string
          window_start: string
        }
        Update: {
          count?: number
          expires_at?: string
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      rental_bookings: {
        Row: {
          booking_number: string
          booking_status: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string | null
          daily_rate: number
          damage_fee_amount: number | null
          deposit_amount: number
          deposit_returned: boolean | null
          deposit_type: string | null
          end_date: string
          fuel_charge_amount: number | null
          id: string
          late_fee_amount: number | null
          payment_status: string | null
          picked_up_at: string | null
          pickup_fuel_level: number | null
          pickup_kilometers: number | null
          pickup_notes: string | null
          pickup_time: string | null
          qr_code: string | null
          rental_agreement_signed: boolean | null
          rental_agreement_url: string | null
          return_fuel_level: number | null
          return_kilometers: number | null
          return_notes: string | null
          return_time: string | null
          returned_at: string | null
          rider_id: string | null
          scooter_id: string | null
          shop_id: string | null
          start_date: string
          subtotal: number
          tax_amount: number | null
          total_amount: number
          total_days: number
          updated_at: string | null
        }
        Insert: {
          booking_number: string
          booking_status?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          daily_rate: number
          damage_fee_amount?: number | null
          deposit_amount: number
          deposit_returned?: boolean | null
          deposit_type?: string | null
          end_date: string
          fuel_charge_amount?: number | null
          id?: string
          late_fee_amount?: number | null
          payment_status?: string | null
          picked_up_at?: string | null
          pickup_fuel_level?: number | null
          pickup_kilometers?: number | null
          pickup_notes?: string | null
          pickup_time?: string | null
          qr_code?: string | null
          rental_agreement_signed?: boolean | null
          rental_agreement_url?: string | null
          return_fuel_level?: number | null
          return_kilometers?: number | null
          return_notes?: string | null
          return_time?: string | null
          returned_at?: string | null
          rider_id?: string | null
          scooter_id?: string | null
          shop_id?: string | null
          start_date: string
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          total_days: number
          updated_at?: string | null
        }
        Update: {
          booking_number?: string
          booking_status?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          daily_rate?: number
          damage_fee_amount?: number | null
          deposit_amount?: number
          deposit_returned?: boolean | null
          deposit_type?: string | null
          end_date?: string
          fuel_charge_amount?: number | null
          id?: string
          late_fee_amount?: number | null
          payment_status?: string | null
          picked_up_at?: string | null
          pickup_fuel_level?: number | null
          pickup_kilometers?: number | null
          pickup_notes?: string | null
          pickup_time?: string | null
          qr_code?: string | null
          rental_agreement_signed?: boolean | null
          rental_agreement_url?: string | null
          return_fuel_level?: number | null
          return_kilometers?: number | null
          return_notes?: string | null
          return_time?: string | null
          returned_at?: string | null
          rider_id?: string | null
          scooter_id?: string | null
          shop_id?: string | null
          start_date?: string
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          total_days?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_bookings_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_bookings_scooter_id_fkey"
            columns: ["scooter_id"]
            isOneToOne: false
            referencedRelation: "scooter_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_bookings_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_offers: {
        Row: {
          availability_post_id: string
          created_at: string
          id: string
          message: string | null
          rider_id: string
          status: string
        }
        Insert: {
          availability_post_id: string
          created_at?: string
          id?: string
          message?: string | null
          rider_id: string
          status?: string
        }
        Update: {
          availability_post_id?: string
          created_at?: string
          id?: string
          message?: string | null
          rider_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_offers_availability_post_id_fkey"
            columns: ["availability_post_id"]
            isOneToOne: false
            referencedRelation: "availability_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_offers_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_participants: {
        Row: {
          id: string
          joined_at: string | null
          ride_id: string
          rider_id: string
          status: string | null
        }
        Insert: {
          id?: string
          joined_at?: string | null
          ride_id: string
          rider_id: string
          status?: string | null
        }
        Update: {
          id?: string
          joined_at?: string | null
          ride_id?: string
          rider_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ride_participants_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "group_rides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_participants_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_photos: {
        Row: {
          created_at: string | null
          id: string
          message_id: string | null
          photo_url: string
          ride_id: string
          uploader_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id?: string | null
          photo_url: string
          ride_id: string
          uploader_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string | null
          photo_url?: string
          ride_id?: string
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_photos_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_photos_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "group_rides"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_connections: {
        Row: {
          connected_at: string | null
          connected_rider_id: string
          connection_context: string | null
          connection_method: string | null
          context_id: string | null
          id: string
          rider_id: string
          status: string
        }
        Insert: {
          connected_at?: string | null
          connected_rider_id: string
          connection_context?: string | null
          connection_method?: string | null
          context_id?: string | null
          id?: string
          rider_id: string
          status?: string
        }
        Update: {
          connected_at?: string | null
          connected_rider_id?: string
          connection_context?: string | null
          connection_method?: string | null
          context_id?: string | null
          id?: string
          rider_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "rider_connections_connected_rider_id_fkey"
            columns: ["connected_rider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rider_connections_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_locations: {
        Row: {
          accuracy: number | null
          geog: unknown
          id: string
          is_visible: boolean | null
          latitude: number
          longitude: number
          rider_id: string
          updated_at: string | null
        }
        Insert: {
          accuracy?: number | null
          geog?: unknown
          id?: string
          is_visible?: boolean | null
          latitude: number
          longitude: number
          rider_id: string
          updated_at?: string | null
        }
        Update: {
          accuracy?: number | null
          geog?: unknown
          id?: string
          is_visible?: boolean | null
          latitude?: number
          longitude?: number
          rider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rider_locations_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_permits: {
        Row: {
          country: string
          country_code: string
          created_at: string | null
          expiry_date: string
          id: string
          issued_date: string
          payment_amount: number | null
          payment_status: string
          permit_number: string
          rider_id: string
          status: string
          updated_at: string | null
          verification_url: string
        }
        Insert: {
          country: string
          country_code: string
          created_at?: string | null
          expiry_date: string
          id?: string
          issued_date?: string
          payment_amount?: number | null
          payment_status?: string
          permit_number: string
          rider_id: string
          status?: string
          updated_at?: string | null
          verification_url: string
        }
        Update: {
          country?: string
          country_code?: string
          created_at?: string | null
          expiry_date?: string
          id?: string
          issued_date?: string
          payment_amount?: number | null
          payment_status?: string
          permit_number?: string
          rider_id?: string
          status?: string
          updated_at?: string | null
          verification_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "rider_permits_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      room_beds: {
        Row: {
          bed_index: number
          bed_name: string
          created_at: string
          id: string
          is_active: boolean
          needs_cleaning: boolean
          room_type_id: string
        }
        Insert: {
          bed_index: number
          bed_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          needs_cleaning?: boolean
          room_type_id: string
        }
        Update: {
          bed_index?: number
          bed_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          needs_cleaning?: boolean
          room_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_beds_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      room_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_private: boolean
          name: string
          property_id: string
          total_beds: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_private?: boolean
          name: string
          property_id: string
          total_beds?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_private?: boolean
          name?: string
          property_id?: string
          total_beds?: number
        }
        Relationships: [
          {
            foreignKeyName: "room_types_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      scooter_inventory: {
        Row: {
          available: boolean | null
          brand: string
          color: string | null
          condition: string | null
          created_at: string | null
          daily_rate: number
          engine_size: number | null
          features: Json | null
          fuel_type: string | null
          id: string
          image_url: string | null
          last_service_date: string | null
          license_plate: string | null
          model: string
          monthly_rate: number | null
          scooter_number: string
          shop_id: string | null
          total_kilometers: number | null
          transmission: string | null
          updated_at: string | null
          weekly_rate: number | null
          year: number | null
        }
        Insert: {
          available?: boolean | null
          brand: string
          color?: string | null
          condition?: string | null
          created_at?: string | null
          daily_rate: number
          engine_size?: number | null
          features?: Json | null
          fuel_type?: string | null
          id?: string
          image_url?: string | null
          last_service_date?: string | null
          license_plate?: string | null
          model: string
          monthly_rate?: number | null
          scooter_number: string
          shop_id?: string | null
          total_kilometers?: number | null
          transmission?: string | null
          updated_at?: string | null
          weekly_rate?: number | null
          year?: number | null
        }
        Update: {
          available?: boolean | null
          brand?: string
          color?: string | null
          condition?: string | null
          created_at?: string | null
          daily_rate?: number
          engine_size?: number | null
          features?: Json | null
          fuel_type?: string | null
          id?: string
          image_url?: string | null
          last_service_date?: string | null
          license_plate?: string | null
          model?: string
          monthly_rate?: number | null
          scooter_number?: string
          shop_id?: string | null
          total_kilometers?: number | null
          transmission?: string | null
          updated_at?: string | null
          weekly_rate?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scooter_inventory_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string
          created_at: string | null
          currency: string | null
          description: string | null
          display_order: number | null
          duration_days: number | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          max_capacity: number | null
          metadata: Json | null
          name: string
          org_id: string
          price_thb: number
          price_usd: number | null
          requires_time_slot: boolean | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          duration_days?: number | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_capacity?: number | null
          metadata?: Json | null
          name: string
          org_id: string
          price_thb: number
          price_usd?: number | null
          requires_time_slot?: boolean | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          duration_days?: number | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_capacity?: number | null
          metadata?: Json | null
          name?: string
          org_id?: string
          price_thb?: number
          price_usd?: number | null
          requires_time_slot?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shadow_learning: {
        Row: {
          confidence_score: number
          created_at: string
          id: string
          issue_type: string
          last_updated: string
          property_id: string
          total_accepted: number
          total_rejected: number
        }
        Insert: {
          confidence_score?: number
          created_at?: string
          id?: string
          issue_type: string
          last_updated?: string
          property_id: string
          total_accepted?: number
          total_rejected?: number
        }
        Update: {
          confidence_score?: number
          created_at?: string
          id?: string
          issue_type?: string
          last_updated?: string
          property_id?: string
          total_accepted?: number
          total_rejected?: number
        }
        Relationships: [
          {
            foreignKeyName: "shadow_learning_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      shadow_memories: {
        Row: {
          approved: boolean
          approved_by: string | null
          category: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          property_id: string
        }
        Insert: {
          approved?: boolean
          approved_by?: string | null
          category: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          property_id: string
        }
        Update: {
          approved?: boolean
          approved_by?: string | null
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shadow_memories_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      shadow_preferences: {
        Row: {
          created_at: string
          hits: number
          id: string
          last_used: string | null
          pattern_json: Json
          pattern_type: string
          property_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          hits?: number
          id?: string
          last_used?: string | null
          pattern_json?: Json
          pattern_type: string
          property_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          hits?: number
          id?: string
          last_used?: string | null
          pattern_json?: Json
          pattern_type?: string
          property_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "shadow_preferences_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      shadow_settings: {
        Row: {
          assignment_mode: Database["public"]["Enums"]["sc_assignment_mode"]
          automation_mode: Database["public"]["Enums"]["sc_automation_mode"]
          property_id: string
          updated_at: string
        }
        Insert: {
          assignment_mode?: Database["public"]["Enums"]["sc_assignment_mode"]
          automation_mode?: Database["public"]["Enums"]["sc_automation_mode"]
          property_id: string
          updated_at?: string
        }
        Update: {
          assignment_mode?: Database["public"]["Enums"]["sc_assignment_mode"]
          automation_mode?: Database["public"]["Enums"]["sc_automation_mode"]
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shadow_settings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      shadow_submissions: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          property_id: string
          status: Database["public"]["Enums"]["sc_submission_status"]
          submitted_by: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          property_id: string
          status?: Database["public"]["Enums"]["sc_submission_status"]
          submitted_by?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          property_id?: string
          status?: Database["public"]["Enums"]["sc_submission_status"]
          submitted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shadow_submissions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_profiles: {
        Row: {
          business_hours: Json | null
          business_license: string | null
          created_at: string | null
          description: string | null
          email: string
          id: string
          is_active: boolean | null
          location: string | null
          owner_name: string
          phone: string | null
          shop_name: string | null
          updated_at: string | null
          verification_status: string | null
        }
        Insert: {
          business_hours?: Json | null
          business_license?: string | null
          created_at?: string | null
          description?: string | null
          email: string
          id: string
          is_active?: boolean | null
          location?: string | null
          owner_name: string
          phone?: string | null
          shop_name?: string | null
          updated_at?: string | null
          verification_status?: string | null
        }
        Update: {
          business_hours?: Json | null
          business_license?: string | null
          created_at?: string | null
          description?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          owner_name?: string
          phone?: string | null
          shop_name?: string | null
          updated_at?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
      shops: {
        Row: {
          accept_bank_transfer: boolean | null
          accept_card: boolean | null
          accept_cash: boolean | null
          accept_mobile_payment: boolean | null
          active: boolean | null
          address: string
          city: string
          country: string
          created_at: string | null
          currency: string | null
          default_daily_rate: number | null
          default_deposit: number | null
          default_hourly_rate: number | null
          default_weekly_rate: number | null
          description: string | null
          email: string | null
          email_notifications: boolean | null
          id: string
          latitude: number
          longitude: number
          name: string
          notify_low_fuel: boolean | null
          notify_new_messages: boolean | null
          notify_payment_received: boolean | null
          notify_rental_due: boolean | null
          notify_rental_overdue: boolean | null
          notify_scooter_maintenance: boolean | null
          onboarding_completed: boolean | null
          opening_hours: Json | null
          owner_id: string | null
          phone: string | null
          push_notifications: boolean | null
          rating: number | null
          rental_terms: string | null
          sms_notifications: boolean | null
          timezone: string
          total_reviews: number | null
          updated_at: string | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          accept_bank_transfer?: boolean | null
          accept_card?: boolean | null
          accept_cash?: boolean | null
          accept_mobile_payment?: boolean | null
          active?: boolean | null
          address: string
          city: string
          country: string
          created_at?: string | null
          currency?: string | null
          default_daily_rate?: number | null
          default_deposit?: number | null
          default_hourly_rate?: number | null
          default_weekly_rate?: number | null
          description?: string | null
          email?: string | null
          email_notifications?: boolean | null
          id?: string
          latitude: number
          longitude: number
          name: string
          notify_low_fuel?: boolean | null
          notify_new_messages?: boolean | null
          notify_payment_received?: boolean | null
          notify_rental_due?: boolean | null
          notify_rental_overdue?: boolean | null
          notify_scooter_maintenance?: boolean | null
          onboarding_completed?: boolean | null
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          push_notifications?: boolean | null
          rating?: number | null
          rental_terms?: string | null
          sms_notifications?: boolean | null
          timezone?: string
          total_reviews?: number | null
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          accept_bank_transfer?: boolean | null
          accept_card?: boolean | null
          accept_cash?: boolean | null
          accept_mobile_payment?: boolean | null
          active?: boolean | null
          address?: string
          city?: string
          country?: string
          created_at?: string | null
          currency?: string | null
          default_daily_rate?: number | null
          default_deposit?: number | null
          default_hourly_rate?: number | null
          default_weekly_rate?: number | null
          description?: string | null
          email?: string | null
          email_notifications?: boolean | null
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          notify_low_fuel?: boolean | null
          notify_new_messages?: boolean | null
          notify_payment_received?: boolean | null
          notify_rental_due?: boolean | null
          notify_rental_overdue?: boolean | null
          notify_scooter_maintenance?: boolean | null
          onboarding_completed?: boolean | null
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          push_notifications?: boolean | null
          rating?: number | null
          rental_terms?: string | null
          sms_notifications?: boolean | null
          timezone?: string
          total_reviews?: number | null
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shops_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_signoffs: {
        Row: {
          created_at: string
          id: string
          level: string
          notes: string | null
          org_id: string
          signed_off_at: string
          signed_off_by: string
          skill_index: number
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level: string
          notes?: string | null
          org_id: string
          signed_off_at?: string
          signed_off_by: string
          skill_index: number
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          notes?: string | null
          org_id?: string
          signed_off_at?: string
          signed_off_by?: string
          skill_index?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_signoffs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_signoffs_signed_off_by_fkey"
            columns: ["signed_off_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_signoffs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_submissions: {
        Row: {
          created_at: string
          decided_at: string | null
          id: string
          level: string
          org_id: string
          reviewer_id: string | null
          reviewer_notes: string | null
          skill_index: number
          status: string
          student_id: string
          student_notes: string | null
          updated_at: string
          video_url: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          id?: string
          level: string
          org_id: string
          reviewer_id?: string | null
          reviewer_notes?: string | null
          skill_index: number
          status?: string
          student_id: string
          student_notes?: string | null
          updated_at?: string
          video_url: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          id?: string
          level?: string
          org_id?: string
          reviewer_id?: string | null
          reviewer_notes?: string | null
          skill_index?: number
          status?: string
          student_id?: string
          student_notes?: string | null
          updated_at?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_submissions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_submissions_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          access_token: string | null
          account_id: string | null
          account_name: string
          connected_at: string | null
          connected_by: string | null
          id: string
          is_active: boolean | null
          org_id: string | null
          platform: string
          token_expires_at: string | null
        }
        Insert: {
          access_token?: string | null
          account_id?: string | null
          account_name: string
          connected_at?: string | null
          connected_by?: string | null
          id?: string
          is_active?: boolean | null
          org_id?: string | null
          platform: string
          token_expires_at?: string | null
        }
        Update: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string
          connected_at?: string | null
          connected_by?: string | null
          id?: string
          is_active?: boolean | null
          org_id?: string | null
          platform?: string
          token_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_connected_by_fkey"
            columns: ["connected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          ai_generated: boolean | null
          ai_prompt: string | null
          campaign: string | null
          caption: string | null
          content: Json
          content_type: string | null
          created_at: string | null
          created_by: string | null
          engagement_notes: string | null
          hashtags: string[] | null
          id: string
          media_url: string | null
          org_id: string | null
          platform: string[] | null
          platforms: string[]
          posted_at: string | null
          published_at: string | null
          scheduled_for: string | null
          source: string
          source_intent: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          ai_prompt?: string | null
          campaign?: string | null
          caption?: string | null
          content?: Json
          content_type?: string | null
          created_at?: string | null
          created_by?: string | null
          engagement_notes?: string | null
          hashtags?: string[] | null
          id?: string
          media_url?: string | null
          org_id?: string | null
          platform?: string[] | null
          platforms?: string[]
          posted_at?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          source?: string
          source_intent?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          ai_prompt?: string | null
          campaign?: string | null
          caption?: string | null
          content?: Json
          content_type?: string | null
          created_at?: string | null
          created_by?: string | null
          engagement_notes?: string | null
          hashtags?: string[] | null
          id?: string
          media_url?: string | null
          org_id?: string | null
          platform?: string[] | null
          platforms?: string[]
          posted_at?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          source?: string
          source_intent?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_events: {
        Row: {
          created_at: string
          event_payload: Json | null
          event_type: string
          id: string
          property_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_payload?: Json | null
          event_type: string
          id?: string
          property_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_payload?: Json | null
          event_type?: string
          id?: string
          property_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      student_credits: {
        Row: {
          created_at: string | null
          credit_type: string
          credits_remaining: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          org_id: string
          package_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credit_type?: string
          credits_remaining?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          org_id: string
          package_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credit_type?: string
          credits_remaining?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          org_id?: string
          package_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_credits_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_credits_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "gym_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_notes: {
        Row: {
          booking_id: string | null
          content: string
          content_language: string | null
          content_translated: string | null
          created_at: string | null
          id: string
          note_type: string | null
          org_id: string
          sentiment: string | null
          student_id: string
          summary: string | null
          tags: string[] | null
          trainer_id: string | null
        }
        Insert: {
          booking_id?: string | null
          content: string
          content_language?: string | null
          content_translated?: string | null
          created_at?: string | null
          id?: string
          note_type?: string | null
          org_id: string
          sentiment?: string | null
          student_id: string
          summary?: string | null
          tags?: string[] | null
          trainer_id?: string | null
        }
        Update: {
          booking_id?: string | null
          content?: string
          content_language?: string | null
          content_translated?: string | null
          created_at?: string | null
          id?: string
          note_type?: string | null
          org_id?: string
          sentiment?: string | null
          student_id?: string
          summary?: string | null
          tags?: string[] | null
          trainer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_notes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_notes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_notes_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_subscriptions: {
        Row: {
          billing_cycle: string | null
          cancelled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          price_thb: number
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_cycle?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          price_thb?: number
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_cycle?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          price_thb?: number
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      student_waiver_signatures: {
        Row: {
          id: string
          ip_address: string | null
          org_id: string
          signed_at: string
          signed_name: string
          user_agent: string | null
          user_id: string
          waiver_id: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          org_id: string
          signed_at?: string
          signed_name: string
          user_agent?: string | null
          user_id: string
          waiver_id: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          org_id?: string
          signed_at?: string
          signed_name?: string
          user_agent?: string | null
          user_id?: string
          waiver_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_waiver_signatures_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_waiver_signatures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_waiver_signatures_waiver_id_fkey"
            columns: ["waiver_id"]
            isOneToOne: false
            referencedRelation: "org_waivers"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          ai_summary: string | null
          category: string | null
          conversation_id: string | null
          created_at: string
          id: string
          initial_body: string
          org_id: string
          priority: string | null
          resolution_summary: string | null
          resolved_at: string | null
          resolved_by: string | null
          sla_due_at: string | null
          source_url: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_summary?: string | null
          category?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          initial_body: string
          org_id: string
          priority?: string | null
          resolution_summary?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sla_due_at?: string | null
          source_url?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_summary?: string | null
          category?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          initial_body?: string
          org_id?: string
          priority?: string | null
          resolution_summary?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sla_due_at?: string | null
          source_url?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "mtp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          accepted_at: string | null
          email: string
          id: string
          invitation_token: string | null
          invited_at: string
          name: string
          property_id: string
          role: Database["public"]["Enums"]["sc_team_role"]
          status: Database["public"]["Enums"]["sc_team_status"]
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          email: string
          id?: string
          invitation_token?: string | null
          invited_at?: string
          name: string
          property_id: string
          role?: Database["public"]["Enums"]["sc_team_role"]
          status?: Database["public"]["Enums"]["sc_team_status"]
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          email?: string
          id?: string
          invitation_token?: string | null
          invited_at?: string
          name?: string
          property_id?: string
          role?: Database["public"]["Enums"]["sc_team_role"]
          status?: Database["public"]["Enums"]["sc_team_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      team_messages: {
        Row: {
          category: string | null
          created_at: string
          id: string
          message_text: string
          property_id: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          message_text: string
          property_id: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          message_text?: string
          property_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_messages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_interest: {
        Row: {
          created_at: string
          email: string
          email_lower: string
          event_id: string
          id: string
          notified_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          email_lower: string
          event_id: string
          id?: string
          notified_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          email_lower?: string
          event_id?: string
          id?: string
          notified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_interest_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "fight_events"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_orders: {
        Row: {
          created_at: string
          event_id: string
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          order_reference: string | null
          payment_method: string | null
          payment_status: string
          quantity: number
          reminder_sent_at: string | null
          scan_count: number
          scanned_at: string | null
          scanned_by_user_id: string | null
          status: string
          stripe_payment_intent_id: string | null
          ticket_id: string
          total_price_thb: number
          total_price_usd: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          order_reference?: string | null
          payment_method?: string | null
          payment_status?: string
          quantity?: number
          reminder_sent_at?: string | null
          scan_count?: number
          scanned_at?: string | null
          scanned_by_user_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          ticket_id: string
          total_price_thb: number
          total_price_usd?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          order_reference?: string | null
          payment_method?: string | null
          payment_status?: string
          quantity?: number
          reminder_sent_at?: string | null
          scan_count?: number
          scanned_at?: string | null
          scanned_by_user_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          ticket_id?: string
          total_price_thb?: number
          total_price_usd?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "fight_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_orders_scanned_by_user_id_fkey"
            columns: ["scanned_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_orders_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "event_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      time_slots: {
        Row: {
          created_at: string | null
          day_of_week: number | null
          end_time: string | null
          id: string
          is_active: boolean | null
          max_bookings: number | null
          org_id: string
          service_id: string | null
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          max_bookings?: number | null
          org_id: string
          service_id?: string | null
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          max_bookings?: number | null
          org_id?: string
          service_id?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_slots_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_slots_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      tourist_profiles: {
        Row: {
          created_at: string
          date_of_birth: string | null
          first_seen_at: string
          full_name: string
          gender: Database["public"]["Enums"]["sc_gender"] | null
          id: string
          last_seen_at: string
          nationality: string | null
          occupation: string | null
          passport_expiry: string | null
          passport_image_url: string | null
          passport_number: string
          port_of_entry: string | null
          purpose_of_visit: string | null
          total_checkins: number
          updated_at: string
          visa_expiry_date: string | null
          visa_issue_date: string | null
          visa_type: string | null
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          first_seen_at?: string
          full_name: string
          gender?: Database["public"]["Enums"]["sc_gender"] | null
          id?: string
          last_seen_at?: string
          nationality?: string | null
          occupation?: string | null
          passport_expiry?: string | null
          passport_image_url?: string | null
          passport_number: string
          port_of_entry?: string | null
          purpose_of_visit?: string | null
          total_checkins?: number
          updated_at?: string
          visa_expiry_date?: string | null
          visa_issue_date?: string | null
          visa_type?: string | null
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          first_seen_at?: string
          full_name?: string
          gender?: Database["public"]["Enums"]["sc_gender"] | null
          id?: string
          last_seen_at?: string
          nationality?: string | null
          occupation?: string | null
          passport_expiry?: string | null
          passport_image_url?: string | null
          passport_number?: string
          port_of_entry?: string | null
          purpose_of_visit?: string | null
          total_checkins?: number
          updated_at?: string
          visa_expiry_date?: string | null
          visa_issue_date?: string | null
          visa_type?: string | null
        }
        Relationships: []
      }
      trainer_commission_rules: {
        Row: {
          created_at: string
          effective_from: string
          effective_to: string | null
          flat_amount_thb: number | null
          id: string
          is_active: boolean
          only_completed: boolean
          org_id: string
          pay_for_no_show: boolean
          percent_of_revenue: number | null
          rule_type: string
          service_id: string | null
          trainer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          flat_amount_thb?: number | null
          id?: string
          is_active?: boolean
          only_completed?: boolean
          org_id: string
          pay_for_no_show?: boolean
          percent_of_revenue?: number | null
          rule_type: string
          service_id?: string | null
          trainer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          flat_amount_thb?: number | null
          id?: string
          is_active?: boolean
          only_completed?: boolean
          org_id?: string
          pay_for_no_show?: boolean
          percent_of_revenue?: number | null
          rule_type?: string
          service_id?: string | null
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_commission_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_commission_rules_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_commission_rules_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_payouts: {
        Row: {
          breakdown: Json | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          org_id: string
          paid_at: string | null
          payment_method: string | null
          period_end: string
          period_start: string
          status: string
          total_amount_thb: number
          total_sessions: number
          trainer_id: string
          updated_at: string
        }
        Insert: {
          breakdown?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          org_id: string
          paid_at?: string | null
          payment_method?: string | null
          period_end: string
          period_start: string
          status?: string
          total_amount_thb?: number
          total_sessions?: number
          trainer_id: string
          updated_at?: string
        }
        Update: {
          breakdown?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          paid_at?: string | null
          payment_method?: string | null
          period_end?: string
          period_start?: string
          status?: string
          total_amount_thb?: number
          total_sessions?: number
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_payouts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_payouts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_payouts_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_profiles: {
        Row: {
          availability_note: string | null
          bio: string | null
          created_at: string | null
          display_name: string
          display_order: number | null
          fight_record_draws: number | null
          fight_record_losses: number | null
          fight_record_wins: number | null
          fighter_country: string | null
          height_cm: number | null
          id: string
          is_available: boolean | null
          is_featured: boolean | null
          ock_ock_id: string | null
          open_to_events: boolean | null
          open_to_fights: boolean | null
          org_id: string
          photo_url: string | null
          photos: string[] | null
          reach_cm: number | null
          specialties: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string
          video_url: string | null
          weight_class: string | null
          weight_kg: number | null
          years_experience: number | null
        }
        Insert: {
          availability_note?: string | null
          bio?: string | null
          created_at?: string | null
          display_name: string
          display_order?: number | null
          fight_record_draws?: number | null
          fight_record_losses?: number | null
          fight_record_wins?: number | null
          fighter_country?: string | null
          height_cm?: number | null
          id?: string
          is_available?: boolean | null
          is_featured?: boolean | null
          ock_ock_id?: string | null
          open_to_events?: boolean | null
          open_to_fights?: boolean | null
          org_id: string
          photo_url?: string | null
          photos?: string[] | null
          reach_cm?: number | null
          specialties?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          video_url?: string | null
          weight_class?: string | null
          weight_kg?: number | null
          years_experience?: number | null
        }
        Update: {
          availability_note?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string
          display_order?: number | null
          fight_record_draws?: number | null
          fight_record_losses?: number | null
          fight_record_wins?: number | null
          fighter_country?: string | null
          height_cm?: number | null
          id?: string
          is_available?: boolean | null
          is_featured?: boolean | null
          ock_ock_id?: string | null
          open_to_events?: boolean | null
          open_to_fights?: boolean | null
          org_id?: string
          photo_url?: string | null
          photos?: string[] | null
          reach_cm?: number | null
          specialties?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
          weight_class?: string | null
          weight_kg?: number | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trainer_profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          payment_metadata: Json | null
          payment_method: string | null
          processed_at: string | null
          processed_by: string | null
          rider_id: string | null
          shop_id: string | null
          status: string | null
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          transaction_number: string
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_metadata?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          rider_id?: string | null
          shop_id?: string | null
          status?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          transaction_number: string
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_metadata?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          rider_id?: string | null
          shop_id?: string | null
          status?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          transaction_number?: string
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "rental_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          display_name: string | null
          email: string
          full_name: string | null
          id: string
          is_platform_admin: boolean | null
          is_verified_examiner: boolean
          nationality: string | null
          notification_email: boolean | null
          notification_sms: boolean | null
          notification_whatsapp: boolean | null
          phone: string | null
          platform_admin_role: string
          preferred_language: string | null
          public_instructor_bio: string | null
          public_instructor_enabled: boolean
          public_instructor_handle: string | null
          public_passport_bio: string | null
          public_passport_enabled: boolean
          public_passport_handle: string | null
          updated_at: string | null
          verified_examiner_at: string | null
          verified_examiner_by: string | null
          verified_examiner_by_user_id: string | null
          verified_examiner_note: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          display_name?: string | null
          email: string
          full_name?: string | null
          id: string
          is_platform_admin?: boolean | null
          is_verified_examiner?: boolean
          nationality?: string | null
          notification_email?: boolean | null
          notification_sms?: boolean | null
          notification_whatsapp?: boolean | null
          phone?: string | null
          platform_admin_role?: string
          preferred_language?: string | null
          public_instructor_bio?: string | null
          public_instructor_enabled?: boolean
          public_instructor_handle?: string | null
          public_passport_bio?: string | null
          public_passport_enabled?: boolean
          public_passport_handle?: string | null
          updated_at?: string | null
          verified_examiner_at?: string | null
          verified_examiner_by?: string | null
          verified_examiner_by_user_id?: string | null
          verified_examiner_note?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          display_name?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_platform_admin?: boolean | null
          is_verified_examiner?: boolean
          nationality?: string | null
          notification_email?: boolean | null
          notification_sms?: boolean | null
          notification_whatsapp?: boolean | null
          phone?: string | null
          platform_admin_role?: string
          preferred_language?: string | null
          public_instructor_bio?: string | null
          public_instructor_enabled?: boolean
          public_instructor_handle?: string | null
          public_passport_bio?: string | null
          public_passport_enabled?: boolean
          public_passport_handle?: string | null
          updated_at?: string | null
          verified_examiner_at?: string | null
          verified_examiner_by?: string | null
          verified_examiner_by_user_id?: string | null
          verified_examiner_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_verified_examiner_by_fkey"
            columns: ["verified_examiner_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_verified_examiner_by_user_id_fkey"
            columns: ["verified_examiner_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_history: {
        Row: {
          created_at: string | null
          id: string
          match_confidence: number | null
          passport_number: string | null
          user_id: string
          verification_method: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_confidence?: number | null
          passport_number?: string | null
          user_id: string
          verification_method?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          match_confidence?: number | null
          passport_number?: string | null
          user_id?: string
          verification_method?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      northcrest_vendor_category_signals: {
        Row: {
          category: string | null
          observations: number | null
          score: number | null
          vendor_norm: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      expire_completed_rides: { Args: never; Returns: undefined }
      expire_old_posts: { Args: never; Returns: undefined }
      factory_is_project_owner: { Args: { p: string }; Returns: boolean }
      generate_booking_number: { Args: never; Returns: string }
      generate_transaction_number: { Args: never; Returns: string }
      has_org_role: {
        Args: { org_id: string; required_roles: string[] }
        Returns: boolean
      }
      is_org_member: { Args: { org_id: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      nearby_rider_ids: {
        Args: {
          p_exclude_rider_id?: string
          p_lat: number
          p_lng: number
          p_radius_km?: number
        }
        Returns: {
          distance_km: number
          rider_id: string
        }[]
      }
      northcrest_is_admin: { Args: never; Returns: boolean }
      northcrest_is_social_or_admin: { Args: never; Returns: boolean }
      northcrest_normalize_vendor: { Args: { raw: string }; Returns: string }
      sc_accept_invitation: { Args: { p_token: string }; Returns: string }
      sc_reject_invitation: { Args: { p_token: string }; Returns: boolean }
      sc_user_has_property_access: {
        Args: { prop_id: string }
        Returns: boolean
      }
      sc_validate_invitation_token: {
        Args: { p_token: string }
        Returns: {
          email: string
          id: string
          name: string
          property_id: string
          status: Database["public"]["Enums"]["sc_team_status"]
        }[]
      }
    }
    Enums: {
      northcrest_expense_category:
        | "gas"
        | "materials"
        | "hardware"
        | "tools"
        | "plants"
        | "chemicals"
        | "food_drink"
        | "parking"
        | "vehicle"
        | "other"
      northcrest_job_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
      northcrest_lead_priority: "hot" | "warm" | "cold"
      northcrest_lead_source:
        | "contact_form"
        | "email"
        | "phone"
        | "referral"
        | "manual"
        | "other"
      northcrest_lead_status:
        | "new"
        | "awaiting_reply"
        | "replied"
        | "won"
        | "lost"
        | "spam"
      northcrest_receipt_status: "pending" | "reviewed" | "rejected"
      northcrest_role: "admin" | "employee" | "social"
      sc_assignment_mode: "latest-wins" | "earliest-wins"
      sc_automation_mode: "manual" | "semi" | "auto"
      sc_chat_group_status: "pending" | "active" | "paused" | "archived"
      sc_chat_member_role: "owner" | "manager" | "staff" | "unknown"
      sc_chat_ota_draft_kind: "close_dates" | "open_dates"
      sc_chat_ota_draft_status:
        | "pending"
        | "approved"
        | "applied"
        | "failed"
        | "rejected"
        | "expired"
      sc_chat_passport_draft_status:
        | "pending"
        | "applied"
        | "rejected"
        | "expired"
        | "failed"
      sc_chat_platform: "telegram" | "whatsapp" | "line"
      sc_chat_sender_type: "staff" | "shadow" | "system"
      sc_cron_status: "running" | "success" | "partial" | "failed"
      sc_email_provider: "gmail" | "outlook"
      sc_email_status: "pending" | "connected" | "error" | "disconnected"
      sc_gender: "male" | "female" | "other"
      sc_guest_status: "active" | "departed"
      sc_language_preference: "en" | "lo"
      sc_ota_account_status: "pending" | "connected" | "disconnected" | "error"
      sc_ota_command:
        | "verify_credentials"
        | "fetch_bookings"
        | "update_inventory"
        | "sync_rates"
        | "close_dates"
        | "open_dates"
      sc_ota_conversation_status: "open" | "closed" | "archived"
      sc_ota_credential_status: "untested" | "valid" | "invalid"
      sc_ota_draft_source: "staff" | "shadow" | "template"
      sc_ota_job_status: "pending" | "processing" | "success" | "error"
      sc_ota_job_type:
        | "verify"
        | "sync_inventory"
        | "sync_bookings"
        | "update_rates"
        | "close_dates"
      sc_ota_log_status: "pending" | "running" | "success" | "failed"
      sc_ota_message_direction: "inbound" | "outbound"
      sc_ota_message_status: "delivered" | "pending" | "failed" | "read"
      sc_ota_platform:
        | "booking"
        | "agoda"
        | "hostelworld"
        | "airbnb"
        | "expedia"
      sc_ota_sender_type: "guest" | "staff" | "ota" | "shadow"
      sc_print_status: "printed" | "not-printed"
      sc_property_type: "guesthouse" | "hostel" | "hotel" | "homestay"
      sc_submission_status: "pending" | "approved" | "rejected"
      sc_subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "trial_expired"
      sc_team_role: "Owner" | "Manager" | "Staff"
      sc_team_status: "pending" | "active" | "inactive" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      northcrest_expense_category: [
        "gas",
        "materials",
        "hardware",
        "tools",
        "plants",
        "chemicals",
        "food_drink",
        "parking",
        "vehicle",
        "other",
      ],
      northcrest_job_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ],
      northcrest_lead_priority: ["hot", "warm", "cold"],
      northcrest_lead_source: [
        "contact_form",
        "email",
        "phone",
        "referral",
        "manual",
        "other",
      ],
      northcrest_lead_status: [
        "new",
        "awaiting_reply",
        "replied",
        "won",
        "lost",
        "spam",
      ],
      northcrest_receipt_status: ["pending", "reviewed", "rejected"],
      northcrest_role: ["admin", "employee", "social"],
      sc_assignment_mode: ["latest-wins", "earliest-wins"],
      sc_automation_mode: ["manual", "semi", "auto"],
      sc_chat_group_status: ["pending", "active", "paused", "archived"],
      sc_chat_member_role: ["owner", "manager", "staff", "unknown"],
      sc_chat_ota_draft_kind: ["close_dates", "open_dates"],
      sc_chat_ota_draft_status: [
        "pending",
        "approved",
        "applied",
        "failed",
        "rejected",
        "expired",
      ],
      sc_chat_passport_draft_status: [
        "pending",
        "applied",
        "rejected",
        "expired",
        "failed",
      ],
      sc_chat_platform: ["telegram", "whatsapp", "line"],
      sc_chat_sender_type: ["staff", "shadow", "system"],
      sc_cron_status: ["running", "success", "partial", "failed"],
      sc_email_provider: ["gmail", "outlook"],
      sc_email_status: ["pending", "connected", "error", "disconnected"],
      sc_gender: ["male", "female", "other"],
      sc_guest_status: ["active", "departed"],
      sc_language_preference: ["en", "lo"],
      sc_ota_account_status: ["pending", "connected", "disconnected", "error"],
      sc_ota_command: [
        "verify_credentials",
        "fetch_bookings",
        "update_inventory",
        "sync_rates",
        "close_dates",
        "open_dates",
      ],
      sc_ota_conversation_status: ["open", "closed", "archived"],
      sc_ota_credential_status: ["untested", "valid", "invalid"],
      sc_ota_draft_source: ["staff", "shadow", "template"],
      sc_ota_job_status: ["pending", "processing", "success", "error"],
      sc_ota_job_type: [
        "verify",
        "sync_inventory",
        "sync_bookings",
        "update_rates",
        "close_dates",
      ],
      sc_ota_log_status: ["pending", "running", "success", "failed"],
      sc_ota_message_direction: ["inbound", "outbound"],
      sc_ota_message_status: ["delivered", "pending", "failed", "read"],
      sc_ota_platform: ["booking", "agoda", "hostelworld", "airbnb", "expedia"],
      sc_ota_sender_type: ["guest", "staff", "ota", "shadow"],
      sc_print_status: ["printed", "not-printed"],
      sc_property_type: ["guesthouse", "hostel", "hotel", "homestay"],
      sc_submission_status: ["pending", "approved", "rejected"],
      sc_subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "trial_expired",
      ],
      sc_team_role: ["Owner", "Manager", "Staff"],
      sc_team_status: ["pending", "active", "inactive", "rejected"],
    },
  },
} as const
