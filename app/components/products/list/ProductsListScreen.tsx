'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Boxes, Package, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, Divided } from '@/components/patterns/screen';
import { QuickAction, Chip } from '@/components/patterns/list';
import MobileFeedHeader from '@/components/navigation/MobileFeedHeader';
import { useSheets } from '@/context/sheet-host';
import { useFormatCurrency } from '@/hooks/organization/useFormatCurrency';
import EntityFieldsManager from '@/components/fields/EntityFieldsManager';
import ProductListRow from './ProductListRow';
import { useProductsList } from './useProductsList';

/**
 * Products — the working list (D1).
 *
 * The same list language as B1/C1, without a summary card: a product's lifetime
 * stats wait for the metrics layer, and the one figure that is a real column —
 * the selling price — lives on each row. Category chips come from the org's own
 * `category` field. Tapping a row opens the product (D2); the org header and tab
 * bar come from the dashboard layout.
 */
export default function ProductsListScreen() {
  const router = useRouter();
  const fmt = useFormatCurrency();
  const list = useProductsList();
  const { openCreateProduct, openCreateOrder } = useSheets();
  const [showFields, setShowFields] = useState(false);

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-5">
      <MobileFeedHeader />
      <h1 className="text-[22px] font-semibold text-foreground">Products</h1>

      <div className="mt-4 flex flex-wrap gap-[7px]">
        <QuickAction icon={Boxes} label="New product" onClick={openCreateProduct} primary />
        <QuickAction icon={Plus} label="New order" onClick={openCreateOrder} />
      </div>

      {!list.isEmptyOrg && (
        <>
          <div className="mt-4 flex h-10 items-center gap-[9px] rounded-[10px] bg-muted px-3">
            <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <input
              value={list.search}
              onChange={event => list.setSearch(event.target.value)}
              placeholder="Search product or category"
              aria-label="Search product or category"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="mt-3 flex items-center gap-[7px] overflow-x-auto pb-1">
            <Chip
              label="All"
              active={list.category === null}
              onClick={() => list.setCategory(null)}
            />
            {list.categoryOptions.map(option => (
              <Chip
                key={option.value}
                label={option.label}
                active={list.category === option.value}
                onClick={() =>
                  list.setCategory(list.category === option.value ? null : option.value)
                }
              />
            ))}
            <button
              type="button"
              onClick={() => setShowFields(v => !v)}
              aria-pressed={showFields}
              className={cn(
                'ml-auto flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                showFields
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Fields
            </button>
          </div>
        </>
      )}

      {showFields && (
        <div className="mt-3 rounded-2xl border border-border bg-card/40 p-4">
          <EntityFieldsManager entity="product" entityLabel="product" />
        </div>
      )}

      <div className="mt-3.5">
        {list.isLoading && list.products.length === 0 ? (
          <div className="space-y-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        ) : list.products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center">
            <Package className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium text-foreground">
              {list.isEmptyOrg
                ? 'No products yet'
                : list.searching
                  ? 'Nothing matches that search'
                  : 'Nothing here'}
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {list.isEmptyOrg
                ? 'The catalogue that feeds your order items — add the first one.'
                : list.searching
                  ? 'Try a product name or a category.'
                  : 'No products under this filter right now.'}
            </p>
            {list.isEmptyOrg && (
              <button
                type="button"
                onClick={openCreateProduct}
                className="mt-4 inline-flex items-center gap-[7px] rounded-full bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Boxes className="h-4 w-4" strokeWidth={2} />
                New product
              </button>
            )}
          </div>
        ) : (
          <Card>
            <Divided>
              {list.products.map(product => (
                <ProductListRow
                  key={product.id}
                  product={product}
                  fields={list.fields}
                  fmt={fmt}
                  onOpen={() => router.push(`/dashboard/products/${product.id}`)}
                />
              ))}
            </Divided>
          </Card>
        )}
      </div>
    </div>
  );
}
