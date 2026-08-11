'use client';

import { Search } from 'lucide-react';
import { Card, RowDivider, SectionLabel } from '@/components/patterns/screen';
import { ScreenFields } from '@/components/fields/ScreenFields';
import { formatFieldValue } from '@/lib/fields/format';
import type { Product } from '@/hooks/products/useProducts';
import type { FieldDefinition } from '@/hooks/fields/useFieldDefinitions';
import type { CustomDataValue } from '@/lib/fields/visibility';

/** What the sheet has resolved so far — a catalogue product or a one-off. */
export interface Chosen {
  product_id: string | null;
  name: string;
  /** Only set for a one-off, which is what `create_order` distinguishes on. */
  product_name_raw?: string;
  unit_price: number;
  meta?: string;
  custom_data: CustomDataValue;
}

/**
 * The org's first two product fields, as the row's second line.
 *
 * `formatFieldValue` returns null for anything empty, so a product missing one
 * of them shows the other rather than a dangling separator.
 */
function productMeta(product: Product, fields: FieldDefinition[]): string | undefined {
  const custom = (product.custom_data ?? {}) as CustomDataValue;
  const parts = fields
    .slice(0, 2)
    .map(field => formatFieldValue(custom[field.field_name], field))
    .filter((part): part is string => part !== null);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

export function SearchState({
  query,
  onQuery,
  products,
  isLoading,
  productFields,
  onChoose,
  fmt,
}: {
  query: string;
  onQuery: (value: string) => void;
  products: Product[];
  isLoading: boolean;
  productFields: FieldDefinition[];
  onChoose: (chosen: Chosen) => void;
  fmt: (value: number) => string;
}) {
  const trimmed = query.trim();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-border bg-background px-3">
        <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={event => onQuery(event.target.value)}
          placeholder="Search products"
          aria-label="Search products"
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
        />
      </div>

      <Card>
        {products.map((product, index) => (
          <div key={product.id}>
            {index > 0 && <RowDivider />}
            <button
              type="button"
              onClick={() =>
                onChoose({
                  product_id: product.id,
                  name: product.name,
                  unit_price: product.selling_price ?? 0,
                  meta: productMeta(product, productFields),
                  // The line starts from the product's own field values — a
                  // banner's catalogue size is the right first answer for the
                  // size actually sold, and the person can change it.
                  custom_data: { ...((product.custom_data as CustomDataValue | null) ?? {}) },
                })
              }
              className="flex w-full items-start justify-between gap-2 px-3.5 py-[11px] text-left"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">
                  {product.name}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {productMeta(product, productFields)}
                </span>
              </span>
              <span className="flex-shrink-0 text-[13.5px] font-medium text-foreground">
                {product.selling_price == null ? '—' : fmt(product.selling_price)}
              </span>
            </button>
          </div>
        ))}

        {!isLoading && trimmed !== '' && (
          <>
            {products.length > 0 && <RowDivider />}
            <button
              type="button"
              onClick={() =>
                onChoose({
                  product_id: null,
                  product_name_raw: trimmed,
                  name: trimmed,
                  unit_price: 0,
                  custom_data: {},
                })
              }
              className="w-full px-3.5 py-[11px] text-left text-sm font-medium text-primary"
            >
              Add &ldquo;{trimmed}&rdquo; as a one-off
            </button>
          </>
        )}

        {!isLoading && products.length === 0 && trimmed === '' && (
          <p className="px-3.5 py-[11px] text-[13px] text-muted-foreground">
            Start typing to find a product, or name a one-off.
          </p>
        )}
      </Card>
    </div>
  );
}

export function ChosenState({
  chosen,
  lineFields,
  quantity,
  unitPrice,
  onQuantity,
  onUnitPrice,
  onCustomData,
  onBack,
}: {
  chosen: Chosen;
  lineFields: FieldDefinition[];
  quantity: string;
  unitPrice: string;
  onQuantity: (value: string) => void;
  onUnitPrice: (value: string) => void;
  onCustomData: (next: CustomDataValue) => void;
  /** Absent when editing an existing line — its product is settled. */
  onBack?: () => void;
}) {
  const box =
    'flex h-10 w-full items-center rounded-lg border border-border bg-background px-3 ' +
    'text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-foreground">{chosen.name}</p>
          {chosen.meta && (
            <p className="truncate text-[11px] text-muted-foreground">{chosen.meta}</p>
          )}
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex-shrink-0 text-[12.5px] font-medium text-primary"
          >
            Change
          </button>
        )}
      </div>

      {/* The frame shows size chips here, sourced from sizes already used on
          this product. That is an aggregate over order_items which the read
          layer can't answer yet, so the line's fields render as themselves,
          prefilled from the product. TODO(v2 read layer). */}
      <ScreenFields
        fields={lineFields}
        value={chosen.custom_data}
        onChange={onCustomData}
      />

      <div className="flex w-full items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <SectionLabel>QUANTITY</SectionLabel>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            className={box}
            value={quantity}
            onChange={event => onQuantity(event.target.value)}
            aria-label="Quantity"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <SectionLabel>UNIT PRICE</SectionLabel>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            className={box}
            value={unitPrice}
            onChange={event => onUnitPrice(event.target.value)}
            aria-label="Unit price"
          />
        </div>
      </div>
    </>
  );
}
