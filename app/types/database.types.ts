export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          status: string
          customer_name: string
          customer_email: string | null
          customer_phone: string | null
          total_amount: number
          payment_status: string
          notes: string | null
          order_number: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          status: string
          customer_name: string
          customer_email?: string | null
          customer_phone?: string | null
          total_amount: number
          payment_status: string
          notes?: string | null
          order_number?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          status?: string
          customer_name?: string
          customer_email?: string | null
          customer_phone?: string | null
          total_amount?: number
          payment_status?: string
          notes?: string | null
          order_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string | null
          email: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          role: string
          pin: string | null
          pin_verified: boolean
          is_verified: boolean
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string | null
          email: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          role?: string
          pin?: string | null
          pin_verified?: boolean
          is_verified?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          email?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          role?: string
          pin?: string | null
          pin_verified?: boolean
          is_verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          created_at: string
          user_id: string
          title: string
          message: string
          type: string
          read: boolean
          action_url: string | null
          related_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          title: string
          message: string
          type: string
          read?: boolean
          action_url?: string | null
          related_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          read?: boolean
          action_url?: string | null
          related_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      health_check: {
        Row: {
          id: string
          created_at: string
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          status: string
        }
        Update: {
          id?: string
          created_at?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
