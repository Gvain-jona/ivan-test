'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AppSheet from '@/components/ui/sheets/AppSheet';
import { FooterBar, SectionLabel } from '@/components/patterns/screen';
import { ChoiceChip } from '@/components/patterns/controls';
import { useProductMutations } from '@/hooks/products/useProducts';
import { useFieldDefinitions } from '@/hooks/fields/useFieldDefinitions';
import { useFormatCurrency } from '@/hooks/organization/useFormatCurrency';
import { useToast } from '@/components/ui/use-toast';
import { normalizeOptions } from '@/lib/fields/options';
import type { DraftItem } from '@/lib/orders/draft';

interface FirstProductSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Handed the finished line once the product is saved to the catalogue, so the
   * caller drops it straight onto the order as its first item.
   */
  onCreated: (item: Omit<DraftItem, 'key'>) => void;
}

const box =
  'flex h-10 w-full items-center rounded-lg border border-border bg-background px-3 ' +
  'text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring';

/**
 * The guided first product — the second step of the fresh-org walkthrough.
 *
 * Unlike `AddItemSheet` (which lets a repeat user search the catalogue or type
 * a one-off), this introduces the catalogue itself: it saves a real product so
 * the org's second order can reuse it, and it surfaces the **seeded Category
 * options** the org already has (Business Cards, Flyers, …) so the person sees
 * the format is pre-set rather than something to invent. Kept to Category →
 * Name → Price on purpose; the other seeded fields (Size, Material, Unit) are
 * editable later in Products and would bury the one order they came to make.
 *
 * Category is a **product** field, so it rides on the created product's
 * `custom_data`, never the order line's — the line only references the new
 * `product_id`, and the category shows on it as display meta.
 */
export default function FirstProductSheet({ open, onOpenChange, onCreated }: FirstProductSheetProps) {
  const fmt = useFormatCurrency();
  const { toast } = useToast();
  const { createProduct } = useProductMutations();
  const { fieldDefinitions: productFields } = useFieldDefinitions('product');

  const categoryOptions = useMemo(() => {
    const field = productFields.find(f => f.field_name === 'category');
    return field ? normalizeOptions(field.options) : [];
  }, [productFields]);

  const [category, setCategory] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);
  // Synchronous double-submit latch, the pattern the other write paths use
  // (useOrderDraft, AddItemSheet, AddNoteSheet): `saving` only disables the
  // button after the re-render commits, so two taps in one tick would both
  // reach save() and create two products + two order lines. The ref flips
  // before the first await.
  const savingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setCategory(null);
    setName('');
    setPrice('');
    setSaving(false);
  }, [open]);

  const priceValue = Number(price) || 0;
  const valid = name.trim() !== '' && priceValue >= 0;

  const save = async () => {
    if (!valid || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const categoryLabel = categoryOptions.find(o => o.value === category)?.label;
      const created = await createProduct({
        name: name.trim(),
        selling_price: priceValue,
        ...(category ? { custom_data: { category } } : {}),
      });
      onCreated({
        product_id: created.id,
        name: created.name,
        unit_price: priceValue,
        quantity: 1,
        ...(categoryLabel ? { meta: categoryLabel } : {}),
      });
      toast({ title: 'Product saved', description: created.name });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Could not save the product',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Your first product"
      size="default"
      footer={
        <FooterBar
          figureLabel="PRICE"
          figureValue={priceValue > 0 ? fmt(priceValue) : '—'}
          actionLabel="Save & add to order"
          onAction={save}
          disabled={!valid || saving}
          busy={saving}
        />
      }
    >
      <div className="flex flex-col gap-[22px] px-4 py-4">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Products are pre-set with Category, Size, Material and Unit — refine those anytime in
          Products. Add your first one and it joins this order.
        </p>

        {categoryOptions.length > 0 && (
          <div className="flex w-full flex-col gap-1.5">
            <SectionLabel>CATEGORY</SectionLabel>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
              {categoryOptions.map(option => (
                <ChoiceChip
                  key={option.value}
                  label={option.label}
                  selected={category === option.value}
                  onSelect={() => setCategory(category === option.value ? null : option.value)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex w-full flex-col gap-1.5">
          <SectionLabel>NAME</SectionLabel>
          <input
            autoFocus
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="e.g. A5 flyer, full colour"
            aria-label="Product name"
            className={box + ' placeholder:font-normal placeholder:text-muted-foreground'}
          />
        </div>

        <div className="flex w-full flex-col gap-1.5">
          <SectionLabel>SELLING PRICE</SectionLabel>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={price}
            onChange={event => setPrice(event.target.value)}
            placeholder="0"
            aria-label="Selling price"
            className={box + ' placeholder:font-normal placeholder:text-muted-foreground'}
          />
        </div>
      </div>
    </AppSheet>
  );
}
