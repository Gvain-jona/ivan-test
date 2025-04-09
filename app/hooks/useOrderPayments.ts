import { useCallback, useState } from 'react';
import { OrderPayment } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';

/**
 * Custom hook to manage order payments
 */
export function useOrderPayments(orderId: string) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<OrderPayment[]>([]);

  /**
   * Fetch all payments for an order
   */
  const fetchPayments = useCallback(async () => {
    if (!orderId) return;

    try {
      setLoading(true);

      const response = await fetch(`/api/orders/${orderId}/payments`);

      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }

      const data = await response.json();
      setPayments(data.payments || []);

      return data.payments;
    } catch (error) {
      console.error(`Error fetching payments for order ${orderId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to fetch order payments',
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [orderId, toast]);

  /**
   * Add a new payment to an order
   */
  const addPayment = useCallback(async (paymentData: Partial<OrderPayment>) => {
    if (!orderId) return null;

    try {
      setLoading(true);

      const response = await fetch(`/api/orders/${orderId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: paymentData.amount,
          paymentDate: paymentData.payment_date,
          paymentType: paymentData.payment_type || paymentData.payment_method
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add payment');
      }

      const data = await response.json();

      toast({
        title: 'Success',
        description: 'Payment added successfully'
      });

      // Refresh payments list
      await fetchPayments();

      return data.id;
    } catch (error) {
      console.error(`Error adding payment to order ${orderId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to add payment',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [orderId, fetchPayments, toast]);

  /**
   * Delete a payment from an order
   */
  const deletePayment = useCallback(async (paymentId: string) => {
    if (!orderId || !paymentId) return false;

    try {
      setLoading(true);

      const response = await fetch(`/api/orders/${orderId}/payments?paymentId=${paymentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete payment');
      }

      toast({
        title: 'Success',
        description: 'Payment deleted successfully'
      });

      // Refresh payments list
      await fetchPayments();

      return true;
    } catch (error) {
      console.error(`Error deleting payment ${paymentId} from order ${orderId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to delete payment',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [orderId, fetchPayments, toast]);

  return {
    loading,
    payments,
    fetchPayments,
    addPayment,
    deletePayment
  };
}