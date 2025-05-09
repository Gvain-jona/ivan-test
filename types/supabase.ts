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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      allowed_emails: {
        Row: {
          access_code: string
          created_at: string
          email: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          access_code?: string
          created_at?: string
          email: string
          id?: string
          role?: string
          updated_at?: string
        }
        Update: {
          access_code?: string
          created_at?: string
          email?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      allowed_emails_backup: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          created_at: string
          details: Json
          event_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json
          event_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json
          event_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_audit_log: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_users: {
        Row: {
          backed_up_at: string | null
          email: string
          id: string
          role: string
        }
        Insert: {
          backed_up_at?: string | null
          email: string
          id: string
          role: string
        }
        Update: {
          backed_up_at?: string | null
          email?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          client_type: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          client_type?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          client_type?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      expense_payments: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          date: string
          expense_id: string | null
          id: string
          payment_method: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          date?: string
          expense_id?: string | null
          id?: string
          payment_method: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          date?: string
          expense_id?: string | null
          id?: string
          payment_method?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_payments_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount_paid: number
          balance: number | null
          category: string
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          id: string
          is_recurring: boolean | null
          item_name: string | null
          next_occurrence_date: string | null
          notes: string | null
          payment_status: string
          quantity: number | null
          recurrence_end_date: string | null
          recurrence_frequency: string | null
          recurrence_start_date: string | null
          reminder_days: number | null
          responsible: string | null
          total_amount: number
          unit_cost: number | null
          updated_at: string | null
          vat: number | null
        }
        Insert: {
          amount_paid?: number
          balance?: number | null
          category: string
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          item_name?: string | null
          next_occurrence_date?: string | null
          notes?: string | null
          payment_status: string
          quantity?: number | null
          recurrence_end_date?: string | null
          recurrence_frequency?: string | null
          recurrence_start_date?: string | null
          reminder_days?: number | null
          responsible?: string | null
          total_amount?: number
          unit_cost?: number | null
          updated_at?: string | null
          vat?: number | null
        }
        Update: {
          amount_paid?: number
          balance?: number | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          item_name?: string | null
          next_occurrence_date?: string | null
          notes?: string | null
          payment_status?: string
          quantity?: number | null
          recurrence_end_date?: string | null
          recurrence_frequency?: string | null
          recurrence_start_date?: string | null
          reminder_days?: number | null
          responsible?: string | null
          total_amount?: number
          unit_cost?: number | null
          updated_at?: string | null
          vat?: number | null
        }
        Relationships: []
      }
      expenses_backup: {
        Row: {
          amount_paid: number | null
          balance: number | null
          category: string | null
          created_at: string | null
          created_by: string | null
          date: string | null
          description: string | null
          expense_type: string | null
          id: string | null
          is_recurring: boolean | null
          item_name: string | null
          next_occurrence_date: string | null
          notes: string | null
          payment_status: string | null
          quantity: number | null
          recurrence_end_date: string | null
          recurrence_frequency: string | null
          recurrence_start_date: string | null
          reminder_days: number | null
          responsible: string | null
          total_amount: number | null
          unit_cost: number | null
          updated_at: string | null
          vat: number | null
        }
        Insert: {
          amount_paid?: number | null
          balance?: number | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          expense_type?: string | null
          id?: string | null
          is_recurring?: boolean | null
          item_name?: string | null
          next_occurrence_date?: string | null
          notes?: string | null
          payment_status?: string | null
          quantity?: number | null
          recurrence_end_date?: string | null
          recurrence_frequency?: string | null
          recurrence_start_date?: string | null
          reminder_days?: number | null
          responsible?: string | null
          total_amount?: number | null
          unit_cost?: number | null
          updated_at?: string | null
          vat?: number | null
        }
        Update: {
          amount_paid?: number | null
          balance?: number | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          expense_type?: string | null
          id?: string | null
          is_recurring?: boolean | null
          item_name?: string | null
          next_occurrence_date?: string | null
          notes?: string | null
          payment_status?: string | null
          quantity?: number | null
          recurrence_end_date?: string | null
          recurrence_frequency?: string | null
          recurrence_start_date?: string | null
          reminder_days?: number | null
          responsible?: string | null
          total_amount?: number | null
          unit_cost?: number | null
          updated_at?: string | null
          vat?: number | null
        }
        Relationships: []
      }
      invoice_settings: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean
          name: string
          settings: Json
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean
          name?: string
          settings: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean
          name?: string
          settings?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string | null
          created_by: string | null
          file_url: string
          id: string
          invoice_date: string | null
          invoice_number: string
          is_proforma: boolean | null
          order_id: string | null
          settings: Json | null
          storage_path: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          file_url: string
          id?: string
          invoice_date?: string | null
          invoice_number: string
          is_proforma?: boolean | null
          order_id?: string | null
          settings?: Json | null
          storage_path: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          file_url?: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string
          is_proforma?: boolean | null
          order_id?: string | null
          settings?: Json | null
          storage_path?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          category_id: string | null
          cost: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          price: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          price?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          price?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      material_payments: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          date: string
          id: string
          payment_method: string
          purchase_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          payment_method: string
          purchase_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          payment_method?: string
          purchase_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_payments_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "material_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      material_purchases: {
        Row: {
          amount_paid: number
          balance: number | null
          created_at: string | null
          created_by: string | null
          date: string
          id: string
          notes: string | null
          payment_status: string
          supplier_id: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number
          balance?: number | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          notes?: string | null
          payment_status: string
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number
          balance?: number | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          notes?: string | null
          payment_status?: string
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          linked_item_id: string
          linked_item_type: string
          text: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          linked_item_id: string
          linked_item_type: string
          text: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          linked_item_id?: string
          linked_item_type?: string
          text?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notes_order_backup: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string | null
          linked_item_id: string | null
          linked_item_type: string | null
          text: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string | null
          linked_item_id?: string | null
          linked_item_type?: string | null
          text?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string | null
          linked_item_id?: string | null
          linked_item_type?: string | null
          text?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          push_message: string | null
          status: string
          timestamp: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          push_message?: string | null
          status?: string
          timestamp?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          push_message?: string | null
          status?: string
          timestamp?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          category_id: string | null
          category_name: string
          created_at: string | null
          id: string
          item_id: string | null
          item_name: string
          labor_amount: number | null
          order_id: string | null
          profit_amount: number | null
          quantity: number
          size: string
          total_amount: number | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          category_name: string
          created_at?: string | null
          id?: string
          item_id?: string | null
          item_name: string
          labor_amount?: number | null
          order_id?: string | null
          profit_amount?: number | null
          quantity: number
          size: string
          total_amount?: number | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          category_name?: string
          created_at?: string | null
          id?: string
          item_id?: string | null
          item_name?: string
          labor_amount?: number | null
          order_id?: string | null
          profit_amount?: number | null
          quantity?: number
          size?: string
          total_amount?: number | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items_backup: {
        Row: {
          category_id: string | null
          category_name: string | null
          created_at: string | null
          id: string | null
          item_id: string | null
          item_name: string | null
          labor_amount: number | null
          order_id: string | null
          profit_amount: number | null
          quantity: number | null
          size: string | null
          total_amount: number | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          id?: string | null
          item_id?: string | null
          item_name?: string | null
          labor_amount?: number | null
          order_id?: string | null
          profit_amount?: number | null
          quantity?: number | null
          size?: string | null
          total_amount?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          id?: string | null
          item_id?: string | null
          item_name?: string | null
          labor_amount?: number | null
          order_id?: string | null
          profit_amount?: number | null
          quantity?: number | null
          size?: string | null
          total_amount?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      order_payments: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          id: string
          order_id: string | null
          payment_method: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          date?: string
          id?: string
          order_id?: string | null
          payment_method: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          id?: string
          order_id?: string | null
          payment_method?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payments_backup: {
        Row: {
          amount: number | null
          created_at: string | null
          date: string | null
          id: string | null
          order_id: string | null
          payment_method: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          date?: string | null
          id?: string | null
          order_id?: string | null
          payment_method?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          date?: string | null
          id?: string | null
          order_id?: string | null
          payment_method?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount_paid: number
          balance: number | null
          client_id: string | null
          client_name: string | null
          client_type: string | null
          created_at: string | null
          created_by: string | null
          date: string
          delivery_date: string | null
          id: string
          invoice_generated_at: string | null
          is_delivered: boolean | null
          order_number: string
          payment_status: string
          status: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number
          balance?: number | null
          client_id?: string | null
          client_name?: string | null
          client_type?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          delivery_date?: string | null
          id?: string
          invoice_generated_at?: string | null
          is_delivered?: boolean | null
          order_number: string
          payment_status: string
          status: string
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number
          balance?: number | null
          client_id?: string | null
          client_name?: string | null
          client_type?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          delivery_date?: string | null
          id?: string
          invoice_generated_at?: string | null
          is_delivered?: boolean | null
          order_number?: string
          payment_status?: string
          status?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      orders_backup: {
        Row: {
          amount_paid: number | null
          balance: number | null
          client_id: string | null
          client_type: string | null
          created_at: string | null
          created_by: string | null
          date: string | null
          id: string | null
          invoice_generated_at: string | null
          latest_invoice_id: string | null
          notes: Json | null
          order_number: string | null
          payment_method: string | null
          payment_status: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          balance?: number | null
          client_id?: string | null
          client_type?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          id?: string | null
          invoice_generated_at?: string | null
          latest_invoice_id?: string | null
          notes?: Json | null
          order_number?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          balance?: number | null
          client_id?: string | null
          client_type?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          id?: string | null
          invoice_generated_at?: string | null
          latest_invoice_id?: string | null
          notes?: Json | null
          order_number?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          role: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          role: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles_backup: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles_backup_20250920: {
        Row: {
          code_expiry: string | null
          created_at: string | null
          email: string | null
          failed_attempts: number | null
          full_name: string | null
          id: string | null
          is_verified: boolean | null
          pin: string | null
          role: string | null
          status: string | null
          updated_at: string | null
          verification_code: string | null
        }
        Insert: {
          code_expiry?: string | null
          created_at?: string | null
          email?: string | null
          failed_attempts?: number | null
          full_name?: string | null
          id?: string | null
          is_verified?: boolean | null
          pin?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
          verification_code?: string | null
        }
        Update: {
          code_expiry?: string | null
          created_at?: string | null
          email?: string | null
          failed_attempts?: number | null
          full_name?: string | null
          id?: string | null
          is_verified?: boolean | null
          pin?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
          verification_code?: string | null
        }
        Relationships: []
      }
      recurring_expense_occurrences: {
        Row: {
          created_at: string | null
          id: string
          occurrence_date: string
          parent_expense_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          occurrence_date: string
          parent_expense_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          occurrence_date?: string
          parent_expense_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_expense_occurrences_parent_expense_id_fkey"
            columns: ["parent_expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      sizes: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_date: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_date?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority: string
          status: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_date?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_allowed_email: {
        Args: { user_email: string; user_role?: string }
        Returns: string
      }
      add_new_user: {
        Args: { user_email: string; user_role?: string }
        Returns: string
      }
      add_order_note: {
        Args: {
          p_order_id: string
          p_type: string
          p_text: string
          p_created_by: string
        }
        Returns: string
      }
      add_order_payment: {
        Args: {
          p_order_id: string
          p_amount: number
          p_payment_date: string
          p_payment_type: string
        }
        Returns: string
      }
      admin_fix_profiles_rls: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      batch_process_order_items: {
        Args: { p_order_id: string; p_items: Json }
        Returns: undefined
      }
      calculate_next_occurrence: {
        Args: { expense_id: string }
        Returns: undefined
      }
      check_and_fix_database_integrity: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      check_can_insert: {
        Args: { table_name: string }
        Returns: boolean
      }
      check_rls_enabled: {
        Args: { table_name: string }
        Returns: boolean
      }
      check_user_exists_by_email: {
        Args: { user_email: string }
        Returns: {
          user_exists: boolean
          user_id: string
          email: string
          user_status: string
        }[]
      }
      check_user_exists_by_email_simple: {
        Args: { input_email: string }
        Returns: boolean
      }
      cleanup_auth_backups: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_auth_user: {
        Args: { user_email: string; user_role?: string }
        Returns: string
      }
      create_complete_order: {
        Args: {
          p_client_id: string
          p_client_name: string
          p_date: string
          p_status: string
          p_payment_status: string
          p_client_type: string
          p_items: Json
          p_payments?: Json
          p_notes?: Json
          p_delivery_date?: string
          p_is_delivered?: boolean
        }
        Returns: Json
      }
      create_order: {
        Args: {
          p_client_id: string
          p_date: string
          p_status: string
          p_items: Json
          p_created_by: string
        }
        Returns: string
      }
      create_order_notification: {
        Args: {
          p_order_id: string
          p_type: string
          p_title: string
          p_message: string
          p_user_id?: string
        }
        Returns: string
      }
      create_order_with_items: {
        Args: {
          p_client_id: string
          p_client_type?: string
          p_date?: string
          p_status?: string
          p_payment_status?: string
          p_items?: Json
        }
        Returns: string
      }
      delete_order: {
        Args: { p_order_id: string }
        Returns: boolean
      }
      disable_rls_for_request: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      ensure_client_exists: {
        Args: { p_client_id: string }
        Returns: string
      }
      fix_order_data_issues: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_invoice_number: {
        Args: { p_order_id: string }
        Returns: string
      }
      generate_verification_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_database_size_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          item_name: string
          size_bytes: number
          size_readable: string
        }[]
      }
      get_functions: {
        Args: Record<PropertyKey, never>
        Returns: {
          routine_name: string
          routine_definition: string
        }[]
      }
      get_next_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_order_details: {
        Args: { p_order_id: string }
        Returns: Json
      }
      get_rls_policies: {
        Args: { table_name: string }
        Returns: {
          policy_name: string
          policy_command: string
          policy_roles: string[]
          policy_using: string
          policy_check: string
        }[]
      }
      get_table_constraints: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          constraint_name: string
          constraint_type: string
          column_name: string
          check_clause: string
        }[]
      }
      get_table_record_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          record_count: number
        }[]
      }
      get_tables: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_schema: string
          table_name: string
          table_type: string
        }[]
      }
      get_triggers: {
        Args: Record<PropertyKey, never>
        Returns: {
          trigger_name: string
          event_manipulation: string
          event_object_table: string
          action_statement: string
          action_timing: string
        }[]
      }
      handle_failed_login: {
        Args: { user_id: string }
        Returns: undefined
      }
      handle_mfa_enrollment: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_email_allowed: {
        Args: { input_email: string }
        Returns: boolean
      }
      is_email_in_auth_users: {
        Args: { input_email: string }
        Returns: boolean
      }
      is_manager_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_staff_or_above: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      lock_user_account: {
        Args: { user_id: string }
        Returns: boolean
      }
      log_auth_attempt: {
        Args: {
          user_email: string
          attempt_type: string
          error_message?: string
        }
        Returns: undefined
      }
      log_auth_event: {
        Args: {
          p_user_id: string
          p_event_type: string
          p_metadata_key?: string
          p_metadata_value?: string
        }
        Returns: string
      }
      manually_add_user: {
        Args: { user_email: string; user_role?: string; full_name?: string }
        Returns: string
      }
      reset_failed_login: {
        Args: { user_id: string }
        Returns: undefined
      }
      restore_auth_tables: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      restore_profiles_with_pin: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      unlock_user_account: {
        Args: { user_id: string }
        Returns: boolean
      }
      user_has_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      validate_magic_link_email: {
        Args: { email_to_check: string }
        Returns: boolean
      }
    }
    Enums: {
      auth_method_type: "magic_link" | "email_password" | "otp"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      auth_method_type: ["magic_link", "email_password", "otp"],
    },
  },
} as const
