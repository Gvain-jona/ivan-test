'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
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
import ClientFormSheet from '@/components/clients/ClientFormSheet';
import { useClients } from '@/hooks/clients/useClients';
import { useProducts } from '@/hooks/products/useProducts';
import { useFieldDefinitions } from '@/hooks/fields/useFieldDefinitions';
import { useOrderStatuses } from '@/hooks/orders/useOrderStatuses';
import { useFormatCurrency } from '@/hooks/organization/useFormatCurrency';
import type { OrderCreateInput } from '@/hooks/orders/useOrders';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'bank', label: 'Bank' },
  { value: 'credit', label: 'Credit' },
] as const;

/** Sentinel for the "free-text item" choice in the product picker. */
const CUSTOM_ITEM = '__custom__';
/** Sentinel for the "+ New client" choice in the client picker. */
const NEW_CLIENT = '__new_client__';

interface ItemDraft {
  product_id: string | null;
  product_name_raw: string;
  quantity: string;
  unit_price: string;
  discount: string;
  custom_data: Record<string, unknown>;
}

interface PaymentDraft {
  amount: string;
  payment_method: (typeof PAYMENT_METHODS)[number]['value'];
  payment_date: string;
}

const emptyItem = (): ItemDraft => ({
  product_id: null,
  product_name_raw: '',
  quantity: '1',
  unit_price: '',
  discount: '',
  custom_data: {},
});

interface OrderFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: OrderCreateInput) => Promise<{ success: boolean; error?: unknown }>;
  title?: string;
}

/**
 * Create-order sheet on the v2 model: hard client FK, org-defined
 * custom fields on the order and each item (rendered from the field
 * registry), product picker with overridable price or free-text lines,
 * optional payments. Submits once through the atomic create_order RPC.
 * Field-level custom_data validation stays in the DB; its precise
 * message surfaces via the save error toast.
 */
