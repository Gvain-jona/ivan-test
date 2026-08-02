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
          /** When first-run setup finished. Null = the getting-started
           *  wizard still owns the entry point. A column rather than a
           *  settings block on purpose: settings is config frozen into
           *  document snapshots, setup progress is lifecycle state. */
          onboarding_completed_at: string | null
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
          onboarding_completed_at?: string | null
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
          onboarding_completed_at?: string | null
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
      /**
       * Numbering sequences, one row per key ('order', 'doc:invoice',
       * 'doc:quotation', …). A `doc:{type}` row is also what makes that
       * document_type legal for the org — validate_document_type() checks
       * for it, so there is no enum or lookup table of document types.
       */
      counters: {
        Row: {
          organization_id: string
          counter_key: string
          current_value: number
          format: string
          /** The period current_value belongs to. When it stops matching the
           *  policy's period, the next allocation resets to 1. */
          period_key: string | null
          /** 'never' | 'yearly' | 'monthly'. Must agree with the format: a
           *  {YYYY} format with 'never' produces numbers that lie. */
          reset_policy: string
        }
        Insert: {
          organization_id: string
          counter_key: string
          current_value?: number
          format?: string
          period_key?: string | null
          reset_policy?: string
        }
        Update: {
          organization_id?: string
          counter_key?: string
          current_value?: number
          format?: string
          period_key?: string | null
          reset_policy?: string
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
          is_system: boolean
          default_value: Json | null
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
          is_system?: boolean
          default_value?: Json | null
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
          is_system?: boolean
          default_value?: Json | null
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
      /**
       * A cash event: one real-world movement of money, one row. It is NOT
       * attached to what it pays for — `entity_type`/`entity_id` were dropped
       * in the 2026-07-29 money rewrite. What a payment settles lives in
       * payment_allocations; a payment with no allocations is unapplied
       * credit on the party account.
       */
      payments: {
        Row: {
          id: string
          organization_id: string
          /** 'in' = received (A/R), 'out' = paid (A/P). Amount is always
           *  positive; direction carries the sign. */
          direction: string
          /** 'client' | 'supplier'. Null for a walk-in with no record yet.
           *  Always null or non-null together with party_id. */
          party_type: string | null
          /** FK-by-convention into clients (or the future suppliers table);
           *  not a hard FK because the target table varies. */
          party_id: string | null
          amount: number
          payment_date: string
          payment_method: string
          /** Mobile money transaction id, cheque number, bank slip. */
          reference: string | null
          notes: string | null
          custom_data: Json
          source_id: string | null
          source_table: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          direction?: string
          party_type?: string | null
          party_id?: string | null
          amount: number
          payment_date: string
          payment_method?: string
          reference?: string | null
          notes?: string | null
          custom_data?: Json
          source_id?: string | null
          source_table?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          direction?: string
          party_type?: string | null
          party_id?: string | null
          amount?: number
          payment_date?: string
          payment_method?: string
          reference?: string | null
          notes?: string | null
          custom_data?: Json
          source_id?: string | null
          source_table?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
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
      /**
       * What a cash event settled. Zero allocations = unapplied credit;
       * deleting one returns the money to unapplied and never destroys the
       * payment. orders.amount_paid is derived from these by trigger, so
       * writing it directly is always wrong.
       *
       * SINGLE RECEIVABLE rule, enforced by validate_payment_allocation():
       * allocate to the order before an invoice exists, to the document once
       * a live one does.
       */
      payment_allocations: {
        Row: {
          id: string
          organization_id: string
          payment_id: string
          /** 'order' | 'document' | 'expense' | 'material_purchase'. */
          target_type: string
          target_id: string
          amount: number
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          payment_id: string
          target_type: string
          target_id: string
          amount: number
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          payment_id?: string
          target_type?: string
          target_id?: string
          amount?: number
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
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
      /**
       * Files belonging to a record. `file_url` is gone (2026-07-29): every
       * bucket is private and there are no public URLs — reads go through a
       * short-lived signed URL minted per request from bucket+storage_path.
       *
       * Company files with no transaction behind them (licence, lease,
       * insurance) attach to entity_type='organization' and never appear in
       * documents.
       */
      attachments: {
        Row: {
          id: string
          organization_id: string
          /** 'order' | 'payment' | 'client' | 'document' | 'organization'.
           *  For 'organization', entity_id is the org's own id. */
          entity_type: string
          entity_id: string
          /** All buckets are private. Defaults to 'org-files'. */
          bucket: string
          /** Object key. Convention:
           *  {organization_id}/{entity_type}/{entity_id}/{uuid}-{filename}.
           *  The leading folder MUST be the org id — both a trigger and the
           *  storage.objects policies check it. */
          storage_path: string
          file_name: string
          file_type: string | null
          mime_type: string | null
          file_size_bytes: number | null
          /** 'active' | 'archived'. Archive-not-delete: archived rows stop
           *  rendering; removing the storage object is a separate step. */
          status: string
          custom_data: Json
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          entity_type: string
          entity_id: string
          bucket?: string
          storage_path: string
          file_name: string
          file_type?: string | null
          mime_type?: string | null
          file_size_bytes?: number | null
          status?: string
          custom_data?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          entity_type?: string
          entity_id?: string
          bucket?: string
          storage_path?: string
          file_name?: string
          file_type?: string | null
          mime_type?: string | null
          file_size_bytes?: number | null
          status?: string
          custom_data?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
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
      /**
       * A frozen, numbered financial record. Create these through
       * v2.issue_document() (via the issue_document_as_org shim), never by
       * inserting: `currency` is NOT NULL with no default on purpose, and
       * the totals must come from the same pass that builds the snapshot.
       *
       * Once status is sent/accepted/issued, protect_issued_documents()
       * rejects any change to the snapshot, the financial columns or the
       * number. Corrections are credit notes, not edits.
       */
      documents: {
        Row: {
          id: string
          organization_id: string
          /** 'order' | 'payment' | 'expense' | 'client' | 'organization'. */
          entity_type: string
          entity_id: string
          /** Org-defined: legal exactly when a `doc:{type}` counter exists. */
          document_type: string
          document_number: string
          snapshot: Json
          status: string
          /** ISO 4217, resolved from settings.locale.currency at issue time
           *  and frozen here. No schema default — the tenant states it. */
          currency: string
          /** Rate to the org base currency at issue time. */
          exchange_rate: number
          /** Whether the snapshot's line amounts are tax-inclusive. Without
           *  it, subtotal and tax_total are ambiguous. */
          amounts_include_tax: boolean
          subtotal: number
          discount_total: number
          tax_total: number
          /** Generated: subtotal - discount_total + tax_total. Read-only. */
          total: number | null
          valid_until: string | null
          /** Invoices only, from settings.documents.terms_days. Null = due on
           *  receipt. What debt aging measures from. */
          due_date: string | null
          /** When the number was allocated and the snapshot frozen —
           *  distinct from created_at. */
          issued_at: string | null
          /** A credit note points at the invoice it corrects. */
          related_document_id: string | null
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
          currency: string
          exchange_rate?: number
          amounts_include_tax?: boolean
          subtotal?: number
          discount_total?: number
          tax_total?: number
          valid_until?: string | null
          due_date?: string | null
          issued_at?: string | null
          related_document_id?: string | null
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
          currency?: string
          exchange_rate?: number
          amounts_include_tax?: boolean
          subtotal?: number
          discount_total?: number
          tax_total?: number
          valid_until?: string | null
          due_date?: string | null
          issued_at?: string | null
          related_document_id?: string | null
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
          {
            foreignKeyName: "documents_related_document_id_fkey"
            columns: ["related_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    /**
     * Deliberately empty even though v2 has two views
     * (v_payment_unallocated, v_payment_breakdown — see PaymentUnallocatedRow
     * and PaymentBreakdownRow at the bottom of this file).
     *
     * Declaring them here makes supabase-js widen its relation union, and
     * TenantDb's `from()` / `organization()` builders — which reference the
     * client's uninstantiated `from` return type — collapse to `{}`. Every
     * route then loses its column types silently. Put a view back here only
     * alongside a fix to those builders.
     */
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
        Args: {
          p_clerk_org_id: string
          p_name: string
          p_owner_user_id: string
          p_slug?: string | null
          /** Seeds settings.locale.currency at creation. Omit and the org
           *  has no currency until first-run setup sets one. */
          p_currency?: string | null
        }
        Returns: string
      }
      /**
       * The core product action: freezes an order into a numbered document.
       * Resolves org settings at this moment and writes them into the
       * snapshot, so later changes to identity, tax or terms never alter an
       * issued document. Does not render a PDF — a worker does that from the
       * snapshot, so a slow render can't fail an issue.
       *
       * Derives its tenant from JWT claims, so the app calls the
       * issue_document_as_org shim instead.
       */
      issue_document: {
        Args: { p_order_id: string; p_document_type: string; p_options?: Json }
        Returns: string
      }
      /**
       * INTERIM service-role shim (see supabase/migrations/
       * 20260731100000_issue_document_as_org_shim.sql): injects org/user
       * claims then delegates to issue_document. Granted to service_role
       * ONLY — the org id is an argument, so anyone who can execute this can
       * act as any tenant. Drop with create_order_as_org in Phase 2.
       */
      issue_document_as_org: {
        Args: {
          p_org: string
          p_user: string
          p_order_id: string
          p_document_type: string
          p_options?: Json
        }
        Returns: string
      }
      /**
       * Records a cash event and, optionally, what it settles, in one call.
       * payload.allocations is an array of {target_type, target_id, amount};
       * omit it to leave the money unapplied.
       */
      record_payment: {
        Args: { payload: Json }
        Returns: string
      }
      /**
       * INTERIM service-role shim (see supabase/migrations/
       * 20260731110000_record_payment_as_org_shim.sql): injects org/user
       * claims then delegates to record_payment. Granted to service_role
       * ONLY — p_org is an argument. Drop with the other two in Phase 2.
       */
      record_payment_as_org: {
        Args: { p_org: string; p_user: string; payload: Json }
        Returns: string
      }
      /**
       * Voids a document and releases the allocations pointing at it — the
       * cash returns to unapplied credit rather than disappearing.
       */
      void_document: {
        Args: { p_document_id: string }
        Returns: undefined
      }
      /**
       * Integrity check, not a hot path: returns rows only when derived money
       * has drifted from its source (order.amount_paid vs allocations,
       * over-allocated payments, cross-tenant or party-mismatched
       * allocations). Empty result = consistent.
       */
      reconcile_money: {
        Args: Record<PropertyKey, never>
        Returns: {
          violation: string
          entity_id: string
          expected: number
          found: number
        }[]
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

/**
 * v2 views, typed here rather than under `Views` above — see the comment
 * there for why. Query them through the raw client and annotate the result
 * with these; they are not reachable via TenantDb.from(), which only knows
 * about tables.
 */

/**
 * Unapplied cash per payment. `amount_unallocated > 0` is credit sitting on
 * the party's account, NOT revenue — any read layer that adds the two
 * together is overstating income.
 */
export interface PaymentUnallocatedRow {
  payment_id: string | null
  organization_id: string | null
  direction: string | null
  party_type: string | null
  party_id: string | null
  payment_date: string | null
  amount: number | null
  amount_allocated: number | null
  amount_unallocated: number | null
}

/** One row per allocation, joined to the order/document it settled. */
export interface PaymentBreakdownRow {
  payment_id: string | null
  organization_id: string | null
  payment_date: string | null
  payment_amount: number | null
  allocation_id: string | null
  target_type: string | null
  target_id: string | null
  allocated_amount: number | null
  document_number: string | null
  order_number: string | null
}
