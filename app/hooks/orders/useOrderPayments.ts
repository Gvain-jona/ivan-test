'use client';

import { useLoadingSWR } from '../useLoadingSWR';
import { SWRConfiguration } from 'swr';
import { createSWRConfig } from '@/lib/swr-config';
import { useToast } from '@/components/ui/use-toast';
import { OrderPayment } from '@/types/orders';

export function useOrderPayments(orderId?: string, config?: SWRConfiguration) {
  const { toast } = useToast();
  const loadingId = `order-payments-${orderId}`;
  const url = orderId ? `/api/orders/${orderId}/payments` : null;

  const swrConfig = createSWRConfig('detail', { ...config });

  const { data, error, isLoading, mutate } = useLoadingSWR<OrderPayment[]>(
    url,
    async () => {
      const response = await fetch(url!);
      if (!response.ok) {
        throw new Error(`Failed to fetch payments: ${response.statusText}`);
      }
      const result = await response.json();
      if (result && Array.isArray(result.payments)) {
        return result.payments;
      }
      return Array.isArray(result) ? result : [];
    },
    loadingId,
    {
      ...swrConfig,
      onError: (err) => {
        console.error('Error fetching order payments:', err);
        toast({
          title: 'Error',
          description: 'Failed to fetch payment details. Please try again.',
          variant: 'destructive',
        });
      }
    }
  );

  return {
    payments: data || [],
    isLoading,
    isError: !!error,
    isEmpty: !data || data.length === 0,
    mutate,
  };
}
