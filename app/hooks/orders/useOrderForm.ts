import React, { useState, useCallback, useMemo, useEffect } from 'react';
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

  // Debug initialOrder in useOrderForm
  console.log('useOrderForm received initialOrder:', initialOrder);
  console.log('useOrderForm defaultOrder:', defaultOrder);

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

  // Debug the initialized state
  console.log('useOrderForm initialized order state:', order);

  // Add an effect to update the form state when initialOrder changes
  // This is important for when the form is opened with a different order
  useEffect(() => {
    if (initialOrder) {
      console.log('useOrderForm initialOrder changed, updating state:', initialOrder);

      // Ensure nested arrays are properly initialized
      const updatedOrder = {
        ...initialOrder,
        items: initialOrder.items || [],
        payments: initialOrder.payments || [],
        notes: initialOrder.notes || []
      };

      console.log('useOrderForm setting order with nested data:', updatedOrder);
      setOrder(updatedOrder);
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

  // Recalculate totals and balance based on current items and payments
  const recalculateOrder = useCallback(() => {
    // Always run calculations even if items array is empty
    const items = order.items || [];
    const payments = order.payments || [];

    // Log current state for debugging
    console.log('Recalculating order with:', {
      items: items.length,
      payments: payments.length,
      paymentDetails: payments
    });

    // Calculate total amount from all items
    const totalAmount = calculateOrderTotal(items);

    // Calculate amount paid from all payments
    const amountPaid = payments.reduce((sum, payment) => {
      // Log each payment amount for debugging
      console.log('Payment amount:', payment.amount);
      return sum + (payment.amount || 0);
    }, 0);

    // Log calculated values
    console.log('Calculated values:', {
      totalAmount,
      amountPaid,
      balance: calculateOrderBalance(totalAmount, amountPaid)
    });

    // Calculate balance and payment status
    const balance = calculateOrderBalance(totalAmount, amountPaid);
    const paymentStatus = getPaymentStatus(totalAmount, amountPaid);

    // Update the order with the calculated values
    setOrder(prev => {
      const updatedOrder = {
        ...prev,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        balance: balance,
        payment_status: paymentStatus,
      };
      console.log('Updated order:', updatedOrder);
      return updatedOrder;
    });
  }, [order.items, order.payments]);

  // Check if form has been modified from initial state in a meaningful way
  const isDirty = useCallback(() => {
    // If there's no initial order, check if any required fields have been filled
    if (!initialOrder) {
      // Check if any meaningful data has been entered
      if (order.client_id || order.client_name ||
          (order.items && order.items.length > 0) ||
          (order.notes && order.notes.length > 0)) {
        return true;
      }
      return false;
    }

    // If we're editing an existing order, do a deep comparison
    // Ignore fields that don't affect the actual order data
    const orderForComparison = { ...order };
    const initialForComparison = { ...initialFormState };

    // Remove fields that shouldn't trigger the dirty state
    const fieldsToIgnore = ['lastFetched', 'loading', 'error'];
    fieldsToIgnore.forEach(field => {
      delete orderForComparison[field as keyof Order];
      delete initialForComparison[field as keyof Order];
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