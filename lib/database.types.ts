export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          donor_email: string | null
          donor_name: string | null
          id: string
          profile_id: string | null
          stripe_checkout_session_id: string | null
          stripe_customer_id: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          receipt_email_id: string | null
          receipt_error: string | null
          receipt_sent_at: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          donor_email?: string | null
          donor_name?: string | null
          id?: string
          profile_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          receipt_email_id?: string | null
          receipt_error?: string | null
          receipt_sent_at?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          donor_email?: string | null
          donor_name?: string | null
          id?: string
          profile_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          receipt_email_id?: string | null
          receipt_error?: string | null
          receipt_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          followee_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followee_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followee_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_consents: {
        Row: {
          accepted_at: string
          document_key: string
          document_version: string
          id: string
          ip_hash: string | null
          profile_id: string | null
          user_agent: string | null
        }
        Insert: {
          accepted_at?: string
          document_key: string
          document_version: string
          id?: string
          ip_hash?: string | null
          profile_id?: string | null
          user_agent?: string | null
        }
        Update: {
          accepted_at?: string
          document_key?: string
          document_version?: string
          id?: string
          ip_hash?: string | null
          profile_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_consents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          deleted_at: string | null
          id: string
          offer_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          offer_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          offer_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_events: {
        Row: {
          actor_id: string
          created_at: string
          from_status: Database["public"]["Enums"]["offer_status"] | null
          id: string
          note: string | null
          offer_id: string
          to_status: Database["public"]["Enums"]["offer_status"]
        }
        Insert: {
          actor_id: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["offer_status"] | null
          id?: string
          note?: string | null
          offer_id: string
          to_status: Database["public"]["Enums"]["offer_status"]
        }
        Update: {
          actor_id?: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["offer_status"] | null
          id?: string
          note?: string | null
          offer_id?: string
          to_status?: Database["public"]["Enums"]["offer_status"]
        }
        Relationships: [
          {
            foreignKeyName: "offer_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_events_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string
          id: string
          note: string | null
          offered_item: string
          post_id: string | null
          recipient_id: string
          requested_item: string
          requester_id: string
          requires_approval: boolean
          status: Database["public"]["Enums"]["offer_status"]
          timing: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          offered_item: string
          post_id?: string | null
          recipient_id: string
          requested_item: string
          requester_id: string
          requires_approval?: boolean
          status?: Database["public"]["Enums"]["offer_status"]
          timing?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          offered_item?: string
          post_id?: string | null
          recipient_id?: string
          requested_item?: string
          requester_id?: string
          requires_approval?: boolean
          status?: Database["public"]["Enums"]["offer_status"]
          timing?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_photos: {
        Row: {
          created_at: string
          id: string
          path: string
          position: number
          post_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          position?: number
          post_id: string
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          position?: number
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_photos_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      launch_content_posts: {
        Row: {
          approval_policy: Database["public"]["Enums"]["approval_policy"]
          availability_total: number | null
          availability_unit: string | null
          batch: number
          body: string
          category: Database["public"]["Enums"]["post_category"]
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["post_kind"]
          launch_profile_id: string
          location_mode: Database["public"]["Enums"]["location_mode"]
          looking_for: string | null
          notes: string | null
          source_post_number: number
          status: Database["public"]["Enums"]["launch_content_status"]
          suggested_images: string | null
          title: string
          updated_at: string
          what_i_can_give: string | null
        }
        Insert: {
          approval_policy?: Database["public"]["Enums"]["approval_policy"]
          availability_total?: number | null
          availability_unit?: string | null
          batch?: number
          body: string
          category?: Database["public"]["Enums"]["post_category"]
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["post_kind"]
          launch_profile_id: string
          location_mode?: Database["public"]["Enums"]["location_mode"]
          looking_for?: string | null
          notes?: string | null
          source_post_number: number
          status?: Database["public"]["Enums"]["launch_content_status"]
          suggested_images?: string | null
          title: string
          updated_at?: string
          what_i_can_give?: string | null
        }
        Update: {
          approval_policy?: Database["public"]["Enums"]["approval_policy"]
          availability_total?: number | null
          availability_unit?: string | null
          batch?: number
          body?: string
          category?: Database["public"]["Enums"]["post_category"]
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["post_kind"]
          launch_profile_id?: string
          location_mode?: Database["public"]["Enums"]["location_mode"]
          looking_for?: string | null
          notes?: string | null
          source_post_number?: number
          status?: Database["public"]["Enums"]["launch_content_status"]
          suggested_images?: string | null
          title?: string
          updated_at?: string
          what_i_can_give?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "launch_content_posts_launch_profile_id_fkey"
            columns: ["launch_profile_id"]
            isOneToOne: false
            referencedRelation: "launch_content_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      launch_content_profiles: {
        Row: {
          bio: string
          created_at: string
          display_name: string
          id: string
          interests: string[]
          location_mode: Database["public"]["Enums"]["location_mode"]
          notes: string | null
          public_location_label: string | null
          public_role: string
          setup_email: string
          source_index: number
          status: Database["public"]["Enums"]["launch_content_status"]
          suggested_handle: string
          updated_at: string
        }
        Insert: {
          bio: string
          created_at?: string
          display_name: string
          id?: string
          interests?: string[]
          location_mode?: Database["public"]["Enums"]["location_mode"]
          notes?: string | null
          public_location_label?: string | null
          public_role: string
          setup_email: string
          source_index: number
          status?: Database["public"]["Enums"]["launch_content_status"]
          suggested_handle: string
          updated_at?: string
        }
        Update: {
          bio?: string
          created_at?: string
          display_name?: string
          id?: string
          interests?: string[]
          location_mode?: Database["public"]["Enums"]["location_mode"]
          notes?: string | null
          public_location_label?: string | null
          public_role?: string
          setup_email?: string
          source_index?: number
          status?: Database["public"]["Enums"]["launch_content_status"]
          suggested_handle?: string
          updated_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          approval_policy: Database["public"]["Enums"]["approval_policy"]
          approximate_location_label: string | null
          availability_remaining: number | null
          availability_total: number | null
          availability_unit: string | null
          body: string
          category: Database["public"]["Enums"]["post_category"]
          created_at: string
          expires_at: string | null
          id: string
          kind: Database["public"]["Enums"]["post_kind"]
          location: unknown
          location_mode: Database["public"]["Enums"]["location_mode"]
          looking_for: string | null
          owner_id: string
          search_vector: unknown
          status: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at: string
          what_i_can_give: string | null
        }
        Insert: {
          approval_policy?: Database["public"]["Enums"]["approval_policy"]
          approximate_location_label?: string | null
          availability_remaining?: number | null
          availability_total?: number | null
          availability_unit?: string | null
          body: string
          category: Database["public"]["Enums"]["post_category"]
          created_at?: string
          expires_at?: string | null
          id?: string
          kind: Database["public"]["Enums"]["post_kind"]
          location?: unknown
          location_mode?: Database["public"]["Enums"]["location_mode"]
          looking_for?: string | null
          owner_id: string
          search_vector?: unknown
          status?: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at?: string
          what_i_can_give?: string | null
        }
        Update: {
          approval_policy?: Database["public"]["Enums"]["approval_policy"]
          approximate_location_label?: string | null
          availability_remaining?: number | null
          availability_total?: number | null
          availability_unit?: string | null
          body?: string
          category?: Database["public"]["Enums"]["post_category"]
          created_at?: string
          expires_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["post_kind"]
          location?: unknown
          location_mode?: Database["public"]["Enums"]["location_mode"]
          looking_for?: string | null
          owner_id?: string
          search_vector?: unknown
          status?: Database["public"]["Enums"]["post_status"]
          title?: string
          updated_at?: string
          what_i_can_give?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_interests: {
        Row: {
          label: string
          profile_id: string
        }
        Insert: {
          label: string
          profile_id: string
        }
        Update: {
          label?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_interests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_private: {
        Row: {
          country_code: string | null
          created_at: string
          email: string | null
          exact_location: unknown
          locality: string | null
          profile_id: string
          region: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_cancel_at_period_end: boolean
          subscription_current_period_end: string | null
          subscription_last_payment_status: string | null
          subscription_latest_invoice_id: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          email?: string | null
          exact_location?: unknown
          locality?: string | null
          profile_id: string
          region?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_cancel_at_period_end?: boolean
          subscription_current_period_end?: string | null
          subscription_last_payment_status?: string | null
          subscription_latest_invoice_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          email?: string | null
          exact_location?: unknown
          locality?: string | null
          profile_id?: string
          region?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_cancel_at_period_end?: boolean
          subscription_current_period_end?: string | null
          subscription_last_payment_status?: string | null
          subscription_latest_invoice_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_private_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string
          created_at: string
          display_name: string
          handle: string | null
          id: string
          is_adult_confirmed: boolean
          is_paused: boolean
          location_mode: Database["public"]["Enums"]["location_mode"]
          public_location_label: string | null
          supporter_since: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_name: string
          handle?: string | null
          id: string
          is_adult_confirmed?: boolean
          is_paused?: boolean
          location_mode?: Database["public"]["Enums"]["location_mode"]
          public_location_label?: string | null
          supporter_since?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          handle?: string | null
          id?: string
          is_adult_confirmed?: boolean
          is_paused?: boolean
          location_mode?: Database["public"]["Enums"]["location_mode"]
          public_location_label?: string | null
          supporter_since?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          message_id: string | null
          offer_id: string | null
          post_id: string | null
          reason: string
          reported_profile_id: string | null
          reporter_id: string | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          message_id?: string | null
          offer_id?: string | null
          post_id?: string | null
          reason: string
          reported_profile_id?: string | null
          reporter_id?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string | null
          offer_id?: string | null
          post_id?: string | null
          reason?: string
          reported_profile_id?: string | null
          reporter_id?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_profile_id_fkey"
            columns: ["reported_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_posts: {
        Row: {
          created_at: string
          post_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          event_type: string
          payload: Json
          processed_at: string
          stripe_event_id: string
        }
        Insert: {
          event_type: string
          payload: Json
          processed_at?: string
          stripe_event_id: string
        }
        Update: {
          event_type?: string
          payload?: Json
          processed_at?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
      thread_reads: {
        Row: {
          last_read_at: string
          offer_id: string
          profile_id: string
        }
        Insert: {
          last_read_at?: string
          offer_id: string
          profile_id: string
        }
        Update: {
          last_read_at?: string
          offer_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_reads_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_reads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      discover_posts: {
        Args: {
          p_category?: Database["public"]["Enums"]["post_category"]
          p_kind?: Database["public"]["Enums"]["post_kind"]
          p_limit?: number
          p_offset?: number
          p_radius_miles?: number
          p_scope?: string
          p_search?: string
        }
        Returns: {
          approval_policy: Database["public"]["Enums"]["approval_policy"]
          approximate_location_label: string
          availability_remaining: number
          availability_total: number
          availability_unit: string
          body: string
          category: Database["public"]["Enums"]["post_category"]
          cover_photo_path: string
          created_at: string
          distance_bucket: string
          id: string
          kind: Database["public"]["Enums"]["post_kind"]
          location_mode: Database["public"]["Enums"]["location_mode"]
          owner_avatar_url: string
          owner_display_name: string
          owner_handle: string
          owner_supporter_since: string | null
          owner_id: string
          title: string
          what_i_can_give: string
          looking_for: string
        }[]
      }
      list_threads: {
        Args: never
        Returns: {
          created_at: string
          is_requester: boolean
          last_message_at: string
          last_message_body: string
          last_message_sender_id: string
          offer_id: string
          offered_item: string
          other_display_name: string
          other_handle: string
          other_id: string
          post_id: string
          requested_item: string
          status: Database["public"]["Enums"]["offer_status"]
          timing: string
          unread_count: number
        }[]
      }
      respond_to_offer: {
        Args: { p_action: string; p_note?: string; p_offer_id: string }
        Returns: {
          created_at: string
          id: string
          note: string | null
          offered_item: string
          post_id: string | null
          recipient_id: string
          requested_item: string
          requester_id: string
          requires_approval: boolean
          status: Database["public"]["Enums"]["offer_status"]
          timing: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "offers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      approval_policy: "auto_accept_until_limit" | "manual_approval"
      launch_content_status:
        | "staged"
        | "approved_first_batch"
        | "approved_later_batch"
        | "needs_edits"
      location_mode: "local" | "online" | "local_and_online"
      offer_status:
        | "pending"
        | "interested"
        | "countered"
        | "declined"
        | "withdrawn"
        | "blocked"
        | "closed_by_user"
      post_category: "goods" | "services"
      post_kind: "offering" | "seeking"
      post_status:
        | "draft"
        | "active"
        | "paused"
        | "expired"
        | "hidden"
        | "deleted"
      report_status: "open" | "reviewing" | "actioned" | "dismissed"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "unpaid"
        | "none"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      iceberg_namespaces: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      iceberg_tables: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          location: string
          name: string
          namespace_id: string
          remote_table_id: string | null
          shard_id: string | null
          shard_key: string | null
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          namespace_id: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          namespace_id?: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iceberg_tables_namespace_id_fkey"
            columns: ["namespace_id"]
            isOneToOne: false
            referencedRelation: "iceberg_namespaces"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      approval_policy: ["auto_accept_until_limit", "manual_approval"],
      location_mode: ["local", "online", "local_and_online"],
      launch_content_status: [
        "staged",
        "approved_first_batch",
        "approved_later_batch",
        "needs_edits",
      ],
      offer_status: [
        "pending",
        "interested",
        "countered",
        "declined",
        "withdrawn",
        "blocked",
        "closed_by_user",
      ],
      post_category: ["goods", "services"],
      post_kind: ["offering", "seeking"],
      post_status: [
        "draft",
        "active",
        "paused",
        "expired",
        "hidden",
        "deleted",
      ],
      report_status: ["open", "reviewing", "actioned", "dismissed"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "incomplete",
        "unpaid",
        "none",
      ],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
