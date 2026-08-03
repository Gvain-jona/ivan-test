'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import OrderSheet from '@/components/ui/sheets/OrderSheet';
import { CustomFieldsForm } from '@/components/fields/CustomFieldsForm';
import { useFieldDefinitions } from '@/hooks/fields/useFieldDefinitions';
import { useProductMutations } from '@/hooks/products/useProducts';
import type { Product } from '@/hooks/products/useProducts';
import { useToast } from '@/components/ui/use-toast';

interface ProductFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create; a product = edit */
  product: Product | null;
  onSaved: () => void;
}

/**
 * Create/edit sheet for catalog products. selling_price is the
 * default an order line starts from (always overridable at the point
 * of sale); everything beyond name/price/status is org-defined custom
 * fields from the field registry.
 */
export default function ProductFormSheet({
  open,
  onOpenChange,
  product,
  onSaved,
}: ProductFormSheetProps) {
  const { toast } = useToast();
  const { fieldDefinitions } = useFieldDefinitions('product');
  const { createProduct, updateProduct } = useProductMutations();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState<'active' | 'draft' | 'archived'>('active');
  const [customData, setCustomData] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);

  // Sync form state when the sheet opens for a different product
  useEffect(() => {
    if (!open) return;
    setName(product?.name ?? '');
    setPrice(product?.selling_price != null ? String(product.selling_price) : '');
    setStatus((product?.status as typeof status) ?? 'active');
    setCustomData((product?.custom_data as Record<string, unknown>) ?? {});
  }, [open, product]);

  const handleSubmit = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const input = {
        name: name.trim(),
        selling_price: price === '' ? null : Number(price),
        status,
        ...(Object.keys(customData).length > 0 && { custom_data: customData }),
      };
      if (product) {
        await updateProduct(product.id, input);
        toast({ title: 'Product updated' });
      } else {
        await createProduct(input);
        toast({ title: 'Product created' });
      }
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save product',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OrderSheet
      open={open}
      onOpenChange={onOpenChange}
      title={product ? `Edit ${product.name}` : 'New Product'}
      footer={
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={!name.trim() || submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            {product ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      }
    >
      <div className="p-4 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="product-name">
              Name<span className="ml-0.5 text-destructive">*</span>
            </Label>
            <Input
              id="product-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Vinyl Banner"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="product-price">Selling Price</Label>
            <Input
              id="product-price"
              type="number"
              inputMode="decimal"
              min="0"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-1.5 max-w-48">
          <Label>Status</Label>
          <Select value={status} onValueChange={v => setStatus(v as typeof status)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <CustomFieldsForm fields={fieldDefinitions} value={customData} onChange={setCustomData} />
      </div>
    </OrderSheet>
  );
}
