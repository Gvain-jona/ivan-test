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
  canEdit?: boolean;
  onAddItem?: (item: Partial<OrderItem>) => void;
  onEditItem?: (item: any) => void;
  onDeleteItem?: (itemId: string) => void;
  loadingStates?: {
    addItem?: boolean;
    editItem?: string | null;
    deleteItem?: string | null;
  };
  onAddItemClick?: (orderId: string) => void; // New prop for handling add item clicks
}

/**
 * Props for the OrderPaymentsTab component
 */
export interface OrderPaymentsTabProps {
  order: Order | null;
  onEdit?: (order: Order) => Promise<any>;
  refreshOrder?: (optimisticData?: any, shouldRevalidate?: boolean) => Promise<any>;
  isLoading?: boolean;
  isError?: boolean;
  loadingStates?: {
    editPayment?: string | null;
    deletePayment?: string | null;
  };
  onAddPaymentClick?: (orderId: string) => void; // New prop for handling add payment clicks
}

/**
 * Props for the OrderNotesTab component
 */
export interface OrderNotesTabProps {
  order: Order;
  onEdit?: (order: Order) => Promise<any>;
  refreshOrder?: (optimisticData?: any, shouldRevalidate?: boolean) => Promise<any>;
  isLoading?: boolean;
  isError?: boolean;
  loadingStates?: {
    editNote?: string | null;
    deleteNote?: string | null;
  };
  onAddNoteClick?: (orderId: string) => void; // New prop for handling add note clicks
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
  paymentDate: string;
  setPaymentDate: (date: string) => void;
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
