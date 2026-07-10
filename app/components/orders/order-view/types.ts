import type { OrderSummary, OrderDetail, Payment } from '@/hooks/orders/useOrders';
import type { Note } from '@/hooks/notes/useNotes';

/**
 * Props for the main OrderViewSheet component. The sheet receives the
 * list-row summary and fetches the full detail (items, payments,
 * notes) itself via the v2 hooks.
 */
export interface OrderViewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderSummary | null;
  onClose: () => void;
  userRole?: string;
}

export interface OrderDetailsTabProps {
  order: OrderDetail;
}

export interface OrderItemsTabProps {
  order: OrderDetail;
}

export interface PaymentInputValues {
  amount: number;
  payment_method?: 'cash' | 'mobile_money' | 'bank' | 'credit';
  payment_date?: string;
}

export interface OrderPaymentsTabProps {
  order: OrderDetail;
  payments: Payment[];
  onAddPayment: (input: PaymentInputValues) => Promise<void>;
  isSubmitting: boolean;
}

export interface OrderNotesTabProps {
  notes: Note[];
  onAddNote: (content: string) => Promise<void>;
  isSubmitting: boolean;
}
