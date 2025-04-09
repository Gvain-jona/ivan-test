import { useState, useCallback } from 'react';
import { Order, OrderStatus, PaymentStatus } from '@/types/orders';
import { calculateOrderBalance, calculateOrderTotal, getPaymentStatus } from '@/utils/orders/order-form.utils';

interface UseOrderFormProps {
  initialOrder?: Partial<Order>;
}

interface UseOrderFormReturn {
  order: Partial<Order>;
  updateOrderField: <K extends keyof Order>(field: K, value: Order[K]) => void;
  updateOrderFields: (fields: Partial<Order>) => void;
  resetOrder: () => void;
  recalculateOrder: () => void;
  isDirty: boolean;
}

/**
 * Custom hook for managing order form state
 */
export const useOrderForm = ({ initialOrder }: UseOrderFormProps = {}): UseOrderFormReturn => {
  const defaultOrder: Partial<Order> = {
    status: 'paused' as OrderStatus,
    payment_status: 'unpaid' as PaymentStatus,
    total_amount: 0,
    amount_paid: 0,
    balance: 0,
    items: [],
    notes: [],
  };

  const [order, setOrder] = useState<Partial<Order>>(initialOrder || defaultOrder);
  const [initialFormState] = useState<Partial<Order>>(initialOrder || defaultOrder);
  
  // Update a single field in the order
  const updateOrderField = useCallback(<K extends keyof Order>(field: K, value: Order[K]) => {
    setOrder(prev => ({ ...prev, [field]: value }));
  }, []);
  
  // Update multiple fields at once
  const updateOrderFields = useCallback((fields: Partial<Order>) => {
    setOrder(prev => ({ ...prev, ...fields }));
  }, []);
  
  // Reset form to initial state
  const resetOrder = useCallback(() => {
    setOrder(initialFormState);
  }, [initialFormState]);
  
  // Recalculate totals and balance based on current items and payments
  const recalculateOrder = useCallback(() => {
    if (!order.items) return;
    
    const totalAmount = calculateOrderTotal(order.items);
    const balance = calculateOrderBalance(totalAmount, order.amount_paid || 0);
    const paymentStatus = getPaymentStatus(totalAmount, order.amount_paid || 0);
    
    setOrder(prev => ({
      ...prev,
      total_amount: totalAmount,
      balance: balance,
      payment_status: paymentStatus,
    }));
  }, [order.items, order.amount_paid]);
  
  // Check if form has been modified from initial state
  const isDirty = JSON.stringify(order) !== JSON.stringify(initialFormState);
  
  return {
    order,
    updateOrderField,
    updateOrderFields,
    resetOrder,
    recalculateOrder,
    isDirty,
  };
};

export default useOrderForm; 