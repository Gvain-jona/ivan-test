'use client';

import { Order, OrderItem, OrderPayment, PaymentStatus } from '@/types/orders';

/**
 * Calculate the total amount for an order based on its items
 * 
 * @param items Array of order items
 * @returns The total amount
 */
export function calculateOrderTotal(items: OrderItem[] = []): number {
  if (!items || !items.length) return 0;
  
  return items.reduce((total, item) => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unit_price || 0;
    return total + (quantity * unitPrice);
  }, 0);
}

/**
 * Calculate the total amount paid for an order based on its payments
 * 
 * @param payments Array of order payments
 * @returns The total amount paid
 */
export function calculateAmountPaid(payments: OrderPayment[] = []): number {
  if (!payments || !payments.length) return 0;
  
  return payments.reduce((total, payment) => {
    return total + (payment.amount || 0);
  }, 0);
}

/**
 * Calculate the remaining balance for an order
 * 
 * @param totalAmount The total order amount
 * @param amountPaid The amount already paid
 * @returns The remaining balance
 */
export function calculateOrderBalance(totalAmount: number, amountPaid: number): number {
  const balance = totalAmount - amountPaid;
  // Ensure balance is never negative
  return balance < 0 ? 0 : balance;
}

/**
 * Determine the payment status based on total amount and amount paid
 * 
 * @param totalAmount The total order amount
 * @param amountPaid The amount already paid
 * @returns The payment status
 */
export function getPaymentStatus(totalAmount: number, amountPaid: number): PaymentStatus {
  if (totalAmount === 0) return 'unpaid'; // No payment required
  if (amountPaid === 0) return 'unpaid';
  if (amountPaid >= totalAmount) return 'paid';
  return 'partially_paid';
}

/**
 * Update all calculations for an order
 * 
 * @param order The order to update
 * @returns The updated order with recalculated values
 */
export function updateOrderCalculations(order: Partial<Order>): Partial<Order> {
  if (!order) return order;

  const items = order.items || [];
  const payments = order.payments || [];
  
  const totalAmount = calculateOrderTotal(items);
  const amountPaid = calculateAmountPaid(payments);
  const balance = calculateOrderBalance(totalAmount, amountPaid);
  const paymentStatus = getPaymentStatus(totalAmount, amountPaid);

  return {
    ...order,
    total_amount: totalAmount,
    amount_paid: amountPaid,
    balance: balance,
    payment_status: paymentStatus
  };
}

/**
 * Format currency for display
 * 
 * @param amount The amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
