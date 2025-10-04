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
        ]
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
          created_at: string
          description: string | null
          discount_percentage: number | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_boosted: boolean | null
          is_flash_sale: boolean | null
          original_price: number | null
          price: number
          rating: number | null
          reviews_count: number | null
          seller_id: string
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
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_boosted?: boolean | null
          is_flash_sale?: boolean | null
          original_price?: number | null
          price: number
          rating?: number | null
          reviews_count?: number | null
          seller_id: string
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
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_boosted?: boolean | null
          is_flash_sale?: boolean | null
          original_price?: number | null
          price?: number
          rating?: number | null
          reviews_count?: number | null
          seller_id?: string
          stock_quantity?: number | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_premium: boolean | null
          paystack_reference: string | null
          phone: string | null
          premium_expires_at: string | null
          push_token: string | null
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
          full_name?: string | null
          id?: string
          is_premium?: boolean | null
          paystack_reference?: string | null
          phone?: string | null
          premium_expires_at?: string | null
          push_token?: string | null
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
          full_name?: string | null
          id?: string
          is_premium?: boolean | null
          paystack_reference?: string | null
          phone?: string | null
          premium_expires_at?: string | null
          push_token?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          trial_used?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seller_tokens: {
        Row: {
          created_at: string
          id: string
          seller_id: string
          token_balance: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          seller_id: string
          token_balance?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          seller_id?: string
          token_balance?: number
          updated_at?: string
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
      [_ in never]: never
    }
    Functions: {
      add_tokens_after_purchase: {
        Args: {
          _paystack_reference: string
          _price_paid: number
          _seller_id: string
          _tokens_amount: number
        }
        Returns: boolean
      }
      assign_current_user_superadmin: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      assign_superadmin_role: {
        Args: { _email: string }
        Returns: string
      }
      boost_product: {
        Args: { _product_id: string; _seller_id: string }
        Returns: boolean
      }
      can_publish_products: {
        Args: { _user_id: string }
        Returns: boolean
      }
      cancel_order_by_customer: {
        Args: { order_id: string }
        Returns: Json
      }
      consume_token_for_publication: {
        Args: { _product_id: string; _seller_id: string }
        Returns: boolean
      }
      get_admin_statistics: {
        Args: Record<PropertyKey, never>
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
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_seller_orders: {
        Args: Record<PropertyKey, never>
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_users_with_profiles: {
        Args: Record<PropertyKey, never>
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
      is_in_trial_period: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_product_boosted: {
        Args: { _product_id: string }
        Returns: boolean
      }
      update_order_status: {
        Args: { new_status: string; order_id: string }
        Returns: boolean
      }
      upgrade_to_seller: {
        Args: { _first_name: string; _last_name: string; _phone: string }
        Returns: Json
      }
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
