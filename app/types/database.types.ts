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
      profiles: {
        Row: {
          id: string
          created_at: string
          email: string
          name: string | null
          avatar_url: string | null
          pin: string | null
          pin_verified: boolean
        }
        Insert: {
          id: string
          created_at?: string
          email: string
          name?: string | null
          avatar_url?: string | null
          pin?: string | null
          pin_verified?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          pin?: string | null
          pin_verified?: boolean
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
      orders: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          customer_name: string
          customer_email: string | null
          status: string
          total_amount: number
          payment_status: string
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          customer_name: string
          customer_email?: string | null
          status?: string
          total_amount: number
          payment_status?: string
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          customer_name?: string
          customer_email?: string | null
          status?: string
          total_amount?: number
          payment_status?: string
          notes?: string | null
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
      settings: {
        Row: {
          id: string
          created_at: string
          key: string
          value: string
          description: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          key: string
          value: string
          description?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          key?: string
          value?: string
          description?: string | null
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
