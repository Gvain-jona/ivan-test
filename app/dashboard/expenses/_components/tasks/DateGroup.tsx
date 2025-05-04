'use client';

import React from 'react';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { OccurrenceItem } from './OccurrenceItem';
import { RecurringExpenseOccurrence } from './types';

interface DateGroupProps {
  dateKey: string;
  dateItems: RecurringExpenseOccurrence[];
  isDarkMode: boolean;
  editingExpenseId: string | null;
  onStatusUpdate: (occurrenceId: string, status: 'pending' | 'completed' | 'skipped') => Promise<void>;
  onEdit: (occurrence: RecurringExpenseOccurrence) => Promise<void>;
}

export function DateGroup({
  dateKey,
  dateItems,
  isDarkMode,
  editingExpenseId,
  onStatusUpdate,
  onEdit
}: DateGroupProps) {
  const date = new Date(dateKey);
  const isDateToday = isToday(date);
  const isDateTomorrow = isTomorrow(date);
  const isDateOverdue = date < new Date() && dateItems.some(item => item.status === 'pending');

  // Helper function to format date headers
  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return 'Today';
    } else if (isTomorrow(date)) {
      return 'Tomorrow';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'EEEE, MMMM d, yyyy');
    }
  };

  // Get date header color
  const getDateHeaderColor = () => {
    if (isDateToday) return "text-blue-400";
    if (isDateTomorrow) return "text-purple-400";
    if (isDateOverdue) return "text-red-400";
    return isDarkMode ? "text-gray-300" : "text-gray-700";
  };

  // Get date badge color
  const getDateBadgeColor = () => {
    if (isDateToday) return "bg-blue-900/20 text-blue-400 border-blue-800/30";
    if (isDateTomorrow) return "bg-purple-900/20 text-purple-400 border-purple-800/30";
    if (isDateOverdue) return "bg-red-900/20 text-red-400 border-red-800/30";
    return isDarkMode
      ? "bg-gray-800 text-gray-300 border-gray-700"
      : "bg-gray-100 text-gray-700 border-gray-200";
  };

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
            {dateItems.length} {dateItems.length === 1 ? 'task' : 'tasks'}
          </Badge>
        </div>

        {isDateToday && (
          <div className="text-xs text-muted-foreground">
            Today's Tasks
          </div>
        )}
      </div>

      <div className="space-y-3">
        {dateItems.map(occurrence => (
          <OccurrenceItem
            key={occurrence.id}
            occurrence={occurrence}
            isDarkMode={isDarkMode}
            editingExpenseId={editingExpenseId}
            onStatusUpdate={onStatusUpdate}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}
