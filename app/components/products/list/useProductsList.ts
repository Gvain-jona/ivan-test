'use client';

import { useMemo, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useProducts } from '@/hooks/products/useProducts';
import { useFieldDefinitions, type FieldDefinition } from '@/hooks/fields/useFieldDefinitions';
import { ROLLUP_ROW_CAP } from '@/lib/api/rollup';
import { normalizeOptions, type FieldOption } from '@/lib/fields/options';
import { filterProducts, hasLiveProduct } from '@/lib/products/list';

/**
 * The products list (D1) — its rows and its filters.
 *
 * Simpler than useClientsList: no money rollup, because a product's lifetime
 * order count waits for the metrics layer (see lib/products/list). The list
 * fetches active **and** draft together (status 'all', archived excluded in the
 * filter) so a draft shows inline the way the frame draws it, and the category
 * chips come from the org's own `category` field options rather than the
 * frame's literal Banners/Flyers.
 */
export function useProductsList() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [category, setCategory] = useState<string | null>(null);

  const { products, isLoading, error, mutate } = useProducts({
    status: 'all',
    limit: ROLLUP_ROW_CAP,
  });

  // Active product fields drive both the row subtitle (category · size ·
  // material) and the category chips.
  const { fieldDefinitions } = useFieldDefinitions('product', { status: 'active' });

  const categoryField: FieldDefinition | null = useMemo(
    () =>
      fieldDefinitions.find(
        field => field.field_name === 'category' && field.field_type === 'select',
      ) ?? null,
    [fieldDefinitions],
  );
  const categoryOptions: FieldOption[] = useMemo(
    () => (categoryField ? normalizeOptions(categoryField.options) : []),
    [categoryField],
  );

  const filtered = useMemo(
    () => filterProducts(products, { search: debouncedSearch, category }),
    [products, debouncedSearch, category],
  );

  const hasLive = hasLiveProduct(products);

  return {
    products: filtered,
    /** Active product fields, in sort order — the row composes its subtitle from these. */
    fields: fieldDefinitions,
    isLoading,
    error,
    refresh: mutate,
    categoryOptions,
    search,
    setSearch,
    category,
    setCategory,
    searching: debouncedSearch.trim().length > 0,
    /** A genuinely empty org — no live product and nothing narrowing the view. */
    isEmptyOrg:
      !isLoading && !hasLive && category === null && debouncedSearch.trim().length === 0,
  };
}
