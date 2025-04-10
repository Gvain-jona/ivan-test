import { Order, OrderPayment } from '@/types/orders';

/**
 * Props for the main OrderViewSheet component
 */
export interface OrderViewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onClose: () => void;
  onEdit: (order: Order) => void;
  onGenerateInvoice: (order: Order) => void;
  userRole?: string;
}

/**
 * Props for the OrderDetailsTab component
 */
export interface OrderDetailsTabProps {
  order: Order;
  calculateBalancePercent: () => number;
}

/**
 * Props for the OrderItemsTab component
 */
export interface OrderItemsTabProps {
  order: Order;
}

/**
 * Props for the OrderPaymentsTab component
 */
export interface OrderPaymentsTabProps {
  order: Order;
  showPaymentForm: boolean;
  setShowPaymentForm: (show: boolean) => void;
  canEdit: boolean;
  onAddPayment: (payment: OrderPayment) => void;
}

/**
 * Props for the OrderNotesTab component
 */
export interface OrderNotesTabProps {
  order: Order;
}

/**
 * Props for the PaymentForm component
 */
export interface PaymentFormProps {
  onSubmit: (payment: OrderPayment) => void;
  onCancel: () => void;
}

/**
 * Return type for the useOrderPayments hook
 */
export interface UseOrderPaymentsReturn {
  paymentAmount: string;
  setPaymentAmount: (amount: string) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  handleSubmit: () => void;
  resetForm: () => void;
}

/**
 * Props for the useOrderPayments hook
 */
export interface UseOrderPaymentsProps {
  order: Order;
  onAddPayment: (payment: OrderPayment) => void;
}
