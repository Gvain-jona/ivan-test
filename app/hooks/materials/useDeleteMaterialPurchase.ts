'use client';

import { useState } from 'react';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export function useDeleteMaterialPurchase() {
  const [isLoading, setIsLoading] = useState(false);

  const deletePurchase = async (id: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.MATERIALS}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error?.message || 'Failed to delete material purchase');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { deletePurchase, isLoading };
}
