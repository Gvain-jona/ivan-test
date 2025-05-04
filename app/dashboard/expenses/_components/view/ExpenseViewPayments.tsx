import React from 'react';
import { PlusCircle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Expense, ExpensePayment } from '@/hooks/expenses';
import { PaymentCard, EmptyState } from '../shared';

interface ExpenseViewPaymentsProps {
  expense: Expense;
  onAddPayment: () => void;
  onEditPayment?: (payment: ExpensePayment) => void;
  onDeletePayment?: (id: string) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * Payments section of the expense view
 */
export function ExpenseViewPayments({ 
  expense, 
  onAddPayment,
  onEditPayment,
  onDeletePayment,
  isSubmitting = false
}: ExpenseViewPaymentsProps) {
  const hasPayments = expense.payments && expense.payments.length > 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">
          Payments
          {hasPayments && (
            <Badge variant="outline" className="ml-2 bg-muted">
              {expense.payments.length}
            </Badge>
          )}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddPayment}
          disabled={isSubmitting}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Payment
        </Button>
      </div>

      {hasPayments ? (
        <div className="space-y-3">
          {expense.payments.map((payment: ExpensePayment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              onEdit={onEditPayment}
              onDelete={onDeletePayment}
              isSubmitting={isSubmitting}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<DollarSign className="h-8 w-8" />}
          title="No payments yet"
          actionLabel="Add Payment"
          onAction={onAddPayment}
        />
      )}
    </div>
  );
}
