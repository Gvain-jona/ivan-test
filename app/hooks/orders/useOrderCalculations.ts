import { useCallback } from 'react';
import { Order, OrderItem, OrderPayment, PaymentStatus } from '@/types/orders';
import { 
  calculateOrderBalance, 
  calculateOrderTotal, 
  getPaymentStatus 
} from '@/utils/orders/order-form.utils';

interface UseOrderCalculationsReturn {
  calculateTotal: (items: OrderItem[]) => number;
  calculateAmountPaid: (payments: OrderPayment[]) => number;
  calculateBalance: (total: number, amountPaid: number) => number;
  getPaymentStatus: (total: number, amountPaid: number) => PaymentStatus;
  updateOrderCalculations: (order: Partial<Order>) => Partial<Order>;
}

/**
 * Custom hook for calculating order totals, balances, and payment status
 */
export const useOrderCalculations = (): UseOrderCalculationsReturn => {
  // Calculate the total amount from the order items
  const calculateTotal = useCallback((items: OrderItem[]): number => {
    return calculateOrderTotal(items);
  }, []);

  // Calculate the total amount paid from the payments
  const calculateAmountPaid = useCallback((payments: OrderPayment[]): number => {
    if (!payments || !payments.length) return 0;
    return payments.reduce((total, payment) => total + (payment.amount || 0), 0);
  }, []);

  // Calculate the balance based on the total and amount paid
  const calculateBalance = useCallback((total: number, amountPaid: number): number => {
    return calculateOrderBalance(total, amountPaid);
  }, []);

  // Determine the payment status based on the total and amount paid
  const determinePaymentStatus = useCallback((total: number, amountPaid: number): PaymentStatus => {
    return getPaymentStatus(total, amountPaid);
  }, []);

  // Update all calculations for an order
  const updateOrderCalculations = useCallback((order: Partial<Order>): Partial<Order> => {
    if (!order) return order;

    const items = order.items || [];
    // Type assertion for payments since it might not be defined in Partial<Order>
    const payments = (order as any).payments || [];
    
    const totalAmount = calculateTotal(items);
    const amountPaid = calculateAmountPaid(payments);
    const balance = calculateBalance(totalAmount, amountPaid);
    const paymentStatus = determinePaymentStatus(totalAmount, amountPaid);

    return {
      ...order,
      total_amount: totalAmount,
      amount_paid: amountPaid,
      balance: balance,
      payment_status: paymentStatus
    };
  }, [calculateTotal, calculateAmountPaid, calculateBalance, determinePaymentStatus]);

  return {
    calculateTotal,
    calculateAmountPaid,
    calculateBalance,
    getPaymentStatus: determinePaymentStatus,
    updateOrderCalculations,
  };
};

export default useOrderCalculations; 