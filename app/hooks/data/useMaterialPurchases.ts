/**
 * @deprecated Use hooks from '@/hooks/materials/useMaterialPurchases' instead.
 * This file is maintained for backward compatibility only.
 */

import useSWR from 'swr';
import { useState } from 'react';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import { fetcher } from '@/lib/fetcher';
import { createSWRConfig } from '@/lib/swr-config';

export type MaterialPurchase = {
  id: string;
  supplier_name: string;
  material_name: string;
  date: string;
  quantity: number;
  total_amount: number;
  amount_paid: number;
  balance: number;
  payment_status: 'unpaid' | 'partially_paid' | 'paid';
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Installment payment fields
  installment_plan: boolean;
  total_installments?: number;
  installments_paid?: number;
  next_payment_date?: string;
  payment_frequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  reminder_days?: number;
  // Related data
  payments?: MaterialPayment[];
  installments?: MaterialInstallment[];
};

export type MaterialPayment = {
  id: string;
  purchase_id: string;
  amount: number;
  date: string;
  payment_method: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type MaterialInstallment = {
  id: string;
  purchase_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  payment_id?: string;
  created_at: string;
  updated_at: string;
};

export type MaterialPurchasesResponse = {
  purchases: MaterialPurchase[];
  total: number;
  page: number;
  limit: number;
};

export type MaterialPurchaseResponse = {
  purchase: MaterialPurchase;
};

export type MaterialPaymentsResponse = {
  payments: MaterialPayment[];
};

export type MaterialInstallmentsResponse = {
  installments: MaterialInstallment[];
};

export type MaterialPurchaseNote = {
  id: string;
  purchase_id: string;
  type: string;
  text: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type MaterialPurchaseNotesResponse = {
  notes: MaterialPurchaseNote[];
};

/**
 * @deprecated Use useMaterialPurchasesList from '@/hooks/materials/useMaterialPurchases' instead.
 */
export function useMaterialPurchases(
  page = 1,
  limit = 10,
  supplier?: string,
  startDate?: string,
  endDate?: string,
  paymentStatus?: string
) {
  // Build query string
  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());

  if (supplier) queryParams.append('supplier', supplier);
  if (startDate) queryParams.append('start_date', startDate);
  if (endDate) queryParams.append('end_date', endDate);
  if (paymentStatus) queryParams.append('payment_status', paymentStatus);

  const queryString = queryParams.toString();
  const url = `${API_ENDPOINTS.MATERIALS}?${queryString}`;

  const { data, error, isLoading, mutate } = useSWR<MaterialPurchasesResponse>(
    url,
    fetcher,
    createSWRConfig('list', {
      dedupingInterval: 30 * 60 * 1000, // 30 minutes - increased to reduce API calls
      revalidateOnFocus: false,
      revalidateIfStale: false,
    })
  );

  // Extract purchases from the nested data structure
  const purchases = data?.data?.purchases || data?.purchases || [];
  const total = data?.data?.total || data?.total || 0;

  return {
    purchases,
    total,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * @deprecated Use useMaterialPurchaseDetails from '@/hooks/materials/useMaterialPurchases' instead.
 */
export function useMaterialPurchase(id: string) {
  const { data, error, isLoading, mutate } = useSWR<MaterialPurchaseResponse>(
    id ? `${API_ENDPOINTS.MATERIALS}/${id}` : null,
    fetcher,
    createSWRConfig('detail', {
      dedupingInterval: 15 * 60 * 1000, // 15 minutes - increased to reduce API calls
      revalidateOnFocus: false,
      revalidateIfStale: false,
    })
  );

  // Extract purchase from the nested data structure
  const purchase = data?.data?.purchase || data?.purchase;

  return {
    purchase,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * @deprecated Use useMaterialPurchaseDetails from '@/hooks/materials/useMaterialPurchases' instead.
 */
export function useMaterialPayments(purchaseId: string) {
  const { data, error, isLoading, mutate } = useSWR<MaterialPaymentsResponse>(
    purchaseId ? `${API_ENDPOINTS.MATERIALS}/${purchaseId}/payments` : null,
    fetcher,
    createSWRConfig('detail', {
      dedupingInterval: 15 * 60 * 1000, // 15 minutes - increased to reduce API calls
      revalidateOnFocus: false,
      revalidateIfStale: false,
    })
  );

  // Extract payments from the nested data structure
  const payments = data?.data?.payments || data?.payments || [];

  return {
    payments,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * @deprecated Use useMaterialPurchaseDetails from '@/hooks/materials/useMaterialPurchases' instead.
 */
export function useMaterialInstallments(purchaseId: string) {
  const { data, error, isLoading, mutate } = useSWR<MaterialInstallmentsResponse>(
    purchaseId ? `${API_ENDPOINTS.MATERIALS}/${purchaseId}/installments` : null,
    async (url) => {
      try {
        console.log('Fetching installments from:', url);
        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error fetching installments:', errorData);
          throw new Error(errorData.error?.message || `Failed to fetch installments: ${response.status}`);
        }

        const result = await response.json();
        console.log('Installments API response:', result);

        // The API wraps the response in a 'data' property
        const responseData = result.data || result;

        return {
          installments: responseData.installments || []
        };
      } catch (error) {
        console.error('Error in installments fetcher:', error);
        throw error;
      }
    },
    createSWRConfig('detail', {
      dedupingInterval: 5 * 60 * 1000, // 5 minutes - reduced to ensure we get fresh data
      revalidateOnFocus: true,
      revalidateIfStale: true,
    })
  );

  // Extract installments from the nested data structure
  const installments = data?.installments || [];

  return {
    installments,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * @deprecated Use useMaterialPurchaseDetails from '@/hooks/materials/useMaterialPurchases' instead.
 */
export function useMaterialPurchaseNotes(purchaseId: string) {
  const { data, error, isLoading, mutate } = useSWR<MaterialPurchaseNotesResponse>(
    purchaseId ? `${API_ENDPOINTS.MATERIALS}/${purchaseId}/notes` : null,
    fetcher,
    createSWRConfig('detail', {
      dedupingInterval: 15 * 60 * 1000, // 15 minutes - increased to reduce API calls
      revalidateOnFocus: false,
      revalidateIfStale: false,
    })
  );

  // Extract notes from the nested data structure
  const notes = data?.data?.notes || data?.notes || [];

  return {
    notes,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * @deprecated Use useMaterialPurchasesList from '@/hooks/materials/useMaterialPurchases' instead.
 */
export function useCreateMaterialPurchase() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createPurchase = async (purchaseData: Partial<MaterialPurchase>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.MATERIALS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create material purchase');
      }

      setIsLoading(false);
      return data;
    } catch (err: any) {
      setError(err);
      setIsLoading(false);
      throw err;
    }
  };

  return {
    createPurchase,
    isLoading,
    error,
  };
}

/**
 * @deprecated Use useMaterialPurchasesList from '@/hooks/materials/useMaterialPurchases' instead.
 */
export function useUpdateMaterialPurchase(id: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updatePurchase = async (purchaseData: Partial<MaterialPurchase>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_ENDPOINTS.MATERIALS}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update material purchase');
      }

      setIsLoading(false);
      return data;
    } catch (err: any) {
      setError(err);
      setIsLoading(false);
      throw err;
    }
  };

  return {
    updatePurchase,
    isLoading,
    error,
  };
}

/**
 * @deprecated Use useMaterialPurchasesList from '@/hooks/materials/useMaterialPurchases' instead.
 */
export function useDeleteMaterialPurchase() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deletePurchase = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_ENDPOINTS.MATERIALS}/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to delete material purchase');
      }

      setIsLoading(false);
      return data;
    } catch (err: any) {
      setError(err);
      setIsLoading(false);
      throw err;
    }
  };

  return {
    deletePurchase,
    isLoading,
    error,
  };
}

