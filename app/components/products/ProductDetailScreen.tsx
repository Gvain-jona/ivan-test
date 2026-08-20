'use client';

import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { PLATFORM_API, apiFetcher } from '@/lib/api/client';
import { SWR_CACHE_TIMES } from '@/lib/swr-config';
import { useFormatCurrency } from '@/hooks/organization/useFormatCurrency';
import { useFieldDefinitions } from '@/hooks/fields/useFieldDefinitions';
import { useSheets } from '@/context/sheet-host';
import { useProductMutations } from '@/hooks/products/useProducts';
import { useToast } from '@/components/ui/use-toast';
import { Card, Divided, ScreenFooter, ScreenHeader } from '@/components/patterns/screen';
import { RecordActions } from '@/components/patterns/RecordActions';
import { RecordError } from '@/components/patterns/RecordError';
import { ValueRow } from '@/components/patterns/settings-rows';
import {
  SummaryPanel,
  SummaryRow,
  SummaryRule,
  SummaryUnavailable,
} from '@/components/patterns/summary';
import { formatFieldValue } from '@/lib/fields/format';
import { useDeferredLoading } from '@/hooks/useDeferredLoading';
import { RecordSkeleton } from '@/components/skeletons';
import type { Product } from '@/hooks/products/useProducts';
import type { Rollup } from '@/lib/api/rollup';

interface ProductLine {
  id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  orders: {
    id: string;
    order_number: string;
    order_date: string;
    clients: { name: string } | null;
  } | null;
}

interface ProductResponse {
  product: Product;
  lines: ProductLine[];
  rollup: Rollup<{ units: number; revenue: number }>;
}

/**
 * One product (D2 on the Pencil canvas): what it is, what it's been called,
 * and what it has actually sold.
 *
 * The detail rows are org-defined fields read from `custom_data` and labelled
 * from the registry, so a shop that tracks Material sees Material and one that
 * doesn't sees nothing — rather than a fixed set of columns that half of them
 * would leave blank.
 */
export default function ProductDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const fmt = useFormatCurrency();
  const { toast } = useToast();
  const { openCreateOrder, openEditProduct } = useSheets();
  const { archiveProduct } = useProductMutations();
  const { fieldDefinitions } = useFieldDefinitions('product', { status: 'active' });

  const { data, error, isLoading, mutate } = useSWR<ProductResponse>(
    `${PLATFORM_API.PRODUCTS}/${id}`,
    apiFetcher,
    { dedupingInterval: SWR_CACHE_TIMES.DETAIL_DEDUPE },
  );

  const loading = isLoading || !data;
  const showSkeleton = useDeferredLoading(loading);

  if (error && !data) {
    return (
      <RecordError noun="product" error={error} onBack={() => router.back()} onRetry={() => mutate()} />
    );
  }
  if (loading) {
    return showSkeleton ? <RecordSkeleton /> : null;
  }

  const { product, lines, rollup } = data;
  const custom = (product.custom_data ?? {}) as Record<string, unknown>;

  const details = fieldDefinitions
    .map(field => ({
      label: field.field_label,
      value: formatFieldValue(custom[field.field_name], field),
    }))
    .filter(row => row.value !== null);

  const aliases = product.name_variants ?? [];
  const unit = typeof custom.unit === 'string' ? custom.unit : null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-background">
      <ScreenHeader
        title={product.name}
        onBack={() => router.back()}
        action={
          <RecordActions
            noun="product"
            name={product.name}
            onEdit={() => openEditProduct(product)}
            onArchive={async () => {
              try {
                await archiveProduct(product.id);
                toast({ title: 'Product archived', description: product.name });
                router.back();
              } catch (error) {
                toast({
                  title: 'Could not archive the product',
                  description: error instanceof Error ? error.message : 'Please try again',
                  variant: 'destructive',
                });
              }
            }}
          />
        }
      />

      <div className="flex-1 px-4 py-[18px]">
        <div className="flex flex-col gap-[3px]">
          <span className="text-[28px] font-bold text-foreground">
            {product.selling_price == null ? 'No price set' : fmt(product.selling_price)}
          </span>
          {unit && <span className="text-xs text-muted-foreground">per {unit}</span>}
        </div>

        {details.length > 0 && (
          <div className="mt-[22px]">
            <span className="text-[11px] font-medium text-muted-foreground">DETAILS</span>
            <div className="mt-2">
              <Card>
                <Divided>
                  {details.map(row => (
                    <ValueRow key={row.label} label={row.label} value={row.value} />
                  ))}
                </Divided>
              </Card>
            </div>
          </div>
        )}

        {aliases.length > 0 && (
          <div className="mt-[22px]">
            <span className="text-[11px] font-medium text-muted-foreground">ALSO CALLED</span>
            <div className="mt-2 flex flex-wrap gap-[7px]">
              {aliases.map(alias => (
                <span
                  key={alias}
                  className="rounded-full bg-muted px-[11px] py-1.5 text-[11.5px] font-medium text-muted-foreground"
                >
                  {alias}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-[22px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">RECENT ORDERS</span>
            <span className="text-[11.5px] text-muted-foreground">{rollup.count} total</span>
          </div>
          <div className="mt-2">
            {lines.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted-foreground">
                Not ordered yet.
              </p>
            ) : (
              <Card>
                <Divided>
                  {lines.map(line => (
                    <button
                      key={line.id}
                      type="button"
                      onClick={() =>
                        line.orders && router.push(`/dashboard/orders?order=${line.orders.id}`)
                      }
                      className="flex w-full px-3.5 py-[11px] text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium text-foreground">
                            {line.orders?.order_number ?? '—'}
                          </span>
                          <span className="flex-shrink-0 text-[13.5px] font-medium text-foreground">
                            {fmt(Number(line.total_amount))}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <span className="truncate text-[11px] text-muted-foreground">
                            {[line.orders?.clients?.name, line.orders && formatDate(line.orders.order_date)]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                          <span className="flex-shrink-0 text-[11px] text-muted-foreground">
                            {line.quantity} × {fmt(Number(line.unit_price))}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </Divided>
              </Card>
            )}
          </div>
        </div>

        <div className="mt-6">
          {rollup.exact ? (
            <SummaryPanel>
              <SummaryRow label="Ordered" value={`${rollup.count} times`} />
              <SummaryRow label="Units sold" value={rollup.totals.units.toLocaleString()} />
              <SummaryRule />
              <SummaryRow label="Revenue" value={fmt(rollup.totals.revenue)} emphasis />
            </SummaryPanel>
          ) : (
            <SummaryUnavailable count={rollup.count} noun="order lines" />
          )}
        </div>
      </div>

      <ScreenFooter
        figureLabel="SELLING PRICE"
        figureValue={product.selling_price == null ? '—' : fmt(product.selling_price)}
        actionLabel="New order"
        onAction={openCreateOrder}
      />
    </div>
  );
}