export default function OrderFormSheet({ open, onOpenChange, onSave, title }: OrderFormSheetProps) {
  const { clients } = useClients({ status: 'active', limit: 100 });
  const { products } = useProducts({ status: 'active', limit: 100 });
  const { statusValues, defaultStatus } = useOrderStatuses();
  const fmt = useFormatCurrency();
  const { fieldDefinitions: orderFields } = useFieldDefinitions('order');
  const { fieldDefinitions: itemFields } = useFieldDefinitions('order_item');

  const [clientId, setClientId] = useState('');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  // No hardcoded default: the starting status is the workflow's default
  // option (or its first), filled in once the field-definition loads.
  const [status, setStatus] = useState('');
  const [customData, setCustomData] = useState<Record<string, unknown>>({});
  const [items, setItems] = useState<ItemDraft[]>([emptyItem()]);
  const [payments, setPayments] = useState<PaymentDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  // Walk-in customers: create the client without leaving the order
  const [newClientOpen, setNewClientOpen] = useState(false);

  const updateItem = (index: number, patch: Partial<ItemDraft>) => {
    setItems(prev => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const handleProductPick = (index: number, value: string) => {
    if (value === CUSTOM_ITEM) {
      updateItem(index, { product_id: null });
      return;
    }
    const product = products.find(p => p.id === value);
    updateItem(index, {
      product_id: value,
      product_name_raw: product?.name ?? '',
      // Default price from the catalog — always overridable at the line
      unit_price:
        product?.selling_price != null ? String(product.selling_price) : '',
    });
  };

  const orderTotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    const discount = Number(item.discount) || 0;
    return sum + (qty * price - discount);
  }, 0);

  const canSubmit =
    clientId &&
    items.length > 0 &&
    items.every(
      item =>
        (item.product_id || item.product_name_raw.trim()) &&
        Number(item.quantity) > 0 &&
        Number(item.unit_price) >= 0,
    );

  // Seed the status once the workflow loads (or after a reset cleared it).
  useEffect(() => {
    if (!status && defaultStatus) setStatus(defaultStatus);
  }, [status, defaultStatus]);

  const resetForm = () => {
    setClientId('');
    setOrderDate(new Date().toISOString().slice(0, 10));
    setStatus(defaultStatus);
    setCustomData({});
    setItems([emptyItem()]);
    setPayments([]);
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const input: OrderCreateInput = {
        client_id: clientId,
        order_date: orderDate,
        status,
        ...(Object.keys(customData).length > 0 && { custom_data: customData }),
        items: items.map(item => ({
          product_id: item.product_id,
          ...(item.product_name_raw.trim() && { product_name_raw: item.product_name_raw.trim() }),
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price) || 0,
          ...(Number(item.discount) > 0 && { discount: Number(item.discount) }),
          ...(Object.keys(item.custom_data).length > 0 && { custom_data: item.custom_data }),
        })),
        ...(payments.length > 0 && {
          payments: payments
            .filter(p => Number(p.amount) > 0)
            .map(p => ({
              amount: Number(p.amount),
              payment_method: p.payment_method,
              payment_date: p.payment_date,
            })),
        }),
      };

      const result = await onSave(input);
      if (result.success) resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OrderSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title ?? 'Create New Order'}
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
          <Button className="flex-1" onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Create Order
          </Button>
        </div>
      }
    >
      <div className="p-4 space-y-6">
        {/* General */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">General</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>
                Client<span className="ml-0.5 text-destructive">*</span>
              </Label>
              <Select
                value={clientId}
                onValueChange={value => {
                  if (value === NEW_CLIENT) setNewClientOpen(true);
                  else setClientId(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NEW_CLIENT}>+ New client…</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="order-date">Order Date</Label>
              <Input
                id="order-date"
                type="date"
                value={orderDate}
                onChange={e => setOrderDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusValues.map(s => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <CustomFieldsForm fields={orderFields} value={customData} onChange={setCustomData} />
        </section>

        {/* Items */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Items</h3>
            <span className="text-sm text-white font-medium">{fmt(orderTotal)}</span>
          </div>
          {items.map((item, index) => (
            <div key={index} className="border border-[#2B2B40] rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Product</Label>
                  <Select
                    value={item.product_id ?? CUSTOM_ITEM}
                    onValueChange={value => handleProductPick(index, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CUSTOM_ITEM}>Custom item (free text)</SelectItem>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                          {product.selling_price != null
                            ? ` — ${fmt(product.selling_price)}`
                            : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Item name{item.product_id ? ' (from product)' : ''}</Label>
                  <Input
                    value={item.product_name_raw}
                    onChange={e => updateItem(index, { product_name_raw: e.target.value })}
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
                    value={item.quantity}
                    onChange={e => updateItem(index, { quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={item.unit_price}
                    onChange={e => updateItem(index, { unit_price: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Discount</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={item.discount}
                    onChange={e => updateItem(index, { discount: e.target.value })}
                  />
                </div>
              </div>
              <CustomFieldsForm
                fields={itemFields}
                value={item.custom_data}
                onChange={next => updateItem(index, { custom_data: next })}
              />
              {items.length > 1 && (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setItems(prev => prev.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Remove item
                  </Button>
                </div>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setItems(prev => [...prev, emptyItem()])}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Item
          </Button>
        </section>

        {/* Payments (optional) */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Payments (optional)</h3>
          {payments.map((payment, index) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={payment.amount}
                  onChange={e =>
                    setPayments(prev =>
                      prev.map((p, i) => (i === index ? { ...p, amount: e.target.value } : p)),
                    )
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Method</Label>
                <Select
                  value={payment.payment_method}
                  onValueChange={value =>
                    setPayments(prev =>
                      prev.map((p, i) =>
                        i === index
                          ? { ...p, payment_method: value as PaymentDraft['payment_method'] }
                          : p,
                      ),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(m => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={payment.payment_date}
                  onChange={e =>
                    setPayments(prev =>
                      prev.map((p, i) =>
                        i === index ? { ...p, payment_date: e.target.value } : p,
                      ),
                    )
                  }
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => setPayments(prev => prev.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPayments(prev => [
                ...prev,
                {
                  amount: '',
                  payment_method: 'cash',
                  payment_date: new Date().toISOString().slice(0, 10),
                },
              ])
            }
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Payment
          </Button>
        </section>
      </div>

      {/* Inline client creation for walk-in customers */}
      <ClientFormSheet
        open={newClientOpen}
        onOpenChange={setNewClientOpen}
        client={null}
        onSaved={saved => setClientId(saved.id)}
      />
    </OrderSheet>
  );
}
