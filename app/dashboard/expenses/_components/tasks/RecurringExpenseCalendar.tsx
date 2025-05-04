'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { Calendar, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecurringExpenses } from '@/hooks/useExpenses';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { FullScreenCalendar } from '@/components/ui/fullscreen-calendar';
import { useMediaQuery } from '@/hooks/use-media-query';

export function RecurringExpenseCalendar({ isActive = false }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Check if we're in dark mode - we'll use this for theming
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const isDarkMode = typeof document !== 'undefined'
    ? document.documentElement.classList.contains('dark')
    : prefersDarkMode;

  // Get start and end of current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Fetch recurring expenses for the current month only when this component is active
  const { occurrences, isLoading, updateOccurrenceStatus, mutate } = useRecurringExpenses(
    // Pass null when not active to prevent fetching
    isActive ? format(monthStart, 'yyyy-MM-dd') : null,
    isActive ? format(monthEnd, 'yyyy-MM-dd') : null
  );

  // Force a refresh when the component becomes active or month changes
  useEffect(() => {
    if (isActive) {
      console.log('RecurringExpenseCalendar is now active or month changed, refreshing data...');
      mutate();
    }
  }, [isActive, monthStart, monthEnd, mutate]);

  // Handle status update
  const handleStatusUpdate = async (occurrenceId: string, status: 'completed' | 'skipped') => {
    try {
      await updateOccurrenceStatus(occurrenceId, status);
      toast.success(`Expense ${status === 'completed' ? 'completed' : 'skipped'} successfully`);
    } catch (error) {
      console.error('Error updating occurrence status:', error);
      toast.error('Failed to update expense status');
    }
  };

  // Convert occurrences to the format expected by FullScreenCalendar
  const calendarData = occurrences.reduce((acc, occurrence) => {
    const date = new Date(occurrence.occurrence_date);
    const dateKey = format(date, 'yyyy-MM-dd');

    // Find if we already have an entry for this date
    const existingEntry = acc.find(entry => isSameDay(entry.day, date));

    if (existingEntry) {
      // Add to existing entry
      existingEntry.events.push({
        id: parseInt(occurrence.id.replace(/-/g, '')),
        name: occurrence.expense?.item_name || 'Unnamed Expense',
        time: occurrence.expense?.category || 'Unknown Category',
        datetime: occurrence.occurrence_date
      });
    } else {
      // Create new entry
      acc.push({
        day: date,
        events: [{
          id: parseInt(occurrence.id.replace(/-/g, '')),
          name: occurrence.expense?.item_name || 'Unnamed Expense',
          time: occurrence.expense?.category || 'Unknown Category',
          datetime: occurrence.occurrence_date
        }]
      });
    }

    return acc;
  }, [] as Array<{day: Date, events: Array<{id: number, name: string, time: string, datetime: string}>}>);

  // This function is no longer used - we use handleCalendarDaySelect instead

  // Group occurrences by date for the detail view
  const occurrencesByDate = occurrences.reduce((acc, occurrence) => {
    const date = new Date(occurrence.occurrence_date);
    const dateKey = format(date, 'yyyy-MM-dd');

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }

    acc[dateKey].push(occurrence);
    return acc;
  }, {} as Record<string, any[]>);

  // Get occurrences for selected date
  const selectedDateOccurrences = selectedDate
    ? occurrencesByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  // Create a custom handler for the FullScreenCalendar
  const handleCalendarDaySelect = (day: Date) => {
    // Find if there are any occurrences for this day
    const dateKey = format(day, 'yyyy-MM-dd');
    const hasOccurrences = occurrencesByDate[dateKey] && occurrencesByDate[dateKey].length > 0;

    // Only set selected date if there are occurrences
    if (hasOccurrences) {
      setSelectedDate(day);
      // Scroll to the expenses section
      setTimeout(() => {
        document.getElementById('selected-date-expenses')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      // If no occurrences, clear the selected date
      setSelectedDate(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Use the FullScreenCalendar component */}
      <div className="border rounded-lg overflow-hidden">
        <FullScreenCalendar
          data={calendarData}
          onDaySelect={handleCalendarDaySelect}
        />
      </div>

      {/* Selected date expenses */}
      {selectedDate && (
        <div id="selected-date-expenses" className="mt-6 pt-4 border-t border-border/40">
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
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
                  <Card
                    key={occurrence.id}
                    className={cn(
                      "overflow-hidden transition-all duration-200 hover:shadow-md",
                      expense.category === 'fixed'
                        ? isDarkMode
                          ? "border-white/10"
                          : "border-background/10"
                        : "border-border/60"
                    )}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base flex items-center">
                            {expense.item_name}
                            {occurrence.status === 'completed' && (
                              <Check className="h-4 w-4 ml-2 text-green-500" />
                            )}
                            {occurrence.status === 'skipped' && (
                              <X className="h-4 w-4 ml-2 text-gray-500" />
                            )}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(occurrence.occurrence_date), 'MMM d, yyyy')}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={expense.category === 'fixed' ? 'secondary' : 'outline'}
                          className={cn(
                            "capitalize",
                            expense.category === 'fixed'
                              ? isDarkMode
                                ? "bg-white text-background"
                                : "bg-background text-white"
                              : "bg-background text-foreground"
                          )}
                        >
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
                            : isDarkMode
                              ? 'bg-white/10 text-white border-white/20'
                              : 'bg-background/10 text-background border-background/20'
                        }>
                          {occurrence.status.charAt(0).toUpperCase() + occurrence.status.slice(1)}
                        </Badge>
                        <div className="flex gap-2">
                          {occurrence.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "border-white/20",
                                  isDarkMode
                                    ? "hover:bg-white hover:text-background"
                                    : "hover:bg-background hover:text-white"
                                )}
                                onClick={() => handleStatusUpdate(occurrence.id, 'completed')}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-muted/30"
                                onClick={() => handleStatusUpdate(occurrence.id, 'skipped')}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Skip
                              </Button>
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
