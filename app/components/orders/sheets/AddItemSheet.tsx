'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AppSheet from '@/components/ui/sheets/AppSheet';
import { FooterBar } from '@/components/patterns/screen';
import { useProducts, useProductMutations } from '@/hooks/products/useProducts';
import { useFieldDefinitions } from '@/hooks/fields/useFieldDefinitions';
import { useDebounce } from '@/hooks/useDebounce';
import { useFormatCurrency } from '@/hooks/organization/useFormatCurrency';
import { useToast } from '@/components/ui/use-toast';
import { lineTotal, type DraftItem } from '@/lib/orders/draft';
import type { CustomDataValue } from '@/lib/fields/visibility';
import { ChosenState, SearchState, type Chosen } from './add-item-states';

interface AddItemSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Handed the finished line; the caller decides whether it goes to a draft
   * (synchronous) or the API (async, returning whether the write succeeded).
   * The sheet closes on anything but an explicit `false`, so a rejected write
   * keeps the composed line on screen.
   */
  onAdd: (item: Omit<DraftItem, 'key'>) => void | boolean | Promise<void | boolean>;
  /**
   * An existing line to correct. Present means edit: the sheet opens straight
   * into the chosen state with the line's values, rather than at the search.
   */
  editing?: DraftItem | null;
  /**
   * Remove the line being edited. Lives in here rather than on the row because
   * the frame gives item rows no remove affordance — you open a line to change
   * it, and one of the changes is that it shouldn't be there.
   */
  onRemove?: () => void;
  busy?: boolean;
}

/**
 * Add a line to an order — B2a (search) and B2a2 (chosen) on the canvas, which
 * are two states of one sheet rather than two surfaces.
 *
 * Searching happens in the sheet and resolving a product replaces the search
 * with the line's details, the same in-place rule `ClientField` follows: on
 * mobile the thing you'd stack a picker on is already a sheet.
 *
 * A product is optional. `v2.order_items` takes either a `product_id` or a
 * `product_name_raw`, so "Vinyl sticker" typed once for one job doesn't have to
 * become a catalogue entry first — the row a print shop actually needs.
 */
