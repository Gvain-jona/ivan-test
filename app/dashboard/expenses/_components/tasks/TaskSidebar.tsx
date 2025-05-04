'use client';

import { format } from 'date-fns';
import { Calendar, Check, X, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, cn } from '@/lib/utils';
import { useRecurringExpenses } from '../../_context/RecurringExpensesContext';
import { useMediaQuery } from '@/hooks/use-media-query';

export function TaskSidebar() {
  // Use the recurring expenses context
  const {
    selectedDate,
    occurrencesByDate,
    isLoading,
    updateOccurrenceStatus
  } = useRecurringExpenses();

  // Check if we're in dark mode - we'll use this for theming
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const isDarkMode = typeof document !== 'undefined'
    ? document.documentElement.classList.contains('dark')
    : prefersDarkMode;

  // Get occurrences for the selected date
  const occurrences = selectedDate
    ? occurrencesByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];
  return (
    <div className="lg:w-1/4 border rounded-lg overflow-hidden h-full flex flex-col">
      <div className={cn(
        "flex items-center justify-between p-4 border-b",
        isDarkMode ? "bg-white/5" : "bg-background/5"
      )}>
        <h3 className="text-lg font-medium flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
          {selectedDate
            ? format(selectedDate, 'MMMM d, yyyy')
            : 'Select a date'
          }
        </h3>
        {selectedDate && (
          <Button
            size="sm"
            className={cn(
              "h-8 gap-1",
              isDarkMode
                ? "bg-white text-background hover:bg-white/90"
                : "bg-background text-white hover:bg-background/90"
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Task</span>
          </Button>
        )}
      </div>
      <div className="p-4 overflow-y-auto flex-1">
      {!selectedDate ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Select a date to view tasks</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : occurrences.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No tasks for this date</p>
        </div>
      ) : (
        <div className="space-y-4">
          {occurrences.map((occurrence) => {
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
                          : isDarkMode
                            ? "bg-white/10 text-white border-white/20"
                            : "bg-background/10 text-background border-background/20"
                      )}
                    >
                      {expense.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Amount: </span>
                    <span className="font-medium">{formatCurrency(expense.amount || 0)}</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="flex justify-between w-full">
                    <Badge variant="outline" className={cn(
                      occurrence.status === 'completed'
                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : occurrence.status === 'skipped'
                        ? 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                        : isDarkMode
                          ? 'bg-white/10 text-white border-white/20'
                          : 'bg-background/10 text-background border-background/20'
                    )}>
                      {occurrence.status.charAt(0).toUpperCase() + occurrence.status.slice(1)}
                    </Badge>
                    <div className="flex gap-2">
                      {occurrence.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateOccurrenceStatus(occurrence.id, 'completed')}
                          >
                            Complete
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateOccurrenceStatus(occurrence.id, 'skipped')}
                          >
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
    </div>
  );
}
