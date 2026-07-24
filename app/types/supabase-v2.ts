/**
 * Hand-built from a live introspection of the `v2` schema on project
 * giwurfpxxktfsdyitgvr (2026-07-09), NOT `supabase gen types`.
 *
 * `v2` is not yet in this project's exposed-schemas API setting, so
 * `npx supabase gen types` cannot see it and silently omits it — it
 * only emits `public`/`storage`/`graphql_public`. Once `v2` is added
 * under Project Settings → API → Exposed schemas, regenerate this file
 * for real and delete this note.
 *
 * `balance` and `payment_status` on `orders` are Postgres GENERATED
 * columns — omitted from Insert/Update because writes to them are
 * rejected at the DB level, not just discouraged.
 * `activity_logs.id` is an ALWAYS identity column — omitted from
 * Insert for the same reason.
 * `activity_logs` also has a DB trigger blocking UPDATE/DELETE
 * entirely (append-only) — the Update type below is structurally
 * valid but using it against a real row will fail at the DB.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type DatabaseV2 = {
  v2: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string | null
          owner_user_id: string | null
          status: string
          is_sandbox: boolean
          deleted_at: string | null
          settings: Json
          /** Clerk's org_... id — Clerk Organizations is the source of
           *  truth for name/logo/membership; this table mirrors it plus
           *  app-only fields (settings, counters). Null for orgs
           *  created before the Clerk-org sync existed. */
          clerk_org_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          owner_user_id?: string | null
          status?: string
          is_sandbox?: boolean
          deleted_at?: string | null
          settings?: Json
          clerk_org_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          owner_user_id?: string | null
          status?: string
          is_sandbox?: boolean
          deleted_at?: string | null
          settings?: Json
          clerk_org_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          organization_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          organization_id: string
          user_id: string
          role?: string
          created_at?: string
        }
        Update: {
          organization_id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          user_id: string
          active_organization_id: string | null
          updated_at: string
        }
        Insert: {
          user_id: string
          active_organization_id?: string | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          active_organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_active_organization_id_fkey"
            columns: ["active_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      counters: {
        Row: {
          organization_id: string
          counter_key: string
          current_value: number
          format: string
        }
        Insert: {
          organization_id: string
          counter_key: string
          current_value?: number
          format?: string
        }
        Update: {
          organization_id?: string
          counter_key?: string
          current_value?: number
          format?: string
        }
        Relationships: [
          {
            foreignKeyName: "counters_business_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      field_definitions: {
        Row: {
          id: string
          organization_id: string
          entity: string
          field_name: string
          field_label: string
          field_type: string
          is_required: boolean
          is_unique: boolean
          options: Json | null
          related_entity: string | null
          display_field: string | null
          conditions: Json | null
          field_group: string | null
          show_in_documents: boolean
          inherit_from: string | null
          sort_order: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          entity: string
          field_name: string
          field_label: string
          field_type: string
          is_required?: boolean
          is_unique?: boolean
          options?: Json | null
          related_entity?: string | null
          display_field?: string | null
          conditions?: Json | null
          field_group?: string | null
          show_in_documents?: boolean
          inherit_from?: string | null
          sort_order?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          entity?: string
          field_name?: string
          field_label?: string
          field_type?: string
          is_required?: boolean
          is_unique?: boolean
          options?: Json | null
          related_entity?: string | null
          display_field?: string | null
          conditions?: Json | null
          field_group?: string | null
          show_in_documents?: boolean
          inherit_from?: string | null
          sort_order?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_definitions_business_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          id: string
          organization_id: string
          name: string
          status: string
          custom_data: Json
          source_ids: string[] | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          status?: string
          custom_data?: Json
          source_ids?: string[] | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          status?: string
          custom_data?: Json
          source_ids?: string[] | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_business_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          id: string
          organization_id: string
          name: string
          selling_price: number | null
          status: string
          custom_data: Json
          name_variants: string[] | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          selling_price?: number | null
          status?: string
          custom_data?: Json
          name_variants?: string[] | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          selling_price?: number | null
          status?: string
          custom_data?: Json
          name_variants?: string[] | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          id: string
          organization_id: string
          order_number: string
          client_id: string
          order_date: string
          status: string
          total_amount: number
          amount_paid: number
          balance: number | null
          payment_status: string | null
          custom_data: Json
          source_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          order_number: string
          client_id: string
          order_date?: string
          status?: string
          total_amount?: number
          amount_paid?: number
          custom_data?: Json
          source_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          order_number?: string
          client_id?: string
          order_date?: string
          status?: string
          total_amount?: number
          amount_paid?: number
          custom_data?: Json
          source_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          organization_id: string
          order_id: string
          product_id: string | null
          product_name_raw: string | null
          quantity: number
          unit_price: number
          discount: number
          total_amount: number
          custom_data: Json
          source_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          order_id: string
          product_id?: string | null
          product_name_raw?: string | null
          quantity?: number
          unit_price?: number
          discount?: number
          total_amount?: number
          custom_data?: Json
          source_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          order_id?: string
          product_id?: string | null
          product_name_raw?: string | null
          quantity?: number
          unit_price?: number
          discount?: number
          total_amount?: number
          custom_data?: Json
          source_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_business_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          id: string
          organization_id: string
          entity_type: string
          entity_id: string
          amount: number
          payment_date: string
          payment_method: string
          notes: string | null
          source_id: string | null
          source_table: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          entity_type: string
          entity_id: string
          amount: number
          payment_date: string
          payment_method?: string
          notes?: string | null
          source_id?: string | null
          source_table?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          entity_type?: string
          entity_id?: string
          amount?: number
          payment_date?: string
          payment_method?: string
          notes?: string | null
          source_id?: string | null
          source_table?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_business_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          id: string
          organization_id: string
          entity_type: string
          entity_id: string
          content: string
          source_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          entity_type: string
          entity_id: string
          content: string
          source_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          entity_type?: string
          entity_id?: string
          content?: string
          source_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_business_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          id: string
          organization_id: string
          entity_type: string
          entity_id: string
          file_url: string
          file_name: string
          file_type: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          entity_type: string
          entity_id: string
          file_url: string
          file_name: string
          file_type?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          entity_type?: string
          entity_id?: string
          file_url?: string
          file_name?: string
          file_type?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_business_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      /** Append-only: a DB trigger rejects UPDATE and DELETE outright. */
      activity_logs: {
        Row: {
          id: number
          organization_id: string
          entity_type: string
          entity_id: string
          action: string
          field_name: string | null
          old_value: Json | null
          new_value: Json | null
          performed_by: string | null
          created_at: string
          grant_id: string | null
        }
        Insert: {
          organization_id: string
          entity_type: string
          entity_id: string
          action: string
          field_name?: string | null
          old_value?: Json | null
          new_value?: Json | null
          performed_by?: string | null
          created_at?: string
          grant_id?: string | null
        }
        Update: {
          organization_id?: string
          entity_type?: string
          entity_id?: string
          action?: string
          field_name?: string | null
          old_value?: Json | null
          new_value?: Json | null
          performed_by?: string | null
          created_at?: string
          grant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_business_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          id: string
          organization_id: string
          entity_type: string
          entity_id: string
          document_type: string
          document_number: string
          snapshot: Json
          status: string
          valid_until: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          entity_type: string
          entity_id: string
          document_type: string
          document_number: string
          snapshot?: Json
          status?: string
          valid_until?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          entity_type?: string
          entity_id?: string
          document_type?: string
          document_number?: string
          snapshot?: Json
          status?: string
          valid_until?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_business_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      // Trigger-only functions (reject_mutation, recompute_order_totals,
      // recompute_order_paid, protect_issued_documents, validate_custom_data)
      // and the auth hook (auth_hook_add_claims) are intentionally excluded —
      // they aren't meant to be invoked as RPCs from the frontend.
      create_order: {
        Args: { payload: Json }
        Returns: string
      }
      /**
       * INTERIM service-role shim (see supabase/migrations/
       * 20260710000000_create_order_as_org_interim_shim.sql): injects
       * org/user claims then delegates to create_order. Granted to
       * service_role only; drop when Clerk JWTs carry organization_id.
       */
      create_order_as_org: {
        Args: { p_org: string; p_user: string; payload: Json }
        Returns: string
      }
      next_number: {
        Args: { p_counter_key: string; p_org?: string | null }
        Returns: string
      }
      current_org_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      /**
       * Atomic first-provisioning for a new Clerk Organization (see
       * supabase/migrations/20260724000000_add_clerk_org_mapping_and_
       * provisioning.sql): org row + owner membership + starter
       * counters. Called from app/api/webhooks/clerk on
       * organization.created. Idempotent by clerk_org_id. Granted to
       * service_role only.
       */
      provision_organization: {
        Args: { p_clerk_org_id: string; p_name: string; p_owner_user_id: string; p_slug?: string | null }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
