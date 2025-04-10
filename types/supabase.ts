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
          created_at: string | null
          updated_at: string | null
          email: string
          full_name: string
          role: string
          status: string
        }
        Insert: {
          id: string
          created_at?: string | null
          updated_at?: string | null
          email: string
          full_name: string
          role: string
          status?: string
        }
        Update: {
          id?: string
          created_at?: string | null
          updated_at?: string | null
          email?: string
          full_name?: string
          role?: string
          status?: string
        }
      }
      // Add other tables as needed
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