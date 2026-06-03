import { useState, useCallback, useMemo, useEffect } from 'react';
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
  const defaultOrder = useMemo(() => ({
    status: 'paused' as OrderStatus,
    payment_status: 'unpaid' as PaymentStatus,
    total_amount: 0,
    amount_paid: 0,
    balance: 0,
    items: [],
    notes: [],
    payments: [], // Add empty payments array to ensure it's always defined
  }), []);

  // Ensure nested arrays are properly initialized in the initial state
  const initialState = useMemo(() => {
    const baseState = initialOrder || defaultOrder;
    return {
      ...baseState,
      items: baseState.items || [],
      payments: baseState.payments || [],
      notes: baseState.notes || []
    };
  }, [initialOrder, defaultOrder]);

  const [order, setOrder] = useState<Partial<Order>>(initialState);
  const [initialFormState] = useState<Partial<Order>>(initialState);

  // Add an effect to update the form state when initialOrder changes
  // This is important for when the form is opened with a different order
  useEffect(() => {
    if (initialOrder) {
      setOrder({
        ...initialOrder,
        items: initialOrder.items || [],
        payments: initialOrder.payments || [],
        notes: initialOrder.notes || [],
      });
    }
  }, [initialOrder]);

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
    // Create a fresh order with today's date
    const freshOrder = {
      ...defaultOrder,
      date: new Date().toISOString().split('T')[0],
      status: 'pending' as OrderStatus,
      payment_status: 'unpaid' as PaymentStatus,
      client_type: 'regular',
      items: [],
      payments: [],
      notes: []
    };
    setOrder(freshOrder);

    // Ensure calculations are reset
    setTimeout(() => {
      setOrder(prev => ({
        ...prev,
        total_amount: 0,
        amount_paid: 0,
        balance: 0,
      }));
    }, 0);
  }, [defaultOrder]);

  const recalculateOrder = useCallback(() => {
    const items = order.items || [];
    const payments = order.payments || [];
    const totalAmount = calculateOrderTotal(items);
    const amountPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const balance = calculateOrderBalance(totalAmount, amountPaid);
    const paymentStatus = getPaymentStatus(totalAmount, amountPaid);
    setOrder(prev => ({ ...prev, total_amount: totalAmount, amount_paid: amountPaid, balance, payment_status: paymentStatus }));
  }, [order.items, order.payments]);

  const isDirty = useMemo(() => {
    if (!initialOrder) {
      return !!(
        order.client_id ||
        order.client_name ||
        (order.items && order.items.length > 0) ||
        (order.notes && order.notes.length > 0)
      );
    }

    const fieldsToIgnore: (keyof Order)[] = ['lastFetched' as keyof Order, 'loading' as keyof Order, 'error' as keyof Order];
    const orderForComparison = { ...order };
    const initialForComparison = { ...initialFormState };
    fieldsToIgnore.forEach(field => {
      delete orderForComparison[field];
      delete initialForComparison[field];
    });

    return JSON.stringify(orderForComparison) !== JSON.stringify(initialForComparison);
  }, [order, initialFormState, initialOrder]);

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