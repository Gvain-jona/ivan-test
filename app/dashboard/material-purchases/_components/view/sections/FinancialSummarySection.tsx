'use client';

import React from 'react';
import { DollarSign, CreditCard, Wallet, ArrowDown, ArrowUp, CircleDollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useMaterialPurchaseView } from '../context/MaterialPurchaseViewContext';
import { SectionHeader } from '../SectionHeader';
import { SectionCard, SectionCardLabel, SectionCardValue } from '../SectionCard';
import { StatusBadge } from '../StatusBadge';

export function FinancialSummarySection() {
  const { purchase } = useMaterialPurchaseView();

  if (!purchase) return null;

  // Calculate payment status
  const paymentStatus = purchase.payment_status ||
    (purchase.total_amount === purchase.amount_paid ? 'paid' :
      purchase.amount_paid > 0 ? 'partially_paid' : 'unpaid');

  // Map payment status to StatusBadge status type
  const getPaymentStatusType = () => {
    if (paymentStatus === 'paid') {
      return 'success';
    } else if (paymentStatus === 'partially_paid') {
      return 'warning';
    } else {
      return 'error';
    }
  };

  // Get payment status label
  const getPaymentStatusLabel = () => {
    if (paymentStatus === 'paid') {
      return 'Paid';
    } else if (paymentStatus === 'partially_paid') {
      return 'Partially Paid';
    } else {
      return 'Unpaid';
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Financial Summary"
        icon={<DollarSign className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-4">
        {/* Payment Status Badge */}
        <SectionCard className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Payment Status</span>
          </div>
          <StatusBadge
            status={getPaymentStatusType()}
            label={getPaymentStatusLabel()}
          />
        </SectionCard>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          {/* Total Amount */}
          <SectionCard>
            <div className="flex items-center gap-2 mb-1">
              <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
              <SectionCardLabel>Total Amount</SectionCardLabel>
            </div>
            <SectionCardValue>{formatCurrency(purchase.total_amount || 0)}</SectionCardValue>
          </SectionCard>

          {/* Amount Paid */}
          <SectionCard>
            <div className="flex items-center gap-2 mb-1">
              <ArrowUp className="h-4 w-4 text-green-500" />
              <SectionCardLabel>Amount Paid</SectionCardLabel>
            </div>
            <SectionCardValue className="text-green-500">{formatCurrency(purchase.amount_paid || 0)}</SectionCardValue>
          </SectionCard>

          {/* Balance */}
          <SectionCard>
            <div className="flex items-center gap-2 mb-1">
              <ArrowDown className="h-4 w-4 text-orange-500" />
              <SectionCardLabel>Balance</SectionCardLabel>
            </div>
            <SectionCardValue className="text-orange-500">{formatCurrency((purchase.total_amount || 0) - (purchase.amount_paid || 0))}</SectionCardValue>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
