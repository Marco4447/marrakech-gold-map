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
      acquisition_events: {
        Row: {
          campaign: string | null
          created_at: string
          device_fingerprint: string | null
          event_type: string
          id: string
          is_inapp: boolean | null
          is_tiktok: boolean | null
          referrer: string | null
          source: string
          user_id: string | null
        }
        Insert: {
          campaign?: string | null
          created_at?: string
          device_fingerprint?: string | null
          event_type: string
          id?: string
          is_inapp?: boolean | null
          is_tiktok?: boolean | null
          referrer?: string | null
          source?: string
          user_id?: string | null
        }
        Update: {
          campaign?: string | null
          created_at?: string
          device_fingerprint?: string | null
          event_type?: string
          id?: string
          is_inapp?: boolean | null
          is_tiktok?: boolean | null
          referrer?: string | null
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      admin_events: {
        Row: {
          body: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          title?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          amount: number
          created_at: string
          id: string
          place_name: string
          status: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          place_name: string
          status?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          place_name?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          user_id: string
          vibe_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          vibe_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          vibe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_vibe_id_fkey"
            columns: ["vibe_id"]
            isOneToOne: false
            referencedRelation: "vibes"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          place_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          place_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          place_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      instagram_scrape_log: {
        Row: {
          caption: string | null
          id: string
          image_url: string
          instagram_handle: string
          place_id: string
          post_url: string
          scraped_at: string
          vibe_id: string | null
        }
        Insert: {
          caption?: string | null
          id?: string
          image_url: string
          instagram_handle: string
          place_id: string
          post_url: string
          scraped_at?: string
          vibe_id?: string | null
        }
        Update: {
          caption?: string | null
          id?: string
          image_url?: string
          instagram_handle?: string
          place_id?: string
          post_url?: string
          scraped_at?: string
          vibe_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instagram_scrape_log_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instagram_scrape_log_vibe_id_fkey"
            columns: ["vibe_id"]
            isOneToOne: false
            referencedRelation: "vibes"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
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
      notifications: {
        Row: {
          actor_user_id: string | null
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
          vibe_id: string | null
        }
        Insert: {
          actor_user_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          title: string
          type: string
          user_id: string
          vibe_id?: string | null
        }
        Update: {
          actor_user_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
          vibe_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_vibe_id_fkey"
            columns: ["vibe_id"]
            isOneToOne: false
            referencedRelation: "vibes"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_accounts: {
        Row: {
          approved: boolean
          created_at: string
          id: string
          place_id: string
          role: string
          user_id: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          id?: string
          place_id: string
          role?: string
          user_id: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          id?: string
          place_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_accounts_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_credits: {
        Row: {
          created_at: string
          credits: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_invites: {
        Row: {
          business_name: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          initial_credits: number
          initial_plan: string | null
          initial_plan_days: number
          place_id: string
          referred_by: string | null
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          business_name: string
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          initial_credits?: number
          initial_plan?: string | null
          initial_plan_days?: number
          place_id: string
          referred_by?: string | null
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          business_name?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          initial_credits?: number
          initial_plan?: string | null
          initial_plan_days?: number
          place_id?: string
          referred_by?: string | null
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_invites_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_offers: {
        Row: {
          created_at: string
          created_by: string
          description: string
          expiration_date: string | null
          id: string
          is_active: boolean
          place_id: string
          title: string
          updated_at: string
          vip_only: boolean
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          expiration_date?: string | null
          id?: string
          is_active?: boolean
          place_id: string
          title: string
          updated_at?: string
          vip_only?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          expiration_date?: string | null
          id?: string
          is_active?: boolean
          place_id?: string
          title?: string
          updated_at?: string
          vip_only?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "partner_offers_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_prospects: {
        Row: {
          app_link: string | null
          category: string | null
          contact_name: string | null
          created_at: string
          created_by: string
          credits_offered: number
          first_contact_date: string | null
          follow_up_date: string | null
          id: string
          instagram: string | null
          invite_link: string | null
          name: string
          neighborhood: string | null
          notes: string | null
          place_id: string | null
          priority: string
          status: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          app_link?: string | null
          category?: string | null
          contact_name?: string | null
          created_at?: string
          created_by: string
          credits_offered?: number
          first_contact_date?: string | null
          follow_up_date?: string | null
          id?: string
          instagram?: string | null
          invite_link?: string | null
          name: string
          neighborhood?: string | null
          notes?: string | null
          place_id?: string | null
          priority?: string
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          app_link?: string | null
          category?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string
          credits_offered?: number
          first_contact_date?: string | null
          follow_up_date?: string | null
          id?: string
          instagram?: string | null
          invite_link?: string | null
          name?: string
          neighborhood?: string | null
          notes?: string | null
          place_id?: string | null
          priority?: string
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_prospects_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_requests: {
        Row: {
          business_name: string
          category: string
          created_at: string
          id: string
          offer_description: string
          status: string
          user_id: string | null
          whatsapp_number: string
        }
        Insert: {
          business_name: string
          category: string
          created_at?: string
          id?: string
          offer_description: string
          status?: string
          user_id?: string | null
          whatsapp_number: string
        }
        Update: {
          business_name?: string
          category?: string
          created_at?: string
          id?: string
          offer_description?: string
          status?: string
          user_id?: string | null
          whatsapp_number?: string
        }
        Relationships: []
      }
      partner_subscriptions: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          partner_id: string
          place_id: string | null
          plan_type: string
          start_date: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          partner_id: string
          place_id?: string | null
          plan_type?: string
          start_date?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          partner_id?: string
          place_id?: string | null
          plan_type?: string
          start_date?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_subscriptions_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      place_follows: {
        Row: {
          created_at: string
          id: string
          place_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          place_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          place_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_follows_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      place_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          photo_url: string
          place_id: string
          sort_order: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          photo_url: string
          place_id: string
          sort_order?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          photo_url?: string
          place_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "place_photos_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          address: string | null
          category: string | null
          created_at: string
          description: string | null
          dress_code: string | null
          drinks_menu_url: string | null
          has_active_offer: boolean
          id: string
          image_url: string | null
          instagram_handle: string | null
          is_founder: boolean
          is_partner: boolean
          is_premium: boolean
          latitude: number
          listing_tier: string | null
          longitude: number
          menu_url: string | null
          music_style: string | null
          name: string
          neighborhood: string | null
          opening_hours: string | null
          price_range: string | null
          rating: number | null
          slug: string | null
          updated_at: string
          vip_perk_description: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          dress_code?: string | null
          drinks_menu_url?: string | null
          has_active_offer?: boolean
          id?: string
          image_url?: string | null
          instagram_handle?: string | null
          is_founder?: boolean
          is_partner?: boolean
          is_premium?: boolean
          latitude: number
          listing_tier?: string | null
          longitude: number
          menu_url?: string | null
          music_style?: string | null
          name: string
          neighborhood?: string | null
          opening_hours?: string | null
          price_range?: string | null
          rating?: number | null
          slug?: string | null
          updated_at?: string
          vip_perk_description?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          dress_code?: string | null
          drinks_menu_url?: string | null
          has_active_offer?: boolean
          id?: string
          image_url?: string | null
          instagram_handle?: string | null
          is_founder?: boolean
          is_partner?: boolean
          is_premium?: boolean
          latitude?: number
          listing_tier?: string | null
          longitude?: number
          menu_url?: string | null
          music_style?: string | null
          name?: string
          neighborhood?: string | null
          opening_hours?: string | null
          price_range?: string | null
          rating?: number | null
          slug?: string | null
          updated_at?: string
          vip_perk_description?: string | null
        }
        Relationships: []
      }
      processed_stripe_events: {
        Row: {
          event_id: string
          processed_at: string
        }
        Insert: {
          event_id: string
          processed_at?: string
        }
        Update: {
          event_id?: string
          processed_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_vip: boolean
          updated_at: string
          user_id: string
          vip_expires_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_vip?: boolean
          updated_at?: string
          user_id: string
          vip_expires_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_vip?: boolean
          updated_at?: string
          user_id?: string
          vip_expires_at?: string | null
        }
        Relationships: []
      }
      qr_scans: {
        Row: {
          created_at: string
          id: string
          place_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          place_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          place_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_scans_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_uses: {
        Row: {
          code: string
          created_at: string
          id: string
          referred_user_id: string
          referrer_user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          referred_user_id: string
          referrer_user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          referred_user_id?: string
          referrer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_uses_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["code"]
          },
        ]
      }
      sponsored_events: {
        Row: {
          boost_level: string
          created_at: string
          description: string | null
          event_date: string
          id: string
          place_id: string
          price_paid: number
          status: string
          stripe_session_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          boost_level?: string
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          place_id: string
          price_paid?: number
          status?: string
          stripe_session_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          boost_level?: string
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          place_id?: string
          price_paid?: number
          status?: string
          stripe_session_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsored_events_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          badge: string | null
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          is_featured: boolean
          is_hidden: boolean
          latitude: number | null
          longitude: number | null
          media_type: string
          media_url: string
          place_id: string | null
          source_type: string
          user_id: string | null
        }
        Insert: {
          badge?: string | null
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_featured?: boolean
          is_hidden?: boolean
          latitude?: number | null
          longitude?: number | null
          media_type?: string
          media_url: string
          place_id?: string | null
          source_type?: string
          user_id?: string | null
        }
        Update: {
          badge?: string | null
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_featured?: boolean
          is_hidden?: boolean
          latitude?: number | null
          longitude?: number | null
          media_type?: string
          media_url?: string
          place_id?: string | null
          source_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      story_reactions: {
        Row: {
          created_at: string
          device_id: string
          emoji: string
          id: string
          story_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_id: string
          emoji?: string
          id?: string
          story_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_id?: string
          emoji?: string
          id?: string
          story_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_reactions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          device_id: string | null
          id: string
          story_id: string
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          device_id?: string | null
          id?: string
          story_id: string
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          device_id?: string | null
          id?: string
          story_id?: string
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      venue_analytics: {
        Row: {
          created_at: string
          event_type: string
          id: string
          place_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          place_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          place_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_analytics_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      vibe_boosts: {
        Row: {
          boost_expires_at: string
          boost_type: string
          created_at: string
          id: string
          stripe_session_id: string | null
          user_id: string
          vibe_id: string
        }
        Insert: {
          boost_expires_at: string
          boost_type: string
          created_at?: string
          id?: string
          stripe_session_id?: string | null
          user_id: string
          vibe_id: string
        }
        Update: {
          boost_expires_at?: string
          boost_type?: string
          created_at?: string
          id?: string
          stripe_session_id?: string | null
          user_id?: string
          vibe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vibe_boosts_vibe_id_fkey"
            columns: ["vibe_id"]
            isOneToOne: false
            referencedRelation: "vibes"
            referencedColumns: ["id"]
          },
        ]
      }
      vibe_comments: {
        Row: {
          content: string
          created_at: string
          device_id: string
          id: string
          user_id: string | null
          vibe_id: string
        }
        Insert: {
          content: string
          created_at?: string
          device_id: string
          id?: string
          user_id?: string | null
          vibe_id: string
        }
        Update: {
          content?: string
          created_at?: string
          device_id?: string
          id?: string
          user_id?: string | null
          vibe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vibe_comments_vibe_id_fkey"
            columns: ["vibe_id"]
            isOneToOne: false
            referencedRelation: "vibes"
            referencedColumns: ["id"]
          },
        ]
      }
      vibe_likes: {
        Row: {
          created_at: string
          device_id: string
          id: string
          user_id: string | null
          vibe_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          user_id?: string | null
          vibe_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          user_id?: string | null
          vibe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vibe_likes_vibe_id_fkey"
            columns: ["vibe_id"]
            isOneToOne: false
            referencedRelation: "vibes"
            referencedColumns: ["id"]
          },
        ]
      }
      vibe_super_vibes: {
        Row: {
          created_at: string
          device_id: string
          id: string
          user_id: string | null
          vibe_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          user_id?: string | null
          vibe_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          user_id?: string | null
          vibe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vibe_super_vibes_vibe_id_fkey"
            columns: ["vibe_id"]
            isOneToOne: false
            referencedRelation: "vibes"
            referencedColumns: ["id"]
          },
        ]
      }
      vibe_views: {
        Row: {
          id: string
          user_id: string | null
          vibe_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          vibe_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          vibe_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vibe_views_vibe_id_fkey"
            columns: ["vibe_id"]
            isOneToOne: false
            referencedRelation: "vibes"
            referencedColumns: ["id"]
          },
        ]
      }
      vibes: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          insider_tip: string | null
          is_official: boolean
          latitude: number | null
          likes: number
          location: string | null
          longitude: number | null
          media_type: string
          mood: string | null
          super_vibes: number
          user_id: string | null
          username: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          insider_tip?: string | null
          is_official?: boolean
          latitude?: number | null
          likes?: number
          location?: string | null
          longitude?: number | null
          media_type?: string
          mood?: string | null
          super_vibes?: number
          user_id?: string | null
          username?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          insider_tip?: string | null
          is_official?: boolean
          latitude?: number | null
          likes?: number
          location?: string | null
          longitude?: number | null
          media_type?: string
          mood?: string | null
          super_vibes?: number
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      vip_offers: {
        Row: {
          created_at: string
          created_by: string
          description: string
          end_time: string | null
          id: string
          is_active: boolean
          limit_per_user: number
          max_redemptions: number | null
          perk_type: string
          place_id: string
          start_time: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          end_time?: string | null
          id?: string
          is_active?: boolean
          limit_per_user?: number
          max_redemptions?: number | null
          perk_type?: string
          place_id: string
          start_time?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          end_time?: string | null
          id?: string
          is_active?: boolean
          limit_per_user?: number
          max_redemptions?: number | null
          perk_type?: string
          place_id?: string
          start_time?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_offers_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_passes: {
        Row: {
          expires_at: string
          generated_at: string
          id: string
          offer_id: string
          status: string
          user_id: string
        }
        Insert: {
          expires_at: string
          generated_at?: string
          id?: string
          offer_id: string
          status?: string
          user_id: string
        }
        Update: {
          expires_at?: string
          generated_at?: string
          id?: string
          offer_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_passes_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "vip_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_redemptions: {
        Row: {
          id: string
          offer_id: string
          pass_id: string
          place_id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          id?: string
          offer_id: string
          pass_id: string
          place_id: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          id?: string
          offer_id?: string
          pass_id?: string
          place_id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_redemptions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "vip_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vip_redemptions_pass_id_fkey"
            columns: ["pass_id"]
            isOneToOne: false
            referencedRelation: "vip_passes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vip_redemptions_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_challenges: {
        Row: {
          created_at: string
          description: string | null
          emoji: string
          end_date: string
          id: string
          start_date: string
          status: string
          theme_tag: string | null
          title: string
          winner_user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          emoji?: string
          end_date?: string
          id?: string
          start_date?: string
          status?: string
          theme_tag?: string | null
          title: string
          winner_user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          emoji?: string
          end_date?: string
          id?: string
          start_date?: string
          status?: string
          theme_tag?: string | null
          title?: string
          winner_user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          is_vip: boolean | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          is_vip?: boolean | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          is_vip?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_old_stripe_events: { Args: never; Returns: undefined }
      generate_place_slug: { Args: { place_name: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_vibe_likes: {
        Args: { p_delta?: number; p_vibe_id: string }
        Returns: undefined
      }
      increment_vibe_super_vibes: {
        Args: { p_delta?: number; p_vibe_id: string }
        Returns: undefined
      }
      publish_vibe_use_credit: {
        Args: {
          p_caption?: string
          p_image_url: string
          p_location?: string
          p_media_type?: string
          p_mood?: string
        }
        Returns: boolean
      }
      verify_vip_status: {
        Args: { p_user_id: string }
        Returns: {
          full_name: string
          is_vip: boolean
          valid: boolean
          vip_expires_at: string
        }[]
      }
      weekly_checkins: { Args: { p_place_id: string }; Returns: number }
      weekly_place_views: { Args: { p_place_id: string }; Returns: number }
      weekly_qr_redemptions: { Args: { p_place_id: string }; Returns: number }
      weekly_vibe_views: { Args: { p_place_id: string }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "partner"
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
      app_role: ["admin", "moderator", "user", "partner"],
    },
  },
} as const