/**
 * @deprecated Use useMaterialPurchaseDetails from '@/hooks/materials/useMaterialPurchases' instead.
 */
export function useAddMaterialPayment(purchaseId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addPayment = async (paymentData: Partial<MaterialPayment>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_ENDPOINTS.MATERIALS}/${purchaseId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment: paymentData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to add payment');
      }

      setIsLoading(false);
      return data;
    } catch (err: any) {
      setError(err);
      setIsLoading(false);
      throw err;
    }
  };

  return {
    addPayment,
    isLoading,
    error,
  };
}

/**
 * @deprecated Use useMaterialPurchaseDetails from '@/hooks/materials/useMaterialPurchases' instead.
 */
export function useDeleteMaterialPayment(purchaseId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deletePayment = async (paymentId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_ENDPOINTS.MATERIALS}/${purchaseId}/payments?paymentId=${paymentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to delete payment');
      }

      setIsLoading(false);
      return data;
    } catch (err: any) {
      setError(err);
      setIsLoading(false);
      throw err;
    }
  };

  return {
    deletePayment,
    isLoading,
    error,
  };
}

/**
 * @deprecated Use useMaterialPurchaseDetails from '@/hooks/materials/useMaterialPurchases' instead.
 */
export function useCreateInstallmentPlan(purchaseId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createInstallmentPlan = async (installmentData: {
    total_installments: number;
    payment_frequency: string;
    first_payment_date: string;
    reminder_days?: number;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_ENDPOINTS.MATERIALS}/${purchaseId}/installments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(installmentData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create installment plan');
      }

      setIsLoading(false);
      return data;
    } catch (err: any) {
      setError(err);
      setIsLoading(false);
      throw err;
    }
  };

  return {
    createInstallmentPlan,
    isLoading,
    error,
  };
}

/**
 * @deprecated Use useMaterialPurchaseDetails from '@/hooks/materials/useMaterialPurchases' instead.
 */
export function useUpdateInstallment(purchaseId: string, installmentId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateInstallment = async (installmentData: Partial<MaterialInstallment>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_ENDPOINTS.MATERIALS}/${purchaseId}/installments/${installmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(installmentData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update installment');
      }

      setIsLoading(false);
      return data;
    } catch (err: any) {
      setError(err);
      setIsLoading(false);
      throw err;
    }
  };

  return {
    updateInstallment,
    isLoading,
    error,
  };
}

/**
 * @deprecated Use useMaterialPurchaseDetails from '@/hooks/materials/useMaterialPurchases' instead.
 */
export function useCreateMaterialPurchaseNote(purchaseId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createNote = async (noteData: { type?: string; text: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_ENDPOINTS.MATERIALS}/${purchaseId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create note');
      }

      setIsLoading(false);
      return data;
    } catch (err: any) {
      setError(err);
      setIsLoading(false);
      throw err;
    }
  };

  return {
    createNote,
    isLoading,
    error,
  };
}

/**
 * @deprecated Use useMaterialPurchaseDetails from '@/hooks/materials/useMaterialPurchases' instead.
 */
export function useDeleteMaterialPurchaseNote(purchaseId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteNote = async (noteId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_ENDPOINTS.MATERIALS}/${purchaseId}/notes?noteId=${noteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to delete note');
      }

      setIsLoading(false);
      return data;
    } catch (err: any) {
      setError(err);
      setIsLoading(false);
      throw err;
    }
  };

  return {
    deleteNote,
    isLoading,
    error,
  };
}
