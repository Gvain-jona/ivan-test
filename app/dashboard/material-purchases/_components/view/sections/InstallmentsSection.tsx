'use client';

import React from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2, CalendarClock } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useMaterialPurchaseView } from '../context/MaterialPurchaseViewContext';
import { SectionHeader } from '../SectionHeader';
import { EmptyStateMessage } from '../EmptyStateMessage';
import { ItemCard } from '../ItemCard';
import { SectionCard, SectionCardLabel, SectionCardValue } from '../SectionCard';
import { StatusBadge } from '../StatusBadge';

export function InstallmentsSection() {
  const { purchase } = useMaterialPurchaseView();

  if (!purchase || (!purchase.installment_plan && !purchase.enable_installments)) return null;

  const installments = purchase.installments || [];

  // Calculate installment status
  const getInstallmentStatus = (installment: any) => {
    const dueDate = new Date(installment.due_date);
    const today = new Date();

    if (installment.is_paid) {
      return {
        status: 'success' as const,
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        label: 'Paid',
        cardClass: 'border-green-500/30 bg-green-500/5'
      };
    } else if (dueDate < today) {
      return {
        status: 'error' as const,
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        label: 'Overdue',
        cardClass: 'border-red-500/30 bg-red-500/5'
      };
    } else {
      return {
        status: 'warning' as const,
        icon: <CalendarClock className="h-5 w-5 text-amber-500" />,
        label: 'Upcoming',
        cardClass: ''
      };
    }
  };

  // Calculate installment plan details
  const totalInstallmentAmount = installments.reduce((sum, inst) => sum + (inst.amount || 0), 0);
  const paidInstallments = installments.filter(inst => inst.is_paid).length;
  const overdueInstallments = installments.filter(inst => {
    const dueDate = new Date(inst.due_date);
    const today = new Date();
    return !inst.is_paid && dueDate < today;
  }).length;

  // Format payment frequency for display
  const formatFrequency = (frequency: string | undefined) => {
    if (!frequency) return 'Not specified';

    switch (frequency) {
      case 'weekly': return 'Weekly';
      case 'biweekly': return 'Every 2 Weeks';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      default: return frequency;
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Installment Plan"
        count={installments.length}
        icon={<Calendar className="h-5 w-5" />}
        badgeColor="amber"
      />

      {/* Installment Plan Settings */}
      <SectionCard className="p-4 mb-4">
        <h4 className="text-sm font-medium mb-3">Installment Plan Settings</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center">
              <CalendarClock className="h-4 w-4 mr-2" />
              Number of Installments
            </p>
            <p className="text-sm font-medium">{purchase.total_installments || installments.length}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Payment Frequency
            </p>
            <p className="text-sm font-medium">{formatFrequency(purchase.payment_frequency)}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              First Payment Date
            </p>
            <p className="text-sm font-medium">{purchase.next_payment_date ? formatDate(purchase.next_payment_date) : 'Not specified'}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Reminder Days
            </p>
            <p className="text-sm font-medium">{purchase.reminder_days !== undefined ? `${purchase.reminder_days} days before due date` : 'Not specified'}</p>
          </div>
        </div>
      </SectionCard>

      {/* Installment Plan Summary - Temporarily hidden
      {installments.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <SectionCard>
            <SectionCardLabel>Total Installments</SectionCardLabel>
            <SectionCardValue>{installments.length}</SectionCardValue>
          </SectionCard>

          <SectionCard>
            <SectionCardLabel>Paid / Overdue</SectionCardLabel>
            <SectionCardValue>
              <span className="text-green-500">{paidInstallments}</span> /
              <span className="text-red-500">{overdueInstallments}</span>
            </SectionCardValue>
          </SectionCard>

          <SectionCard>
            <SectionCardLabel>Total Amount</SectionCardLabel>
            <SectionCardValue>{formatCurrency(totalInstallmentAmount)}</SectionCardValue>
          </SectionCard>
        </div>
      )}
      */}

      {/* Installment cards - Temporarily hidden
      {installments.length === 0 ? (
        <EmptyStateMessage
          message="No installment plan set up"
        />
      ) : (
        <div className="space-y-3">
          {installments.map((installment, index) => {
            const { status, color, icon, label } = getInstallmentStatus(installment);

            const statusBadge = <StatusBadge status={status} label={label} className="w-fit" />;

            return (
              <ItemCard
                key={installment.id || index}
                title={`Installment ${index + 1} - ${formatCurrency(installment.amount)}`}
                subtitle={`Due: ${formatDate(installment.due_date)}`}
                description={installment.notes && <span className="text-xs">{installment.notes}</span>}
                badges={statusBadge}
                icon={icon}
                accentColor={status === 'success' ? 'green' : status === 'error' ? 'red' : 'yellow'}
              />
            );
          })}
        </div>
      )}
      */}
    </div>
  );
}
