import React, { useState } from 'react';
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
import { CustomFieldsForm } from '@/components/fields/CustomFieldsForm';
import { useProducts } from '@/hooks/products/useProducts';
import { useFieldDefinitions } from '@/hooks/fields/useFieldDefinitions';
import { formatCurrency } from '@/lib/utils';
import type { OrderItem, OrderItemInput } from '@/hooks/orders/useOrders';

/** Sentinel for the "free-text item" choice in the product picker. */
const CUSTOM_ITEM = '__custom__';

interface OrderItemFormProps {
  /** Existing line for edit mode; null for add mode. */
  item: OrderItem | null;
  /** Always receives the full line shape (add and edit alike). */
  onSubmit: (input: OrderItemInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

/**
 * Inline editor for a single order line (add or edit), on the v2
 * live-name semantics: catalog lines reference the product (name joins
 * live, price defaults from the catalog but is overridable);
 * product_name_raw is sent only for free-text lines. custom_data
 * renders from the field registry; the DB trigger stays the validation
 * authority.
 */
const OrderItemForm: React.FC<OrderItemFormProps> = ({ item, onSubmit, onCancel, isSubmitting }) => {
  const { products } = useProducts({ status: 'active', limit: 100 });
  const { fieldDefinitions: itemFields } = useFieldDefinitions('order_item');

  const [productId, setProductId] = useState<string | null>(item?.product_id ?? null);
  const [nameRaw, setNameRaw] = useState(item?.product_name_raw ?? '');
  const [quantity, setQuantity] = useState(item ? String(item.quantity) : '1');
  const [unitPrice, setUnitPrice] = useState(item ? String(item.unit_price) : '');
  const [discount, setDiscount] = useState(item && item.discount ? String(item.discount) : '');
  const [customData, setCustomData] = useState<Record<string, unknown>>(
    (item?.custom_data as Record<string, unknown>) ?? {},
  );

  const handleProductPick = (value: string) => {
    if (value === CUSTOM_ITEM) {
      setProductId(null);
      return;
    }
    setProductId(value);
    const product = products.find(p => p.id === value);
    if (product?.selling_price != null) setUnitPrice(String(product.selling_price));
  };

  const canSubmit =
    (productId || nameRaw.trim()) && Number(quantity) > 0 && Number(unitPrice) >= 0;

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    await onSubmit({
      product_id: productId,
      // Live-name semantics: the catalog owns the name for product
      // lines; free-text lines carry their own.
      product_name_raw: productId ? null : nameRaw.trim(),
      quantity: Number(quantity),
      unit_price: Number(unitPrice) || 0,
      discount: Number(discount) > 0 ? Number(discount) : 0,
      ...(Object.keys(customData).length > 0 && { custom_data: customData }),
    });
  };

  return (
    <div className="border border-[#2B2B40] rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Product</Label>
          <Select value={productId ?? CUSTOM_ITEM} onValueChange={handleProductPick}>
            <SelectTrigger>
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CUSTOM_ITEM}>Custom item (free text)</SelectItem>
              {products.map(product => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                  {product.selling_price != null
                    ? ` — ${formatCurrency(product.selling_price)}`
                    : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{productId ? 'Item name (from catalog)' : 'Item name'}</Label>
          <Input
            value={productId ? products.find(p => p.id === productId)?.name ?? '' : nameRaw}
            onChange={e => setNameRaw(e.target.value)}
            disabled={productId != null}
            placeholder="e.g. Vinyl banner 2x1m"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Quantity</Label>
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Unit Price</Label>
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            value={unitPrice}
            onChange={e => setUnitPrice(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Discount</Label>
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            value={discount}
            onChange={e => setDiscount(e.target.value)}
          />
        </div>
      </div>
      <CustomFieldsForm fields={itemFields} value={customData} onChange={setCustomData} />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
          {item ? 'Save Item' : 'Add Item'}
        </Button>
      </div>
    </div>
  );
};

export default OrderItemForm;
