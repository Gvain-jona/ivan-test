/**
 * The D1 products list — its client-side filtering, kept pure so it can be
 * unit-tested without SWR or the DOM.
 *
 * Unlike C1 there is no money rollup here: a product's per-row lifetime stats
 * ("24 orders") come from grouping order_items by product, and order_items is
 * the highest-cardinality table in the schema — a bounded fetch would go
 * inexact almost immediately, so those counts wait for the metrics layer (see
 * APP_REDESIGN.md → Aggregates). D1 shows the one figure that is a real column
 * and always exact: the selling price.
 */

/** The product shape the filter needs. `custom_data` is Json; customText narrows it. */
interface FilterableProduct {
  id: string;
  name: string;
  status: string;
  custom_data: unknown;
}

export interface ProductFilters {
  /** Matched against name and the `category` value; case-insensitive substring. */
  search: string;
  /** A `category` field option value, or null for "any". */
  category: string | null;
}

function customText(product: FilterableProduct, key: string): string {
  const data = product.custom_data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return '';
  const value = (data as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : '';
}

/**
 * Filter the loaded products by the active chip and search box.
 *
 * Archived products are dropped here: D1 lists active **and** draft together
 * (the frame shows a draft inline, badged), and the route can only fetch a
 * single status or 'all', so the list fetches 'all' and excludes archived at
 * this seam. Search and the category chip run client-side for the same reason
 * they do on C1 — a small book, and a custom_data value PostgREST can't filter
 * without a jsonb path built from client input.
 */
export function filterProducts<T extends FilterableProduct>(
  products: T[],
  filters: ProductFilters,
): T[] {
  const term = filters.search.trim().toLowerCase();
  return products.filter(product => {
    if (product.status === 'archived') return false;
    if (filters.category && customText(product, 'category') !== filters.category) return false;
    if (term) {
      const name = product.name.toLowerCase();
      const category = customText(product, 'category').toLowerCase();
      if (!name.includes(term) && !category.includes(term)) return false;
    }
    return true;
  });
}

/** Whether the org has any non-archived product at all — drives D1's empty state. */
export function hasLiveProduct(products: FilterableProduct[]): boolean {
  return products.some(product => product.status !== 'archived');
}
