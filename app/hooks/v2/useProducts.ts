'use client';

import { useCallback } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { SWR_CACHE_TIMES } from '@/lib/swr-config';
import { V2_ENDPOINTS, buildKey, keysUnder, v2Fetcher, v2Request } from '@/lib/v2/api';
import type { DatabaseV2 } from '@/types/supabase-v2';

type ProductRow = DatabaseV2['v2']['Tables']['products']['Row'];

export type V2Product = Omit<ProductRow, 'organization_id' | 'created_by'>;

export type ProductListParams = {
  status?: 'active' | 'archived' | 'draft' | 'all';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ProductInput {
  name: string;
  selling_price?: number | null;
  status?: 'active' | 'archived' | 'draft';
  name_variants?: string[];
  custom_data?: Record<string, unknown>;
}

export function useProducts(params: ProductListParams = {}) {
  const key = buildKey(V2_ENDPOINTS.PRODUCTS, params);
  const { data, error, isLoading, mutate } = useSWR<{ products: V2Product[]; total: number }>(
    key,
    v2Fetcher,
    { dedupingInterval: SWR_CACHE_TIMES.LIST_DEDUPE },
  );

  return {
    products: data?.products ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

export function useProduct(id: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR<{ product: V2Product }>(
    id ? `${V2_ENDPOINTS.PRODUCTS}/${id}` : null,
    v2Fetcher,
    { dedupingInterval: SWR_CACHE_TIMES.DETAIL_DEDUPE },
  );

  return { product: data?.product ?? null, isLoading, error, mutate };
}

export function useProductMutations() {
  const { mutate } = useSWRConfig();
  const invalidate = useCallback(
    () => mutate(keysUnder(V2_ENDPOINTS.PRODUCTS)),
    [mutate],
  );

  const createProduct = useCallback(
    async (input: ProductInput) => {
      const { product } = await v2Request<{ product: V2Product }>(
        V2_ENDPOINTS.PRODUCTS,
        'POST',
        input,
      );
      await invalidate();
      return product;
    },
    [invalidate],
  );

  const updateProduct = useCallback(
    async (id: string, input: Partial<ProductInput>) => {
      const { product } = await v2Request<{ product: V2Product }>(
        `${V2_ENDPOINTS.PRODUCTS}/${id}`,
        'PATCH',
        input,
      );
      await invalidate();
      return product;
    },
    [invalidate],
  );

  const archiveProduct = useCallback(
    (id: string) => updateProduct(id, { status: 'archived' }),
    [updateProduct],
  );

  return { createProduct, updateProduct, archiveProduct };
}
