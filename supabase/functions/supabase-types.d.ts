// Type definitions for Supabase tables
// This helps prevent TypeScript errors in edge functions

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: 'admin' | 'manager' | 'employee';
          status: 'active' | 'inactive' | 'pending';
          verification_code?: string;
          code_expiry?: string;
          is_verified: boolean;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          role: 'admin' | 'manager' | 'employee';
          status?: 'active' | 'inactive' | 'pending';
          verification_code?: string;
          code_expiry?: string;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: 'admin' | 'manager' | 'employee';
          status?: 'active' | 'inactive' | 'pending';
          verification_code?: string;
          code_expiry?: string;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          name: string;
          address?: string;
          contact?: string;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string;
          contact?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          contact?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      items: {
        Row: {
          id: string;
          name: string;
          category_id: string;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          name: string;
          category_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          address?: string;
          contact?: string;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string;
          contact?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          contact?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          client_id: string;
          date: string;
          status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled' | 'paused';
          payment_status: 'unpaid' | 'partially_paid' | 'paid';
          total_amount: number;
          amount_paid: number;
          balance: number;
          created_by: string;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          date: string;
          status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled' | 'paused';
          payment_status: 'unpaid' | 'partially_paid' | 'paid';
          total_amount: number;
          amount_paid: number;
          balance: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          date?: string;
          status?: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled' | 'paused';
          payment_status?: 'unpaid' | 'partially_paid' | 'paid';
          total_amount?: number;
          amount_paid?: number;
          balance?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          item_id: string;
          category_id: string;
          quantity: number;
          unit_price: number;
          total_amount: number;
          profit_amount: number;
          labor_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          item_id: string;
          category_id: string;
          quantity: number;
          unit_price: number;
          total_amount: number;
          profit_amount: number;
          labor_amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          item_id?: string;
          category_id?: string;
          quantity?: number;
          unit_price?: number;
          total_amount?: number;
          profit_amount?: number;
          labor_amount?: number;
          created_at?: string;
        };
      };
      order_payments: {
        Row: {
          id: string;
          order_id: string;
          amount: number;
          payment_date: string;
          payment_type: 'cash' | 'bank_transfer' | 'mobile_payment' | 'cheque';
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          amount: number;
          payment_date: string;
          payment_type: 'cash' | 'bank_transfer' | 'mobile_payment' | 'cheque';
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          amount?: number;
          payment_date?: string;
          payment_type?: 'cash' | 'bank_transfer' | 'mobile_payment' | 'cheque';
          created_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          date: string;
          category: string;
          description: string;
          total_amount: number;
          amount_paid: number;
          balance: number;
          installment: boolean;
          vat: number;
          created_by: string;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          date: string;
          category: string;
          description: string;
          total_amount: number;
          amount_paid: number;
          balance: number;
          installment: boolean;
          vat: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          category?: string;
          description?: string;
          total_amount?: number;
          amount_paid?: number;
          balance?: number;
          installment?: boolean;
          vat?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      expense_payments: {
        Row: {
          id: string;
          expense_id: string;
          amount: number;
          payment_date: string;
          payment_type: 'cash' | 'bank_transfer' | 'mobile_payment' | 'cheque';
          created_at: string;
        };
        Insert: {
          id?: string;
          expense_id: string;
          amount: number;
          payment_date: string;
          payment_type: 'cash' | 'bank_transfer' | 'mobile_payment' | 'cheque';
          created_at?: string;
        };
        Update: {
          id?: string;
          expense_id?: string;
          amount?: number;
          payment_date?: string;
          payment_type?: 'cash' | 'bank_transfer' | 'mobile_payment' | 'cheque';
          created_at?: string;
        };
      };
      material_purchases: {
        Row: {
          id: string;
          supplier_id: string;
          date: string;
          description: string;
          quantity: number;
          unit: string;
          total_amount: number;
          amount_paid: number;
          balance: number;
          installment: boolean;
          created_by: string;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          supplier_id: string;
          date: string;
          description: string;
          quantity: number;
          unit: string;
          total_amount: number;
          amount_paid: number;
          balance: number;
          installment: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          supplier_id?: string;
          date?: string;
          description?: string;
          quantity?: number;
          unit?: string;
          total_amount?: number;
          amount_paid?: number;
          balance?: number;
          installment?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      material_purchase_payments: {
        Row: {
          id: string;
          material_purchase_id: string;
          amount: number;
          payment_date: string;
          payment_type: 'cash' | 'bank_transfer' | 'mobile_payment' | 'cheque';
          created_at: string;
        };
        Insert: {
          id?: string;
          material_purchase_id: string;
          amount: number;
          payment_date: string;
          payment_type: 'cash' | 'bank_transfer' | 'mobile_payment' | 'cheque';
          created_at?: string;
        };
        Update: {
          id?: string;
          material_purchase_id?: string;
          amount?: number;
          payment_date?: string;
          payment_type?: 'cash' | 'bank_transfer' | 'mobile_payment' | 'cheque';
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description?: string;
          due_date: string;
          priority: 'low' | 'medium' | 'high';
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          linked_item_type: 'order' | 'expense' | 'purchase' | 'none';
          linked_item_id?: string;
          recurring: boolean;
          assigned_to: string;
          created_by: string;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          due_date: string;
          priority: 'low' | 'medium' | 'high';
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          linked_item_type: 'order' | 'expense' | 'purchase' | 'none';
          linked_item_id?: string;
          recurring: boolean;
          assigned_to: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          due_date?: string;
          priority?: 'low' | 'medium' | 'high';
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          linked_item_type?: 'order' | 'expense' | 'purchase' | 'none';
          linked_item_id?: string;
          recurring?: boolean;
          assigned_to?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          type: 'info' | 'warning' | 'urgent' | 'client_follow_up' | 'internal';
          text: string;
          linked_item_type: 'order' | 'expense' | 'purchase' | 'task' | 'client';
          linked_item_id: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: 'info' | 'warning' | 'urgent' | 'client_follow_up' | 'internal';
          text: string;
          linked_item_type: 'order' | 'expense' | 'purchase' | 'task' | 'client';
          linked_item_id: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: 'info' | 'warning' | 'urgent' | 'client_follow_up' | 'internal';
          text?: string;
          linked_item_type?: 'order' | 'expense' | 'purchase' | 'task' | 'client';
          linked_item_id?: string;
          created_by?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          message: string;
          push_message: string;
          data: string;
          status: 'read' | 'unread';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          message: string;
          push_message: string;
          data: string;
          status: 'read' | 'unread';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          message?: string;
          push_message?: string;
          data?: string;
          status?: 'read' | 'unread';
          created_at?: string;
        };
      };
      settings: {
        Row: {
          id: string;
          key: string;
          value: string;
          updated_by: string;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: string;
          updated_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: string;
          updated_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      employee_access: {
        Row: {
          id: string;
          employee_id: string;
          item_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          item_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          item_id?: string;
          created_at?: string;
        };
      };
      approvals: {
        Row: {
          id: string;
          type: 'expense' | 'purchase' | 'discount' | 'other';
          item_id: string;
          requested_by: string;
          approved_by?: string;
          status: 'pending' | 'approved' | 'rejected';
          comment?: string;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          type: 'expense' | 'purchase' | 'discount' | 'other';
          item_id: string;
          requested_by: string;
          approved_by?: string;
          status: 'pending' | 'approved' | 'rejected';
          comment?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: 'expense' | 'purchase' | 'discount' | 'other';
          item_id?: string;
          requested_by?: string;
          approved_by?: string;
          status?: 'pending' | 'approved' | 'rejected';
          comment?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          expires_at?: string;
        };
      };
    };
    Functions: {
      begin_transaction: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      commit_transaction: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      rollback_transaction: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
  };
} 