export default function AddItemSheet({
  open,
  onOpenChange,
  onAdd,
  editing,
  onRemove,
  busy,
}: AddItemSheetProps) {
  const fmt = useFormatCurrency();
  const { toast } = useToast();
  const { createProduct } = useProductMutations();
  const [query, setQuery] = useState('');
  const [chosen, setChosen] = useState<Chosen | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const submittingRef = useRef(false);

  const debounced = useDebounce(query, 250);
  const { products, isLoading } = useProducts({
    status: 'active',
    search: debounced || undefined,
    limit: 8,
  });

  const { fieldDefinitions: lineFields } = useFieldDefinitions('order_item');
  const { fieldDefinitions: productFields } = useFieldDefinitions('product');

  // Opening loads the line being edited, or a blank search. Reopening must
  // never resume the last line half-composed.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setPromoting(false);
    if (editing) {
      setChosen({
        product_id: editing.product_id,
        product_name_raw: editing.product_name_raw,
        name: editing.name,
        meta: editing.meta,
        unit_price: editing.unit_price,
        custom_data: editing.custom_data ?? {},
      });
      setQuantity(String(editing.quantity));
      setUnitPrice(String(editing.unit_price));
    } else {
      setChosen(null);
      setQuantity('1');
      setUnitPrice('');
    }
  }, [open, editing]);

  const quantityValue = Number(quantity) || 0;
  const unitPriceValue = Number(unitPrice) || 0;
  const total = useMemo(
    () => lineTotal({ quantity: quantityValue, unit_price: unitPriceValue }),
    [quantityValue, unitPriceValue],
  );

  const valid = chosen !== null && quantityValue > 0 && unitPriceValue >= 0;

  /**
   * Prefill the line from the product, but only for fields the *line* has.
   *
   * `validate_custom_data` rejects any key without a matching field-definition
   * for that entity ("unknown field % on %"), and product fields are a
   * different set from order_item ones — an org with category/unit/material on
   * its products and only `size` on its lines would have every order create
   * fail. So the copy is an intersection, which is also the right meaning:
   * `size` is prefilled because the line has a size, not because the product
   * happens to carry one.
   */
  const choose = (next: Chosen) => {
    const lineNames = new Set(lineFields.map(field => field.field_name));
    const prefill: CustomDataValue = {};
    for (const [key, value] of Object.entries(next.custom_data)) {
      if (lineNames.has(key)) prefill[key] = value;
    }

    setChosen({ ...next, custom_data: prefill });
    setUnitPrice(next.unit_price ? String(next.unit_price) : '');
  };

  // A one-off is a line with a raw name and no catalogue backing. `create_order`
  // is happy to keep it that way, but a product typed a second time should be
  // savable so it stops being re-typed — the inverse of "Add as a one-off".
  const isOneOff = chosen !== null && chosen.product_id === null && !!chosen.product_name_raw;

  /**
   * Persist the current one-off to the product catalogue and rebind the line to
   * it, in place — no second sheet, since we already hold everything a product
   * needs (name, the entered price, its own fields). `custom_data` is narrowed
   * to product fields: line fields are a different set, and
   * `validate_custom_data` rejects any key without a matching definition.
   */
  const promote = async () => {
    if (!chosen || !isOneOff || promoting) return;
    setPromoting(true);
    try {
      const productNames = new Set(productFields.map(field => field.field_name));
      const custom_data: CustomDataValue = {};
      for (const [key, value] of Object.entries(chosen.custom_data)) {
        if (productNames.has(key)) custom_data[key] = value;
      }
      const created = await createProduct({
        name: chosen.name,
        selling_price: unitPriceValue,
        ...(Object.keys(custom_data).length > 0 ? { custom_data } : {}),
      });
      setChosen({ ...chosen, product_id: created.id, product_name_raw: undefined });
      toast({ title: 'Saved to catalogue', description: chosen.name });
    } catch (error) {
      toast({
        title: 'Could not save to catalogue',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPromoting(false);
    }
  };

  const submit = async () => {
    if (!chosen || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const result = await onAdd({
        product_id: chosen.product_id,
        ...(chosen.product_name_raw ? { product_name_raw: chosen.product_name_raw } : {}),
        name: chosen.name,
        meta: chosen.meta,
        quantity: quantityValue,
        unit_price: unitPriceValue,
        ...(Object.keys(chosen.custom_data).length > 0
          ? { custom_data: chosen.custom_data }
          : {}),
      });
      if (result !== false) onOpenChange(false);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit item' : 'Add item'}
      size="default"
      footer={
        <FooterBar
          figureLabel="LINE TOTAL"
          figureValue={chosen ? fmt(total) : '—'}
          actionLabel={editing ? 'Save item' : 'Add item'}
          onAction={submit}
          disabled={!valid || busy || submitting}
          busy={busy || submitting}
        />
      }
    >
      <div className="flex flex-col gap-[22px] px-4 py-4">
        {chosen === null ? (
          <SearchState
            query={query}
            onQuery={setQuery}
            products={products}
            isLoading={isLoading}
            productFields={productFields}
            onChoose={choose}
            fmt={fmt}
          />
        ) : (
          <ChosenState
            chosen={chosen}
            lineFields={lineFields}
            quantity={quantity}
            unitPrice={unitPrice}
            onQuantity={setQuantity}
            onUnitPrice={setUnitPrice}
            onCustomData={next => setChosen({ ...chosen, custom_data: next })}
            // Editing an existing line can't fall back to the product search:
            // the line already is what it is, and swapping its product is a
            // different act from correcting its quantity.
            onBack={editing ? undefined : () => setChosen(null)}
            onSaveToCatalogue={isOneOff ? promote : undefined}
            promoting={promoting}
          />
        )}

        {editing && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className="self-start text-[13px] font-medium text-destructive disabled:opacity-50"
          >
            Remove this item
          </button>
        )}
      </div>
    </AppSheet>
  );
}

