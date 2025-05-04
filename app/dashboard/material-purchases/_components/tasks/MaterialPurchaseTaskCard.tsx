'use client';

import React from 'react';
import { format, parseISO, isAfter, isValid } from 'date-fns';
import {
  CircleCheck, Circle, AlertCircle, Package, Building, Calendar,
  DollarSign, Eye, Receipt, ShoppingBag, Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import { MaterialPurchase } from '@/types/materials';

interface MaterialPurchaseTaskCardProps {
  purchase: MaterialPurchase;
  isDarkMode: boolean;
  onViewPurchase: (purchase: MaterialPurchase) => void;
}

/**
 * Safely parse a date string, returning null if invalid
 */
const safeParseDate = (dateString?: string): Date | null => {
  if (!dateString) return null;
  try {
    const date = parseISO(dateString);
    return isValid(date) ? date : null;
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return null;
  }
};

export function MaterialPurchaseTaskCard({
  purchase,
  isDarkMode,
  onViewPurchase
}: MaterialPurchaseTaskCardProps) {
  // Ensure purchase has all required properties with defaults
  const safeData = {
    id: purchase?.id || '',
    material_name: purchase?.material_name || 'Unnamed Material',
    supplier_name: purchase?.supplier_name || 'Unknown Supplier',
    date: purchase?.date || new Date().toISOString(),
    quantity: purchase?.quantity || 0,
    unit: purchase?.unit || '',
    total_amount: purchase?.total_amount || 0,
    amount_paid: purchase?.amount_paid || 0,
    balance: purchase?.balance || 0,
    payment_status: purchase?.payment_status || 'unpaid',
    installment_plan: !!purchase?.installment_plan,
    total_installments: purchase?.total_installments || 0,
    payment_frequency: purchase?.payment_frequency,
    next_payment_date: purchase?.next_payment_date
  };

  // Determine if this is an installment purchase
  const isInstallment = safeData.installment_plan;

  // Safely parse dates
  const nextPaymentDate = safeParseDate(safeData.next_payment_date);
  const purchaseDate = safeParseDate(safeData.date);

  // Determine the date to display (next payment date or purchase date)
  const displayDate = nextPaymentDate || purchaseDate;

  // Check if the payment is overdue
  const isOverdue = displayDate ? displayDate < new Date() : false;

  // Calculate the amount due (safely handle division by zero)
  const amountDue = isInstallment && safeData.total_installments && safeData.total_installments > 0
    ? safeData.total_amount / safeData.total_installments
    : safeData.balance;

  // Calculate the remaining balance
  const remainingBalance = Math.max(0, safeData.total_amount - safeData.amount_paid);

  // Format the payment frequency for display
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
    <div
      className={cn(
        "flex items-start p-4 rounded-lg border shadow-sm transition-all duration-200 group",
        "hover:shadow-md hover:translate-y-[-1px] cursor-pointer",
        isDarkMode
          ? "bg-card backdrop-blur-sm border-border/40"
          : "bg-card backdrop-blur-sm border-border/40",
        isOverdue && "border-red-500/30"
      )}
      onClick={() => onViewPurchase(purchase)}
    >
      {/* Status Icon */}
      <div className="mr-3 mt-0.5">
        <div
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center transition-colors",
            isOverdue
              ? "text-red-500"
              : safeData.payment_status === 'partially_paid'
                ? "text-amber-500"
                : isDarkMode
                  ? "text-blue-400"
                  : "text-blue-500"
          )}
        >
          {isOverdue ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <h4 className="text-base font-medium truncate">
            {safeData.material_name}
          </h4>

          {/* Payment Status Badge */}
          <Badge
            className={cn(
              "px-1.5 py-0.5 text-xs font-medium",
              safeData.payment_status === 'partially_paid'
                ? isDarkMode
                  ? "bg-amber-900/10 text-amber-400 border-amber-800/20"
                  : "bg-amber-100/80 text-amber-700 border-amber-200"
                : isDarkMode
                  ? "bg-red-900/10 text-red-400 border-red-800/20"
                  : "bg-red-100/80 text-red-700 border-red-200"
            )}
          >
            {safeData.payment_status === 'partially_paid' ? 'Partially Paid' : 'Unpaid'}
          </Badge>

          {/* Installment Badge */}
          {isInstallment && (
            <Badge
              className={cn(
                "px-1.5 py-0.5 text-xs font-medium",
                isDarkMode
                  ? "bg-blue-900/10 text-blue-400 border-blue-800/20"
                  : "bg-blue-100/80 text-blue-700 border-blue-200"
              )}
            >
              Installment
            </Badge>
          )}

          {/* Overdue Badge */}
          {isOverdue && (
            <Badge
              className={cn(
                "px-1.5 py-0.5 text-xs font-medium",
                isDarkMode
                  ? "bg-red-900/10 text-red-400 border-red-800/20"
                  : "bg-red-100/80 text-red-700 border-red-200"
              )}
            >
              Overdue
            </Badge>
          )}
        </div>

        {/* Supplier */}
        <p className="text-sm text-muted-foreground flex items-center mb-2">
          <Building className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
          {safeData.supplier_name}
        </p>

        {/* Amount and Actions */}
        <div className="flex flex-col gap-0.5 w-full">
          <div className="flex items-center justify-between">
            {/* Amount Due */}
            <span className={cn(
              "text-lg font-semibold",
              isDarkMode
                ? "text-orange-400"
                : "text-orange-600"
            )}>
              {formatCurrency(amountDue)}
            </span>

            {/* Action Button */}
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 px-3 rounded-md border",
                isDarkMode
                  ? "bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                  : "bg-transparent border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onViewPurchase(purchase);
              }}
            >
              <Eye className="h-4 w-4 mr-1.5" />
              View Details
            </Button>
          </div>

          {/* Additional Details */}
          <div className="flex items-center gap-3 mt-2">
            {/* Date */}
            <span className={cn(
              "text-sm flex items-center",
              isDarkMode ? "text-gray-400" : "text-gray-500"
            )}>
              <Calendar className="h-3.5 w-3.5 mr-1" />
              {isInstallment ? 'Next Payment:' : 'Purchase Date:'} {displayDate ? format(displayDate, 'MMM d, yyyy') : 'Not set'}
            </span>

            {/* Quantity or Frequency */}
            {isInstallment ? (
              <span className={cn(
                "text-sm flex items-center",
                isDarkMode ? "text-gray-400" : "text-gray-500"
              )}>
                <Receipt className="h-3.5 w-3.5 mr-1" />
                {formatFrequency(safeData.payment_frequency)}
              </span>
            ) : (
              <span className={cn(
                "text-sm flex items-center",
                isDarkMode ? "text-gray-400" : "text-gray-500"
              )}>
                <Package className="h-3.5 w-3.5 mr-1" />
                {safeData.quantity} {safeData.unit ? safeData.unit : 'units'}
              </span>
            )}

            {/* Balance */}
            <span className={cn(
              "text-sm flex items-center ml-auto",
              isDarkMode ? "text-gray-400" : "text-gray-500"
            )}>
              <DollarSign className="h-3.5 w-3.5 mr-1" />
              Balance: {formatCurrency(remainingBalance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
