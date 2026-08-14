'use client';

import { formatFieldValue } from '@/lib/fields/format';
import type { Product } from '@/hooks/products/useProducts';
import type { FieldDefinition } from '@/hooks/fields/useFieldDefinitions';

/** How many detail fields the subtitle shows (category · size · material). */
const SUBTITLE_FIELDS = 3;

/**
 * One product on D1: its name, a subtitle built from the org's own product
 * fields, and its selling price. Drafts carry a badge; there is deliberately
 * no per-row order count — that lifetime figure waits for the metrics layer, so
 * it is left off rather than shown partial.
 */
export default function ProductListRow({
  product,
  fields,
  fmt,
  onOpen,
}: {
  product: Product;
  fields: FieldDefinition[];
  fmt: (value: number) => string;
  onOpen: () => void;
}) {
  const custom = (product.custom_data ?? {}) as Record<string, unknown>;
  const subtitle = fields
    .map(field => formatFieldValue(custom[field.field_name], field))
    .filter((value): value is string => value !== null)
    .slice(0, SUBTITLE_FIELDS)
    .join(' · ');

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 px-3.5 py-[13px] text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold text-foreground">{product.name}</div>
        {subtitle && (
          <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{subtitle}</div>
        )}
      </div>

      <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
        <span className="text-[13.5px] font-semibold text-foreground">
          {product.selling_price == null ? '—' : fmt(product.selling_price)}
        </span>
        {product.status === 'draft' && (
          <span className="rounded-full bg-opt-amber-bg px-2 py-0.5 text-[11px] font-medium text-opt-amber-fg">
            Draft
          </span>
        )}
      </div>
    </button>
  );
}
