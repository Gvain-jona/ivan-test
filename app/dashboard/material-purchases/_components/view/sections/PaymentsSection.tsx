'use client';

import React, { useState } from 'react';
import { DollarSign, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useMaterialPurchaseView } from '../context/MaterialPurchaseViewContext';
import { SectionHeader } from '../SectionHeader';
import { MaterialPayment } from '@/types/materials';
import { AddMaterialPaymentForm } from '../AddMaterialPaymentForm';
import { EditMaterialPaymentForm } from '../EditMaterialPaymentForm';
import { EmptyStateMessage } from '../EmptyStateMessage';
import { ItemCard } from '../ItemCard';
import { StatusBadge } from '../StatusBadge';
import { usePaymentManagement } from './PaymentsSection/hooks/usePaymentManagement';

export function PaymentsSection() {
  const { purchase } = useMaterialPurchaseView();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<MaterialPayment | null>(null);

  const {
    handleAddPayment,
    handleEditPayment,
    handleDeletePayment,
    loadingStates
  } = usePaymentManagement();

  if (!purchase) return null;

  const payments = purchase.payments || [];

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Payments"
        count={payments.length}
        icon={<DollarSign className="h-5 w-5" />}
        badgeColor="green"
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Payment
          </Button>
        }
      />

      {payments.length === 0 ? (
        <EmptyStateMessage
          message="No payments recorded yet"
          actionLabel="Add Payment"
          onAction={() => setShowAddForm(true)}
        />
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => {
            const paymentBadge = (
              <StatusBadge
                status="success"
                label={payment.payment_method || 'Cash'}
                className="w-fit"
              />
            );

            return (
              <ItemCard
                key={payment.id}
                title={formatCurrency(payment.amount)}
                subtitle={`Date: ${formatDate(payment.date)}`}
                badges={paymentBadge}
                icon={<DollarSign className="h-5 w-5 text-green-500" />}
                accentColor="green"
                actions={
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingPayment(payment)}
                      disabled={loadingStates.deletePayment === payment.id}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDeletePayment(payment.id)}
                      disabled={loadingStates.deletePayment === payment.id}
                    >
                      {loadingStates.deletePayment === payment.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </>
                }
              />
            );
          })}
        </div>
      )}

      {/* Add Payment Form */}
      {showAddForm && (
        <AddMaterialPaymentForm
          purchase={purchase}
          onSubmit={handleAddPayment}
          onClose={() => setShowAddForm(false)}
          isSubmitting={loadingStates.addPayment}
        />
      )}

      {/* Edit Payment Form */}
      {editingPayment && (
        <EditMaterialPaymentForm
          payment={editingPayment}
          onSubmit={(updatedPayment) => {
            handleEditPayment(updatedPayment);
            setEditingPayment(null);
          }}
          onClose={() => setEditingPayment(null)}
          isSubmitting={loadingStates.editPayment === editingPayment.id}
        />
      )}
    </div>
  );
}
