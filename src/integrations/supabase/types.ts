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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      affiliate_commissions: {
        Row: {
          ambassador_id: string
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          order_amount: number
          order_id: string | null
          paid_at: string | null
          referral_signup_id: string | null
          status: string
        }
        Insert: {
          ambassador_id: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          order_amount?: number
          order_id?: string | null
          paid_at?: string | null
          referral_signup_id?: string | null
          status?: string
        }
        Update: {
          ambassador_id?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          order_amount?: number
          order_id?: string | null
          paid_at?: string | null
          referral_signup_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassadors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_referral_signup_id_fkey"
            columns: ["referral_signup_id"]
            isOneToOne: false
            referencedRelation: "referral_signups"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassadors: {
        Row: {
          commission_rate: number
          created_at: string
          email: string | null
          full_name: string
          id: string
          invited_by: string | null
          phone: string | null
          referral_code: string
          referral_link: string | null
          status: string
          total_earnings: number
          total_paid: number
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          invited_by?: string | null
          phone?: string | null
          referral_code: string
          referral_link?: string | null
          status?: string
          total_earnings?: number
          total_paid?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          invited_by?: string | null
          phone?: string | null
          referral_code?: string
          referral_link?: string | null
          status?: string
          total_earnings?: number
          total_paid?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_commissions: {
        Row: {
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          order_amount: number
          order_id: string | null
          paid_at: string | null
          seller_id: string
          status: string
        }
        Insert: {
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          order_amount?: number
          order_id?: string | null
          paid_at?: string | null
          seller_id: string
          status?: string
        }
        Update: {
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          order_amount?: number
          order_id?: string | null
          paid_at?: string | null
          seller_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_seller_view"
            referencedColumns: ["id"]
          },
        ]
      }
      business_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          description: string | null
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_value?: Json
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_missions: {
        Row: {
          created_at: string
          customer_name: string | null
          customer_phone: string
          delivered_at: string | null
          delivery_address: string
          distance_km: number | null
          driver_id: string | null
          fee: number
          id: string
          package_type: string
          picked_up_at: string | null
          pickup_address: string
          requester_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          customer_phone: string
          delivered_at?: string | null
          delivery_address: string
          distance_km?: number | null
          driver_id?: string | null
          fee?: number
          id?: string
          package_type?: string
          picked_up_at?: string | null
          pickup_address: string
          requester_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string
          delivered_at?: string | null
          delivery_address?: string
          distance_km?: number | null
          driver_id?: string | null
          fee?: number
          id?: string
          package_type?: string
          picked_up_at?: string | null
          pickup_address?: string
          requester_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      driver_profiles: {
        Row: {
          average_rating: number | null
          city: string
          created_at: string
          driver_status: string
          full_name: string
          id: string
          id_document_url: string | null
          phone: string
          selfie_url: string | null
          total_deliveries: number | null
          total_earnings: number | null
          updated_at: string
          user_id: string
          vehicle_photo_url: string | null
          vehicle_type: string
        }
        Insert: {
          average_rating?: number | null
          city?: string
          created_at?: string
          driver_status?: string
          full_name: string
          id?: string
          id_document_url?: string | null
          phone: string
          selfie_url?: string | null
          total_deliveries?: number | null
          total_earnings?: number | null
          updated_at?: string
          user_id: string
          vehicle_photo_url?: string | null
          vehicle_type?: string
        }
        Update: {
          average_rating?: number | null
          city?: string
          created_at?: string
          driver_status?: string
          full_name?: string
          id?: string
          id_document_url?: string | null
          phone?: string
          selfie_url?: string | null
          total_deliveries?: number | null
          total_earnings?: number | null
          updated_at?: string
          user_id?: string
          vehicle_photo_url?: string | null
          vehicle_type?: string
        }
        Relationships: []
      }
      email_otp: {
        Row: {
          attempts: number
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_code: string
          verified: boolean
        }
        Insert: {
          attempts?: number
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          otp_code: string
          verified?: boolean
        }
        Update: {
          attempts?: number
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          verified?: boolean
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_verifications: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          id_back_url: string
          id_front_url: string
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          id_back_url: string
          id_front_url: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          id_back_url?: string
          id_front_url?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketing_posts: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          image_url: string | null
          is_active: boolean
          target_audience: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          target_audience?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          target_audience?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          media_name: string | null
          media_type: string | null
          media_url: string | null
          product_id: string | null
          recipient_id: string
          sender_id: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          media_name?: string | null
          media_type?: string | null
          media_url?: string | null
          product_id?: string | null
          recipient_id: string
          sender_id: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          media_name?: string | null
          media_type?: string | null
          media_url?: string | null
          product_id?: string | null
          recipient_id?: string
          sender_id?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_access_logs: {
        Row: {
          access_type: string
          accessed_at: string
          accessed_by: string
          id: string
          ip_address: string | null
          order_id: string
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string
          accessed_by: string
          id?: string
          ip_address?: string | null
          order_id: string
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string
          accessed_by?: string
          id?: string
          ip_address?: string | null
          order_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          commission_amount: number | null
          commission_status: string | null
          created_at: string
          customer_id: string
          customer_name: string
          customer_phone: string
          delivery_location: string
          id: string
          is_confirmed_by_seller: boolean | null
          product_id: string
          product_price: number
          product_title: string
          quantity: number
          seller_id: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          commission_amount?: number | null
          commission_status?: string | null
          created_at?: string
          customer_id: string
          customer_name: string
          customer_phone: string
          delivery_location: string
          id?: string
          is_confirmed_by_seller?: boolean | null
          product_id: string
          product_price: number
          product_title: string
          quantity?: number
          seller_id: string
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          commission_amount?: number | null
          commission_status?: string | null
          created_at?: string
          customer_id?: string
          customer_name?: string
          customer_phone?: string
          delivery_location?: string
          id?: string
          is_confirmed_by_seller?: boolean | null
          product_id?: string
          product_price?: number
          product_title?: string
          quantity?: number
          seller_id?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      paystack_config: {
        Row: {
          created_at: string
          encrypted_key_live: string | null
          encrypted_key_test: string | null
          encrypted_public_key_live: string | null
          encrypted_public_key_test: string | null
          id: string
          mode: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          encrypted_key_live?: string | null
          encrypted_key_test?: string | null
          encrypted_public_key_live?: string | null
          encrypted_public_key_test?: string | null
          id?: string
          mode?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          encrypted_key_live?: string | null
          encrypted_key_test?: string | null
          encrypted_public_key_live?: string | null
          encrypted_public_key_test?: string | null
          id?: string
          mode?: string
          updated_at?: string
        }
        Relationships: []
      }
      phone_otp: {
        Row: {
          attempts: number
          created_at: string
          expires_at: string
          id: string
          otp_code: string
          phone: string
          verified: boolean
        }
        Insert: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          otp_code: string
          phone: string
          verified?: boolean
        }
        Update: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          otp_code?: string
          phone?: string
          verified?: boolean
        }
        Relationships: []
      }
      premium_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          is_product_published: boolean | null
          payment_date: string | null
          payment_type: string | null
          paystack_reference: string
          product_data: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          is_product_published?: boolean | null
          payment_date?: string | null
          payment_type?: string | null
          paystack_reference: string
          product_data?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          is_product_published?: boolean | null
          payment_date?: string | null
          payment_type?: string | null
          paystack_reference?: string
          product_data?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_price_tiers: {
        Row: {
          created_at: string
          id: string
          min_quantity: number
          product_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          min_quantity: number
          product_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          min_quantity?: number
          product_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_price_tiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_price_tiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          badge: string | null
          bonus_id: string | null
          boosted_at: string | null
          boosted_until: string | null
          category: string
          city: string | null
          commune: string | null
          country: string | null
          created_at: string
          description: string | null
          discount_percentage: number | null
          id: string
          images: string[]
          is_active: boolean | null
          is_boosted: boolean | null
          is_flash_sale: boolean | null
          is_sold: boolean | null
          original_price: number | null
          price: number
          rating: number | null
          reviews_count: number | null
          search_vector: unknown
          seller_id: string
          shop_id: string | null
          stock_quantity: number | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          badge?: string | null
          bonus_id?: string | null
          boosted_at?: string | null
          boosted_until?: string | null
          category: string
          city?: string | null
          commune?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          images?: string[]
          is_active?: boolean | null
          is_boosted?: boolean | null
          is_flash_sale?: boolean | null
          is_sold?: boolean | null
          original_price?: number | null
          price: number
          rating?: number | null
          reviews_count?: number | null
          search_vector?: unknown
          seller_id: string
          shop_id?: string | null
          stock_quantity?: number | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          badge?: string | null
          bonus_id?: string | null
          boosted_at?: string | null
          boosted_until?: string | null
          category?: string
          city?: string | null
          commune?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          images?: string[]
          is_active?: boolean | null
          is_boosted?: boolean | null
          is_flash_sale?: boolean | null
          is_sold?: boolean | null
          original_price?: number | null
          price?: number
          rating?: number | null
          reviews_count?: number | null
          search_vector?: unknown
          seller_id?: string
          shop_id?: string | null
          stock_quantity?: number | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "seller_shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_access_logs: {
        Row: {
          access_type: string
          accessed_at: string
          accessed_by: string
          id: string
          ip_address: string | null
          profile_id: string
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string
          accessed_by: string
          id?: string
          ip_address?: string | null
          profile_id: string
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string
          accessed_by?: string
          id?: string
          ip_address?: string | null
          profile_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          commune: string | null
          country: string | null
          created_at: string
          email: string | null
          email_verification_expires_at: string | null
          email_verification_token: string | null
          email_verified: boolean | null
          full_name: string | null
          id: string
          is_premium: boolean | null
          is_superadmin: boolean | null
          paystack_reference: string | null
          phone: string | null
          premium_expires_at: string | null
          push_token: string | null
          role: string | null
          seller_type: Database["public"]["Enums"]["seller_type"] | null
          trial_bonus_tokens_given: boolean | null
          trial_end_date: string | null
          trial_start_date: string | null
          trial_used: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          commune?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          email_verification_expires_at?: string | null
          email_verification_token?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          is_premium?: boolean | null
          is_superadmin?: boolean | null
          paystack_reference?: string | null
          phone?: string | null
          premium_expires_at?: string | null
          push_token?: string | null
          role?: string | null
          seller_type?: Database["public"]["Enums"]["seller_type"] | null
          trial_bonus_tokens_given?: boolean | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          trial_used?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          commune?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          email_verification_expires_at?: string | null
          email_verification_token?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          is_premium?: boolean | null
          is_superadmin?: boolean | null
          paystack_reference?: string | null
          phone?: string | null
          premium_expires_at?: string | null
          push_token?: string | null
          role?: string | null
          seller_type?: Database["public"]["Enums"]["seller_type"] | null
          trial_bonus_tokens_given?: boolean | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          trial_used?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      publication_bonus: {
        Row: {
          bonus_type: string | null
          created_at: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          max_products: number
          seller_id: string
          starts_at: string
          used_products: number | null
        }
        Insert: {
          bonus_type?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          max_products: number
          seller_id: string
          starts_at: string
          used_products?: number | null
        }
        Update: {
          bonus_type?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          max_products?: number
          seller_id?: string
          starts_at?: string
          used_products?: number | null
        }
        Relationships: []
      }
      publication_bonuses: {
        Row: {
          created_at: string | null
          expires_at: string
          id: number
          max_products: number
          reason: string | null
          seller_id: string
          starts_at: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: number
          max_products: number
          reason?: string | null
          seller_id: string
          starts_at: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: number
          max_products?: number
          reason?: string | null
          seller_id?: string
          starts_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          device_id: string
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh: string
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string | null
          device_id: string
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string | null
          device_id?: string
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      referral_signups: {
        Row: {
          ambassador_id: string
          created_at: string
          id: string
          referral_code: string
          referred_user_id: string
          status: string
        }
        Insert: {
          ambassador_id: string
          created_at?: string
          id?: string
          referral_code: string
          referred_user_id: string
          status?: string
        }
        Update: {
          ambassador_id?: string
          created_at?: string
          id?: string
          referral_code?: string
          referred_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_signups_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassadors"
            referencedColumns: ["id"]
          },
        ]
      }
      security_logs: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string
          title: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string
          title: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string
          title?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      seller_shops: {
        Row: {
          banner_url: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          monthly_fee: number | null
          seller_id: string
          shop_description: string | null
          shop_name: string
          shop_slug: string
          subscription_active: boolean | null
          subscription_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          monthly_fee?: number | null
          seller_id: string
          shop_description?: string | null
          shop_name: string
          shop_slug: string
          subscription_active?: boolean | null
          subscription_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          monthly_fee?: number | null
          seller_id?: string
          shop_description?: string | null
          shop_name?: string
          shop_slug?: string
          subscription_active?: boolean | null
          subscription_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      seller_tokens: {
        Row: {
          bonus_tokens_count: number | null
          created_at: string
          free_tokens_count: number | null
          free_tokens_expires_at: string | null
          id: string
          paid_tokens_count: number | null
          seller_id: string
          token_balance: number
          updated_at: string
          wallet_balance_fcfa: number
        }
        Insert: {
          bonus_tokens_count?: number | null
          created_at?: string
          free_tokens_count?: number | null
          free_tokens_expires_at?: string | null
          id?: string
          paid_tokens_count?: number | null
          seller_id: string
          token_balance?: number
          updated_at?: string
          wallet_balance_fcfa?: number
        }
        Update: {
          bonus_tokens_count?: number | null
          created_at?: string
          free_tokens_count?: number | null
          free_tokens_expires_at?: string | null
          id?: string
          paid_tokens_count?: number | null
          seller_id?: string
          token_balance?: number
          updated_at?: string
          wallet_balance_fcfa?: number
        }
        Relationships: []
      }
      site_visits: {
        Row: {
          created_at: string
          id: string
          is_first_visit: boolean
          referrer: string | null
          user_agent: string | null
          user_id: string | null
          visit_date: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_first_visit?: boolean
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
          visit_date?: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_first_visit?: boolean
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
          visit_date?: string
          visitor_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          id: string
          paystack_reference: string | null
          status: string
          subscription_end: string | null
          subscription_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          paystack_reference?: string | null
          status?: string
          subscription_end?: string | null
          subscription_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          paystack_reference?: string | null
          status?: string
          subscription_end?: string | null
          subscription_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_response: string | null
          category: string
          created_at: string
          email: string | null
          id: string
          message: string
          name: string
          phone: string | null
          responded_at: string | null
          responded_by: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          category?: string
          created_at?: string
          email?: string | null
          id?: string
          message: string
          name: string
          phone?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          category?: string
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      token_transactions: {
        Row: {
          created_at: string
          id: string
          payment_method: string | null
          paystack_reference: string | null
          price_paid: number | null
          product_id: string | null
          seller_id: string
          status: string
          tokens_amount: number
          transaction_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          payment_method?: string | null
          paystack_reference?: string | null
          price_paid?: number | null
          product_id?: string | null
          seller_id: string
          status?: string
          tokens_amount: number
          transaction_type: string
        }
        Update: {
          created_at?: string
          id?: string
          payment_method?: string | null
          paystack_reference?: string | null
          price_paid?: number | null
          product_id?: string | null
          seller_id?: string
          status?: string
          tokens_amount?: number
          transaction_type?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_security_settings: {
        Row: {
          account_locked_until: string | null
          backup_codes: string[] | null
          created_at: string
          failed_login_attempts: number | null
          id: string
          last_login_attempt: string | null
          recovery_codes_used: number | null
          totp_secret: string | null
          two_factor_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          account_locked_until?: string | null
          backup_codes?: string[] | null
          created_at?: string
          failed_login_attempts?: number | null
          id?: string
          last_login_attempt?: string | null
          recovery_codes_used?: number | null
          totp_secret?: string | null
          two_factor_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          account_locked_until?: string | null
          backup_codes?: string[] | null
          created_at?: string
          failed_login_attempts?: number | null
          id?: string
          last_login_attempt?: string | null
          recovery_codes_used?: number | null
          totp_secret?: string | null
          two_factor_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          order_id: string | null
          reference: string | null
          status: string
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          order_id?: string | null
          reference?: string | null
          status?: string
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          order_id?: string | null
          reference?: string | null
          status?: string
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          currency: string
          destination_name: string | null
          destination_number: string
          id: string
          processed_at: string | null
          processed_by: string | null
          status: string
          updated_at: string
          user_id: string
          withdrawal_method: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          currency?: string
          destination_name?: string | null
          destination_number: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
          withdrawal_method: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          currency?: string
          destination_name?: string | null
          destination_number?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          withdrawal_method?: string
        }
        Relationships: []
      }
    }
    Views: {
      orders_seller_view: {
        Row: {
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_location: string | null
          id: string | null
          is_confirmed_by_seller: boolean | null
          product_id: string | null
          product_price: number | null
          product_title: string | null
          quantity: number | null
          seller_id: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          customer_name?: never
          customer_phone?: never
          delivery_location?: never
          id?: string | null
          is_confirmed_by_seller?: boolean | null
          product_id?: string | null
          product_price?: number | null
          product_title?: string | null
          quantity?: number | null
          seller_id?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          customer_name?: never
          customer_phone?: never
          delivery_location?: never
          id?: string | null
          is_confirmed_by_seller?: boolean | null
          product_id?: string | null
          product_price?: number | null
          product_title?: string | null
          quantity?: number | null
          seller_id?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      products_public: {
        Row: {
          badge: string | null
          boosted_at: string | null
          boosted_until: string | null
          category: string | null
          city: string | null
          country: string | null
          created_at: string | null
          description: string | null
          discount_percentage: number | null
          id: string | null
          images: string[] | null
          in_stock: boolean | null
          is_boosted: boolean | null
          is_flash_sale: boolean | null
          price: number | null
          rating: number | null
          reviews_count: number | null
          shop_id: string | null
          title: string | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          badge?: string | null
          boosted_at?: string | null
          boosted_until?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string | null
          images?: string[] | null
          in_stock?: never
          is_boosted?: boolean | null
          is_flash_sale?: boolean | null
          price?: number | null
          rating?: number | null
          reviews_count?: number | null
          shop_id?: string | null
          title?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          badge?: string | null
          boosted_at?: string | null
          boosted_until?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string | null
          images?: string[] | null
          in_stock?: never
          is_boosted?: boolean | null
          is_flash_sale?: boolean | null
          price?: number | null
          rating?: number | null
          reviews_count?: number | null
          shop_id?: string | null
          title?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "seller_shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops_public"
            referencedColumns: ["id"]
          },
        ]
      }
      shops_public: {
        Row: {
          banner_url: string | null
          created_at: string | null
          id: string | null
          logo_url: string | null
          shop_description: string | null
          shop_name: string | null
          shop_slug: string | null
          updated_at: string | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string | null
          id?: string | null
          logo_url?: string | null
          shop_description?: string | null
          shop_name?: string | null
          shop_slug?: string | null
          updated_at?: string | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string | null
          id?: string | null
          logo_url?: string | null
          shop_description?: string | null
          shop_name?: string | null
          shop_slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_subscription: {
        Args: { _amount: number; _paystack_reference: string; _user_id: string }
        Returns: boolean
      }
      add_tokens_after_purchase: {
        Args: {
          _paystack_reference: string
          _price_paid: number
          _seller_id: string
          _tokens_amount: number
        }
        Returns: boolean
      }
      admin_adjust_tokens: {
        Args: { p_amount: number; p_reason?: string; p_seller: string }
        Returns: Json
      }
      admin_create_publication_bonus: {
        Args: {
          p_expires_at: string
          p_max_products: number
          p_reason?: string
          p_seller_id: string
          p_starts_at: string
        }
        Returns: Json
      }
      admin_create_publication_bonus_safe: {
        Args: {
          p_expires_at: string
          p_max_products: number
          p_reason: string
          p_seller_id: string
          p_starts_at: string
        }
        Returns: string
      }
      admin_give_publication_bonus: {
        Args: { p_days: number; p_max_products: number; p_seller_id: string }
        Returns: string
      }
      admin_grant_bonus: {
        Args: {
          p_bonus_type: string
          p_reason?: string
          p_seller_id: string
          p_value: number
        }
        Returns: Json
      }
      assign_current_user_superadmin: { Args: never; Returns: string }
      assign_superadmin_role: { Args: { _email: string }; Returns: string }
      boost_product:
        | {
            Args: { _product_id: string; _seller_id: string }
            Returns: boolean
          }
        | {
            Args: {
              _duration_hours?: number
              _product_id: string
              _seller_id: string
            }
            Returns: boolean
          }
      can_access_seller_features: { Args: { _user_id: string }; Returns: Json }
      can_insert_products: { Args: { _user_id: string }; Returns: boolean }
      can_publish_products: { Args: { _user_id: string }; Returns: boolean }
      cancel_order_by_customer: { Args: { order_id: string }; Returns: Json }
      check_publication_bonus: {
        Args: { p_seller_id: string }
        Returns: string
      }
      check_token_balance: { Args: { _seller_id: string }; Returns: Json }
      cleanup_expired_otp: { Args: never; Returns: undefined }
      confirm_sale_by_seller: {
        Args: { _mark_product_as_sold?: boolean; _order_id: string }
        Returns: Json
      }
      consume_bonus_publication: {
        Args: { p_seller_id: string }
        Returns: Json
      }
      consume_token_for_publication: {
        Args: { _product_id?: string; _seller_id: string }
        Returns: boolean
      }
      consume_token_for_publish: {
        Args: { p_seller: string }
        Returns: undefined
      }
      create_shops_for_existing_sellers: { Args: never; Returns: undefined }
      delete_user_profile_and_roles: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      ensure_seller_shop: {
        Args: { _shop_name?: string; _user_id: string }
        Returns: Json
      }
      ensure_seller_trial_tokens: { Args: { _user_id: string }; Returns: Json }
      expire_free_tokens: { Args: never; Returns: undefined }
      generate_shop_slug: { Args: { shop_name: string }; Returns: string }
      get_2fa_status: { Args: { _user_id: string }; Returns: Json }
      get_admin_statistics: {
        Args: never
        Returns: {
          new_users_today: number
          orders_today: number
          total_active_products: number
          total_buyers: number
          total_orders: number
          total_revenue: number
          total_sellers: number
          total_users: number
        }[]
      }
      get_business_dashboard_stats: { Args: never; Returns: Json }
      get_business_revenue_chart: { Args: { _days?: number }; Returns: Json }
      get_category_performance: { Args: never; Returns: Json }
      get_confirmed_order_details: {
        Args: { order_id: string }
        Returns: {
          customer_name: string
          customer_phone: string
          delivery_location: string
          id: string
          product_title: string
          quantity: number
          status: string
          total_amount: number
        }[]
      }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_kyc_status: { Args: { _user_id: string }; Returns: Json }
      get_order_details: {
        Args: { order_id: string }
        Returns: {
          created_at: string
          customer_id: string
          customer_name: string
          customer_phone: string
          delivery_location: string
          id: string
          product_id: string
          product_price: number
          product_title: string
          quantity: number
          seller_id: string
          status: string
          total_amount: number
          updated_at: string
        }[]
      }
      get_order_for_superadmin: {
        Args: { _order_id: string }
        Returns: {
          created_at: string
          customer_id: string
          customer_name: string
          customer_phone: string
          delivery_location: string
          id: string
          product_title: string
          quantity: number
          seller_id: string
          status: string
          total_amount: number
        }[]
      }
      get_profile_with_audit: {
        Args: { target_user_id: string }
        Returns: {
          address: string | null
          avatar_url: string | null
          city: string | null
          commune: string | null
          country: string | null
          created_at: string
          email: string | null
          email_verification_expires_at: string | null
          email_verification_token: string | null
          email_verified: boolean | null
          full_name: string | null
          id: string
          is_premium: boolean | null
          is_superadmin: boolean | null
          paystack_reference: string | null
          phone: string | null
          premium_expires_at: string | null
          push_token: string | null
          role: string | null
          seller_type: Database["public"]["Enums"]["seller_type"] | null
          trial_bonus_tokens_given: boolean | null
          trial_end_date: string | null
          trial_start_date: string | null
          trial_used: boolean | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_recent_orders_superadmin: {
        Args: { _limit?: number }
        Returns: {
          created_at: string
          customer_id: string
          customer_name: string
          customer_phone: string
          delivery_location: string
          id: string
          product_title: string
          quantity: number
          seller_id: string
          status: string
          total_amount: number
        }[]
      }
      get_recent_security_logs: {
        Args: { _limit?: number }
        Returns: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string
          title: string
          user_agent: string | null
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "security_logs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_security_dashboard_stats: { Args: never; Returns: Json }
      get_seller_commission_rate: {
        Args: { _seller_id: string }
        Returns: number
      }
      get_seller_orders: {
        Args: never
        Returns: {
          created_at: string
          customer_id: string
          customer_name: string
          customer_phone: string
          delivery_location: string
          id: string
          product_id: string
          product_price: number
          product_title: string
          quantity: number
          seller_id: string
          status: string
          total_amount: number
          updated_at: string
        }[]
      }
      get_suspicious_order_access: {
        Args: never
        Returns: {
          access_count: number
          access_types: string[]
          accessed_by: string
          first_access: string
          last_access: string
          unique_orders_accessed: number
        }[]
      }
      get_top_performing_shops: { Args: { _limit?: number }; Returns: Json }
      get_top_sellers_superadmin: {
        Args: { _limit?: number }
        Returns: {
          email: string
          full_name: string
          seller_id: string
          total_orders: number
          total_products: number
          total_sales: number
        }[]
      }
      get_top_selling_products: { Args: { _limit?: number }; Returns: Json }
      get_user_order_stats_superadmin: {
        Args: { target_user_id: string }
        Returns: {
          completed_orders: number
          total_orders: number
          total_revenue: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_users_with_profiles: {
        Args: never
        Returns: {
          address: string
          avatar_url: string
          city: string
          country: string
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }[]
      }
      get_visitor_statistics: {
        Args: never
        Returns: {
          new_visitors_24h: number
          new_visitors_7d: number
          total_unique_visitors: number
          total_visits_today: number
        }[]
      }
      get_wallet_balance: { Args: { _user_id: string }; Returns: Json }
      handle_article_payment_success: {
        Args: {
          _amount: number
          _paystack_reference: string
          _product_data: Json
          _user_id: string
        }
        Returns: undefined
      }
      handle_premium_payment_success: {
        Args: { _amount: number; _paystack_reference: string; _user_id: string }
        Returns: boolean
      }
      has_business_admin_access: {
        Args: { _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      initialize_seller_tokens: {
        Args: { _seller_id: string }
        Returns: undefined
      }
      is_in_trial_period: { Args: { _user_id: string }; Returns: boolean }
      is_product_boosted: { Args: { _product_id: string }; Returns: boolean }
      recharge_wallet: {
        Args: {
          _amount: number
          _paystack_reference: string
          _seller_id: string
        }
        Returns: boolean
      }
      request_withdrawal: {
        Args: {
          _amount: number
          _destination: string
          _destination_name?: string
          _method: string
          _user_id: string
        }
        Returns: Json
      }
      review_kyc: {
        Args: { _admin_note?: string; _kyc_id: string; _status: string }
        Returns: Json
      }
      search_products: {
        Args: {
          search_query: string
          user_city?: string
          user_country?: string
        }
        Returns: {
          badge: string
          category: string
          city: string
          commune: string
          country: string
          description: string
          discount_percentage: number
          id: string
          images: string[]
          is_flash_sale: boolean
          original_price: number
          price: number
          rating: number
          relevance_score: number
          reviews_count: number
          seller_id: string
          title: string
          video_url: string
        }[]
      }
      search_suggestions: {
        Args: { max_results?: number; search_query: string }
        Returns: {
          category: string
          id: string
          title: string
          type: string
        }[]
      }
      toggle_publication_bonus: {
        Args: { p_active: boolean; p_bonus_id: string }
        Returns: Json
      }
      update_order_status: {
        Args: { new_status: string; order_id: string }
        Returns: boolean
      }
      upgrade_to_seller: {
        Args: { _first_name: string; _last_name: string; _phone: string }
        Returns: Json
      }
      validate_pending_commissions: { Args: never; Returns: number }
      verify_email_with_token: { Args: { _token: string }; Returns: Json }
    }
    Enums: {
      seller_type: "particulier" | "pro" | "premium"
      user_role:
        | "buyer"
        | "seller"
        | "admin"
        | "superadmin"
        | "super_admin_business"
        | "admin_finance"
        | "admin_vendeurs"
        | "admin_marketing"
        | "partner"
        | "driver"
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
      seller_type: ["particulier", "pro", "premium"],
      user_role: [
        "buyer",
        "seller",
        "admin",
        "superadmin",
        "super_admin_business",
        "admin_finance",
        "admin_vendeurs",
        "admin_marketing",
        "partner",
        "driver",
      ],
    },
  },
} as const
