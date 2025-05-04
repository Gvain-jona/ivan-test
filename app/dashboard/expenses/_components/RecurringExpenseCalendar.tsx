'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecurringExpenses } from '@/hooks/useExpenses';
import { formatCurrency } from '@/lib/utils';
import { RecurringExpenseCalendarView } from './RecurringExpenseCalendarView';

export function RecurringExpenseCalendar({ isActive = false }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get start and end of current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Get all days in the month
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Fetch recurring expenses for the current month only when this component is active
  const { occurrences, isLoading } = useRecurringExpenses(
    // Pass null when not active to prevent fetching
    isActive ? format(monthStart, 'yyyy-MM-dd') : null,
    isActive ? format(monthEnd, 'yyyy-MM-dd') : null
  );

  // Group occurrences by date
  const occurrencesByDate = occurrences.reduce((acc, occurrence) => {
    const date = new Date(occurrence.occurrence_date);
    const dateKey = format(date, 'yyyy-MM-dd');

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }

    acc[dateKey].push(occurrence);
    return acc;
  }, {} as Record<string, any[]>);

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  // Get occurrences for selected date
  const selectedDateOccurrences = selectedDate
    ? occurrencesByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  return (
    <div className="space-y-4">
      {/* Use the new RecurringExpenseCalendarView component */}
      <RecurringExpenseCalendarView
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        occurrencesByDate={occurrencesByDate}
      />

      {/* Selected date expenses */}
      {selectedDate && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">
            Expenses for {format(selectedDate, 'MMMM d, yyyy')}
          </h3>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : selectedDateOccurrences.length === 0 ? (
            <p className="text-muted-foreground">No recurring expenses for this date.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedDateOccurrences.map((occurrence) => {
                const expense = occurrence.expense || {};
                return (
                  <Card key={occurrence.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{expense.item_name}</CardTitle>
                          <CardDescription>{expense.category}</CardDescription>
                        </div>
                        <Badge variant={expense.category === 'fixed' ? 'secondary' : 'outline'} className="capitalize">
                          {expense.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-medium">{formatCurrency(expense.total_amount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Frequency:</span>
                          <span className="capitalize">{expense.recurrence_frequency}</span>
                        </div>
                        {expense.description && (
                          <div className="text-sm mt-2">
                            <span className="text-muted-foreground">Note:</span>
                            <p className="text-sm mt-1">{expense.description}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="flex justify-between w-full">
                        <Badge variant="outline" className={
                          occurrence.status === 'completed'
                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                            : occurrence.status === 'skipped'
                            ? 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                            : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }>
                          {occurrence.status.charAt(0).toUpperCase() + occurrence.status.slice(1)}
                        </Badge>
                        <div className="flex gap-2">
                          {occurrence.status === 'pending' && (
                            <>
                              <Button variant="outline" size="sm">Complete</Button>
                              <Button variant="ghost" size="sm">Skip</Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
