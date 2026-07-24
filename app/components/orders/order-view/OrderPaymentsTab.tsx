import React, { useState } from 'react';
import { Plus, Wallet, Loader2 } from 'lucide-react';
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
import { formatCurrency } from '@/lib/utils';
import type { OrderPaymentsTabProps } from './types';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'bank', label: 'Bank' },
  { value: 'credit', label: 'Credit' },
] as const;

/**
 * OrderPaymentsTab lists payments and records new ones. The DB trigger
 * recomputes the order's money fields; balance/payment_status are
 * generated columns, never set here.
 */
const OrderPaymentsTab: React.FC<OrderPaymentsTabProps> = ({
  order,
  payments,
  onAddPayment,
  isSubmitting,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]['value']>('cash');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const balance = order.balance ?? order.total_amount - order.amount_paid;

  const handleSubmit = async () => {
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) return;
    await onAddPayment({ amount: parsed, payment_method: method, payment_date: date });
    setAmount('');
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Balance strip */}
      <div className="border border-border/40 rounded-lg p-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-[#6D6D80]">Total</p>
          <p className="text-base font-medium text-foreground">{formatCurrency(order.total_amount)}</p>
        </div>
        <div>
          <p className="text-xs text-[#6D6D80]">Paid</p>
          <p className="text-base font-medium text-green-500">{formatCurrency(order.amount_paid)}</p>
        </div>
        <div>
          <p className="text-xs text-[#6D6D80]">Balance</p>
          <p className="text-base font-medium text-primary">{formatCurrency(balance)}</p>
        </div>
      </div>

      {/* Payments list */}
      {payments.length === 0 ? (
        <div className="border border-border/40 rounded-lg p-8 text-center text-muted-foreground">
          <Wallet className="h-6 w-6 mx-auto mb-2 opacity-60" />
          <p className="text-sm">No payments recorded</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map(payment => (
            <div
              key={payment.id}
              className="border border-border/40 rounded-lg p-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{formatCurrency(payment.amount)}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {payment.payment_method.replace(/_/g, ' ')}
                  {payment.notes ? ` · ${payment.notes}` : ''}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(payment.payment_date).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add payment */}
      {showForm ? (
        <div className="border border-border/40 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="payment-amount">Amount</Label>
              <Input
                id="payment-amount"
                type="number"
                inputMode="decimal"
                min="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Method</Label>
              <Select value={method} onValueChange={v => setMethod(v as typeof method)}>
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
              <Label htmlFor="payment-date">Date</Label>
              <Input
                id="payment-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={isSubmitting || !amount}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Record Payment
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="w-full">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Payment
        </Button>
      )}
    </div>
  );
};

export default OrderPaymentsTab;
