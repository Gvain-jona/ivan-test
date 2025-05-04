'use client';

import React from 'react';
import { format, isToday, isTomorrow, isYesterday, parseISO, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MaterialPurchase } from '@/types/materials';
import { MaterialPurchaseTaskCard } from './MaterialPurchaseTaskCard';

interface DateGroupProps {
  dateKey: string;
  dateItems: MaterialPurchase[];
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

export function DateGroup({
  dateKey,
  dateItems,
  isDarkMode,
  onViewPurchase
}: DateGroupProps) {
  // Safely parse the date
  const date = safeParseDate(dateKey) || new Date();

  const isDateToday = isToday(date);
  const isDateTomorrow = isTomorrow(date);
  const isDateOverdue = date < new Date() && dateItems.some(item =>
    item?.payment_status === 'unpaid' || item?.payment_status === 'partially_paid'
  );

  // Helper function to format date headers
  const formatDateHeader = (dateStr: string) => {
    const parsedDate = safeParseDate(dateStr);
    if (!parsedDate) return 'Unknown Date';

    if (isToday(parsedDate)) {
      return 'Today';
    } else if (isTomorrow(parsedDate)) {
      return 'Tomorrow';
    } else if (isYesterday(parsedDate)) {
      return 'Yesterday';
    } else {
      return format(parsedDate, 'EEEE, MMMM d, yyyy');
    }
  };

  // Get date header color
  const getDateHeaderColor = () => {
    if (isDateToday) return "text-blue-500";
    if (isDateTomorrow) return "text-purple-500";
    if (isDateOverdue) return "text-red-500";
    return isDarkMode ? "text-foreground" : "text-foreground";
  };

  // Get date badge color
  const getDateBadgeColor = () => {
    if (isDateToday) return "bg-blue-500/10 text-blue-500 border-blue-500/30";
    if (isDateTomorrow) return "bg-purple-500/10 text-purple-500 border-purple-500/30";
    if (isDateOverdue) return "bg-red-500/10 text-red-500 border-red-500/30";
    return isDarkMode
      ? "bg-muted text-muted-foreground border-border"
      : "bg-muted text-muted-foreground border-border";
  };

  // Filter out any invalid items
  const validItems = dateItems.filter(item => !!item && !!item.id);

  return (
    <div key={dateKey} className="space-y-3">
      <div className="flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-2">
          <h3 className={cn(
            "text-sm font-semibold flex items-center",
            getDateHeaderColor()
          )}>
            {formatDateHeader(dateKey)}
          </h3>
          <Badge
            className={cn(
              "px-1.5 py-0.5 text-xs font-medium",
              getDateBadgeColor()
            )}
          >
            {validItems.length} {validItems.length === 1 ? 'payment' : 'payments'}
          </Badge>
        </div>

        {isDateToday && (
          <div className="text-xs text-muted-foreground">
            Today's Payments
          </div>
        )}
      </div>

      <div className="space-y-3">
        {validItems.map(purchase => (
          <MaterialPurchaseTaskCard
            key={purchase.id || Math.random().toString()}
            purchase={purchase}
            isDarkMode={isDarkMode}
            onViewPurchase={onViewPurchase}
          />
        ))}
      </div>
    </div>
  );
}
