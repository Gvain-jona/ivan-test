/**
 * Utility functions for expense calculations
 * These functions centralize common calculations used across the expense system
 */

/**
 * Calculate payment status based on total amount and amount paid
 * @param totalAmount The total expense amount
 * @param amountPaid The amount that has been paid
 * @returns Payment status: 'unpaid', 'partially_paid', or 'paid'
 */
export const calculatePaymentStatus = (
  totalAmount: number, 
  amountPaid: number
): 'unpaid' | 'partially_paid' | 'paid' => {
  if (amountPaid <= 0) return 'unpaid';
  if (amountPaid >= totalAmount) return 'paid';
  return 'partially_paid';
};

/**
 * Calculate amount paid from an array of payments
 * @param payments Array of payment objects with amount property
 * @returns Total amount paid
 */
export const calculateAmountPaid = (
  payments: Array<{ amount: number | string }>
): number => {
  return payments.reduce((sum, payment) => {
    const amount = typeof payment.amount === 'string' 
      ? parseFloat(payment.amount) || 0 
      : payment.amount || 0;
    return sum + amount;
  }, 0);
};

/**
 * Calculate balance from total amount and amount paid
 * @param totalAmount The total expense amount
 * @param amountPaid The amount that has been paid
 * @returns Remaining balance (never negative)
 */
export const calculateBalance = (
  totalAmount: number, 
  amountPaid: number
): number => {
  return Math.max(0, totalAmount - amountPaid);
};

/**
 * Format a payment percentage for display
 * @param totalAmount The total expense amount
 * @param amountPaid The amount that has been paid
 * @returns Formatted payment percentage string
 */
export const formatPaymentPercentage = (
  totalAmount: number, 
  amountPaid: number
): string => {
  if (totalAmount <= 0) return '0%';
  const percentage = Math.min(100, Math.round((amountPaid / totalAmount) * 100));
  return `${percentage}%`;
};
