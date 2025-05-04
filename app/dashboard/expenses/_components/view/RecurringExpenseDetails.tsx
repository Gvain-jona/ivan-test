import React from 'react';
import { RefreshCw, Calendar, Clock, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Expense } from '@/hooks/expenses';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RecurringExpenseDetailsProps {
  expense: Expense;
}

// Map frequency values to human-readable labels
const frequencyLabels: Record<string, string> = {
  'daily': 'Daily',
  'weekly': 'Weekly',
  'monthly': 'Monthly',
  'quarterly': 'Quarterly',
  'yearly': 'Yearly'
};

/**
 * Component to display recurring expense details
 */
export function RecurringExpenseDetails({ expense }: RecurringExpenseDetailsProps) {
  if (!expense.is_recurring) return null;

  // Format the recurrence pattern in a human-readable way without repeating the frequency
  const getRecurrencePattern = () => {
    const frequency = expense.recurrence_frequency || 'monthly';

    switch (frequency) {
      case 'daily':
        if (expense.recurrence_time) {
          return `At ${expense.recurrence_time}`;
        }
        return 'Every day';

      case 'weekly':
        if (expense.recurrence_day_of_week !== undefined) {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          return `Every ${days[expense.recurrence_day_of_week]}`;
        }
        return 'Every week';

      case 'monthly':
        if (expense.monthly_recurrence_type === 'day_of_month' && expense.recurrence_day_of_month) {
          return `On day ${expense.recurrence_day_of_month} of each month`;
        } else if (expense.monthly_recurrence_type === 'day_of_week' &&
                  expense.recurrence_day_of_week !== undefined &&
                  expense.recurrence_week_of_month) {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const weeks = ['first', 'second', 'third', 'fourth', 'last'];
          return `On the ${weeks[expense.recurrence_week_of_month - 1]} ${days[expense.recurrence_day_of_week]} of each month`;
        }
        return 'Every month';

      case 'yearly':
        if (expense.recurrence_month_of_year && expense.recurrence_day_of_month) {
          const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          return `On ${months[expense.recurrence_month_of_year - 1]} ${expense.recurrence_day_of_month} each year`;
        }
        return 'Every year';

      default:
        return 'Regularly';
    }
  };

  return (
    <div className="border border-border/40 rounded-lg p-4 bg-muted/5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-2">
          <RefreshCw className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Frequency</p>
            <p className="text-sm font-medium">{frequencyLabels[expense.recurrence_frequency || 'monthly']}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Repeats</p>
            <p className="text-sm font-medium">{getRecurrencePattern()}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Start Date</p>
            <p className="text-sm font-medium">
              {expense.recurrence_start_date ? formatDate(expense.recurrence_start_date) : 'Not set'}
            </p>
          </div>
        </div>

        {expense.recurrence_end_date && (
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">End Date</p>
              <p className="text-sm font-medium">{formatDate(expense.recurrence_end_date)}</p>
            </div>
          </div>
        )}

        {expense.next_occurrence_date && (
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Next Occurrence</p>
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium">{formatDate(expense.next_occurrence_date)}</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">The next date this expense will occur</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
