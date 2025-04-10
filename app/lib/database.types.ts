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
          email: string
          full_name: string | null
          role: 'admin' | 'manager' | 'staff'
          status: 'active' | 'locked' | 'inactive'
          pin: string | null
          failed_attempts: number
          last_failed_attempt: string | null
          last_pin_entry: string | null
          locked_until: string | null
          verification_code: string | null
          code_expiry: string | null
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'manager' | 'staff'
          status?: 'active' | 'locked' | 'inactive'
          pin?: string | null
          failed_attempts?: number
          last_failed_attempt?: string | null
          last_pin_entry?: string | null
          locked_until?: string | null
          verification_code?: string | null
          code_expiry?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'manager' | 'staff'
          status?: 'active' | 'locked' | 'inactive'
          pin?: string | null
          failed_attempts?: number
          last_failed_attempt?: string | null
          last_pin_entry?: string | null
          locked_until?: string | null
          verification_code?: string | null
          code_expiry?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      auth_sessions: {
        Row: {
          id: string
          user_id: string
          device_id: string
          device_name: string
          user_agent: string
          last_pin_entry: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          device_id: string
          device_name: string
          user_agent: string
          last_pin_entry: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          device_id?: string
          device_name?: string
          user_agent?: string
          last_pin_entry?: string
          expires_at?: string
          created_at?: string
        }
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
  }
} 