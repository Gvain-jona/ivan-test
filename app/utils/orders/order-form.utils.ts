import { OrderItem, OrderStatus, PaymentStatus } from '@/types/orders';

/**
 * Validates an order item
 * @param item The order item to validate
 * @returns Boolean indicating if the item is valid
 */
export const validateOrderItem = (item: Partial<OrderItem>): boolean => {
  return !!(
    item &&
    item.item_name &&
    item.item_name.trim() !== '' &&
    typeof item.quantity === 'number' &&
    item.quantity > 0 &&
    typeof item.unit_price === 'number' &&
    item.unit_price >= 0
  );
};

/**
 * Formats currency for display
 * @param amount The amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Calculates the total amount for an order
 * @param items Array of order items
 * @returns The total amount
 */
export const calculateOrderTotal = (items: OrderItem[]): number => {
  return items.reduce((total, item) => {
    return total + (item.quantity * item.unit_price);
  }, 0);
};

/**
 * Calculates the remaining balance for an order
 * @param totalAmount The total order amount
 * @param amountPaid The amount already paid
 * @returns The remaining balance
 */
export const calculateOrderBalance = (totalAmount: number, amountPaid: number): number => {
  return totalAmount - amountPaid;
};

/**
 * Determines the payment status based on balance
 * @param totalAmount The total order amount
 * @param amountPaid The amount already paid
 * @returns The payment status string
 */
export const getPaymentStatus = (totalAmount: number, amountPaid: number): PaymentStatus => {
  if (totalAmount === 0) return 'unpaid'; // No payment required
  if (amountPaid === 0) return 'unpaid';
  if (amountPaid >= totalAmount) return 'paid';
  return 'partially_paid';
};

/**
 * Formats order status for display
 * @param status The order status
 * @returns Formatted status text
 */
export const formatOrderStatus = (status: OrderStatus): string => {
  switch (status) {
    case 'paused':
      return 'Paused';
    case 'pending':
      return 'Pending';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'delivered':
      return 'Delivered';
    default:
      return status;
  }
};

/**
 * Gets CSS classes for order status styling
 * @param status The order status
 * @returns CSS classes string
 */
export const getOrderStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case 'paused':
      return 'bg-gray-900/20 text-gray-400 border-gray-800';
    case 'pending':
      return 'bg-yellow-900/20 text-yellow-400 border-yellow-800';
    case 'in_progress':
      return 'bg-blue-900/20 text-blue-400 border-blue-800';
    case 'completed':
      return 'bg-green-900/20 text-green-400 border-green-800';
    case 'cancelled':
      return 'bg-red-900/20 text-red-400 border-red-800';
    case 'delivered':
      return 'bg-purple-900/20 text-purple-400 border-purple-800';
    default:
      return 'bg-gray-900/20 text-gray-400 border-gray-800';
  }
};