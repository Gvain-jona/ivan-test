import React from 'react';
import { Button } from '@/components/ui/button';
import { DollarSign, Loader2, Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Expense, ExpensePayment } from '@/hooks/expenses';
import { SectionHeader } from '../SectionHeader';
import { ItemCard } from '../ItemCard';
import { EmptyStateMessage } from '../EmptyStateMessage';

interface PaymentsSectionProps {
  expense: Expense;
  payments: ExpensePayment[];
  loadingStates: {
    addPayment: boolean;
    editPayment: string | null;
    deletePayment: string | null;
  };
  onAddPayment: () => void;
  onEditPayment: (payment: ExpensePayment) => void;
  onDeletePayment: (id: string) => void;
}

/**
 * Payments section component for the expense view
 * Displays a list of payments and provides actions to add, edit, and delete payments
 */
export function PaymentsSection({
  expense,
  payments,
  loadingStates,
  onAddPayment,
  onEditPayment,
  onDeletePayment
}: PaymentsSectionProps) {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Payment History"
        count={payments.length}
        badgeColor="green"
        icon={<DollarSign className="h-5 w-5" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={onAddPayment}
            disabled={loadingStates?.addPayment}
          >
            {loadingStates?.addPayment ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Add Payment
          </Button>
        }
      />

      {payments.length > 0 ? (
        <div className="space-y-3">
          {payments.map((payment) => (
            <ItemCard
              key={payment.id}
              id={payment.id}
              title={formatCurrency(payment.amount)}
              badges={[
                <span key="method" className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                  {payment.payment_method?.replace('_', ' ')}
                </span>
              ]}
              subtitle={formatDate(payment.date)}
              accentColor="green"
              onEdit={() => onEditPayment(payment)}
              onDelete={() => onDeletePayment(payment.id)}
              isEditLoading={loadingStates?.editPayment === payment.id}
              isDeleteLoading={loadingStates?.deletePayment === payment.id}
            />
          ))}
        </div>
      ) : (
        <EmptyStateMessage
          title="No payments yet"
          description="Add a payment to track the expense payment history"
          icon={<DollarSign className="h-8 w-8" />}
          actionLabel="Add Payment"
          onAction={onAddPayment}
          isLoading={loadingStates?.addPayment}
        />
      )}
    </div>
  );
}
