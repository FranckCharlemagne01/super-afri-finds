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
      products: {
        Row: {
          badge: string | null
          boosted_at: string | null
          boosted_until: string | null
          category: string
          city: string | null
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
          boosted_at?: string | null
          boosted_until?: string | null
          category: string
          city?: string | null
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
          boosted_at?: string | null
          boosted_until?: string | null
          category?: string
          city?: string | null
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
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          email_verification_expires_at: string | null
          email_verification_token: string | null
          email_verified: boolean | null
          full_name: string | null
          id: string
          is_premium: boolean | null
          paystack_reference: string | null
          phone: string | null
          premium_expires_at: string | null
          push_token: string | null
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
          country?: string | null
          created_at?: string
          email?: string | null
          email_verification_expires_at?: string | null
          email_verification_token?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          is_premium?: boolean | null
          paystack_reference?: string | null
          phone?: string | null
          premium_expires_at?: string | null
          push_token?: string | null
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
          country?: string | null
          created_at?: string
          email?: string | null
          email_verification_expires_at?: string | null
          email_verification_token?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          is_premium?: boolean | null
          paystack_reference?: string | null
          phone?: string | null
          premium_expires_at?: string | null
          push_token?: string | null
          trial_bonus_tokens_given?: boolean | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          trial_used?: boolean | null
          updated_at?: string
          user_id?: string
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
          created_at: string
          free_tokens_count: number | null
          free_tokens_expires_at: string | null
          id: string
          paid_tokens_count: number | null
          seller_id: string
          token_balance: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          free_tokens_count?: number | null
          free_tokens_expires_at?: string | null
          id?: string
          paid_tokens_count?: number | null
          seller_id: string
          token_balance?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          free_tokens_count?: number | null
          free_tokens_expires_at?: string | null
          id?: string
          paid_tokens_count?: number | null
          seller_id?: string
          token_balance?: number
          updated_at?: string
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
    }
    Views: {
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
      check_token_balance: { Args: { _seller_id: string }; Returns: Json }
      cleanup_expired_otp: { Args: never; Returns: undefined }
      confirm_sale_by_seller: {
        Args: { _mark_product_as_sold?: boolean; _order_id: string }
        Returns: Json
      }
      consume_token_for_publication: {
        Args: { _product_id?: string; _seller_id: string }
        Returns: boolean
      }
      create_shops_for_existing_sellers: { Args: never; Returns: undefined }
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
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
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
          shop_id: string
          title: string
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
      update_order_status: {
        Args: { new_status: string; order_id: string }
        Returns: boolean
      }
      upgrade_to_seller: {
        Args: { _first_name: string; _last_name: string; _phone: string }
        Returns: Json
      }
      verify_email_with_token: { Args: { _token: string }; Returns: Json }
    }
    Enums: {
      user_role: "buyer" | "seller" | "admin" | "superadmin"
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
      user_role: ["buyer", "seller", "admin", "superadmin"],
    },
  },
} as const
