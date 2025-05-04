'use client';

import React from 'react';
import { format } from 'date-fns';
import { CircleCheck, Circle, X, Pencil, Loader2, Calendar, Check, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { OccurrenceStatus, RecurringExpense, RecurringExpenseOccurrence } from './types';

interface OccurrenceItemProps {
  occurrence: RecurringExpenseOccurrence;
  isDarkMode: boolean;
  editingExpenseId: string | null;
  onStatusUpdate: (occurrenceId: string, status: OccurrenceStatus) => Promise<void>;
  onEdit: (occurrence: RecurringExpenseOccurrence) => Promise<void>;
}

export function OccurrenceItem({
  occurrence,
  isDarkMode,
  editingExpenseId,
  onStatusUpdate,
  onEdit
}: OccurrenceItemProps) {
  const expense = occurrence.expense || {} as RecurringExpense;
  const occurrenceDate = new Date(occurrence.occurrence_date);
  const isOverdue = occurrenceDate < new Date() && occurrence.status === 'pending';
  const isCompleted = occurrence.status === 'completed';
  const isSkipped = occurrence.status === 'skipped';

  return (
    <div
      key={occurrence.id}
      className={cn(
        "flex items-start p-4 rounded-lg border shadow-sm transition-all duration-200 group",
        "hover:shadow-md hover:translate-y-[-1px]",
        isDarkMode
          ? "bg-card backdrop-blur-sm border-border/40"
          : "bg-card backdrop-blur-sm border-border/40",
        isCompleted && "opacity-80"
      )}
    >
      {/* Status indicator */}
      <div className="mr-3 mt-0.5">
        <button
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center focus:outline-none transition-colors",
            isCompleted
              ? "text-green-500 hover:text-green-600"
              : isSkipped
                ? "text-gray-400 hover:text-gray-500"
                : isOverdue
                  ? "text-red-500 hover:text-red-600"
                  : isDarkMode
                    ? "text-blue-400 hover:text-blue-300"
                    : "text-blue-500 hover:text-blue-600"
          )}
          onClick={() => onStatusUpdate(
            occurrence.id,
            isCompleted ? 'pending' : isSkipped ? 'pending' : 'completed'
          )}
        >
          {isCompleted ? (
            <CircleCheck className="h-5 w-5" />
          ) : isSkipped ? (
            <X className="h-5 w-5" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Task content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <h4 className={cn(
            "text-base font-medium truncate",
            isCompleted && "line-through opacity-70"
          )}>
            {expense?.item_name || 'Unnamed Expense'}
          </h4>

          <Badge
            className={cn(
              "px-1.5 py-0.5 text-xs font-medium",
              expense?.category === 'fixed'
                ? isDarkMode
                  ? "bg-blue-900/10 text-blue-400 border-blue-800/20"
                  : "bg-blue-100/80 text-blue-700 border-blue-200"
                : isDarkMode
                  ? "bg-purple-900/10 text-purple-400 border-purple-800/20"
                  : "bg-purple-100/80 text-purple-700 border-purple-200"
            )}
          >
            {expense?.category === 'fixed' ? 'Fixed' : 'Variable'}
          </Badge>

          {isOverdue && !isCompleted && !isSkipped && (
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

        <div className="flex flex-col gap-0.5 w-full">
          <div className="flex items-center justify-between">
            <span className={cn(
              "text-lg font-semibold",
              isDarkMode
                ? "text-orange-400"
                : "text-orange-600"
            )}>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'UGX',
                minimumFractionDigits: 0,
              }).format(expense?.total_amount || 0)}
            </span>

            {/* Action buttons - moved to the right side */}
            <div className="flex gap-2">
              {/* Edit button */}
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 rounded-full",
                  isDarkMode
                    ? "text-gray-300 hover:text-white hover:bg-gray-800"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                )}
                onClick={() => onEdit(occurrence)}
              >
                {editingExpenseId === occurrence.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Pencil className="h-4 w-4" />
                )}
              </Button>
              {occurrence.status === 'pending' ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 px-3 rounded-md border",
                      isDarkMode
                        ? "bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                        : "bg-transparent border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                    )}
                    onClick={() => onStatusUpdate(occurrence.id, 'skipped')}
                  >
                    <X className="h-4 w-4 mr-1.5" />
                    Skip
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 px-3 rounded-md border",
                      isDarkMode
                        ? "bg-transparent border-gray-700 text-green-400 hover:bg-green-900/20 hover:border-green-800/30"
                        : "bg-transparent border-gray-200 text-green-600 hover:bg-green-50 hover:border-green-200"
                    )}
                    onClick={() => onStatusUpdate(occurrence.id, 'completed')}
                  >
                    <Check className="h-4 w-4 mr-1.5" />
                    Complete
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 px-3 rounded-md border",
                    isDarkMode
                      ? "bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                      : "bg-transparent border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                  )}
                  onClick={() => onStatusUpdate(occurrence.id, 'pending')}
                >
                  <Circle className="h-4 w-4 mr-1.5" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <span className={cn(
              "text-sm flex items-center",
              isDarkMode ? "text-gray-400" : "text-gray-500"
            )}>
              <Calendar className="h-3.5 w-3.5 mr-1" />
              {format(occurrenceDate, 'MMM d, yyyy')}
            </span>

            <span className={cn(
              "text-sm",
              isDarkMode ? "text-gray-400" : "text-gray-500"
            )}>
              Recurs {expense?.recurrence_frequency || 'monthly'}
            </span>

            {/* Show a simple indicator that the expense was completed */}
            {isCompleted && occurrence.linked_expense_id && (
              <span className={cn(
                "text-sm flex items-center ml-auto",
                isDarkMode
                  ? "text-green-400"
                  : "text-green-600"
              )}>
                <Receipt className="h-3.5 w-3.5 mr-1" />
                Payment Recorded
              </span>
            )}

            {/* Show completed date if available */}
            {isCompleted && occurrence.completed_date && (
              <span className={cn(
                "text-xs",
                isDarkMode ? "text-gray-400" : "text-gray-500"
              )}>
                Completed on {format(new Date(occurrence.completed_date), 'MMM d')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
