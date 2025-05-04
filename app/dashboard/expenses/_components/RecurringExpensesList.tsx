'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Check, Clock, X } from 'lucide-react';
import { useRecurringExpenses } from '@/hooks/useExpenses';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function RecurringExpensesList({ isActive = false }) {
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Only fetch data when this component is active to prevent unnecessary API calls
  const { occurrences, isLoading, isError, isEmpty, updateOccurrenceStatus } = useRecurringExpenses(
    // Pass null when not active to prevent fetching
    isActive ? dateRange.startDate : null,
    isActive ? dateRange.endDate : null
  );

  const handleStatusUpdate = async (occurrenceId: string, status: 'completed' | 'skipped') => {
    try {
      await updateOccurrenceStatus(occurrenceId, status);
    } catch (error) {
      console.error('Error updating occurrence status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Upcoming Recurring Expenses</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load recurring expenses. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (isEmpty) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Upcoming Recurring Expenses</h2>
        </div>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No upcoming recurring expenses found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Upcoming Recurring Expenses</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {occurrences.map((occurrence) => {
          const expense = occurrence.expense || {};
          return (
            <Card key={occurrence.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{expense.item_name}</CardTitle>
                  <Badge variant={expense.category === 'fixed' ? 'secondary' : 'outline'}>
                    {expense.category === 'fixed' ? 'Fixed' : 'Variable'}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(occurrence.occurrence_date), 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Category:</span>
                    <span>{expense.category}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'UGX',
                        minimumFractionDigits: 0,
                      }).format(expense.total_amount || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Frequency:</span>
                    <span className="capitalize">{expense.recurrence_frequency}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleStatusUpdate(occurrence.id, 'completed')}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Complete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleStatusUpdate(occurrence.id, 'skipped')}
                >
                  <X className="h-4 w-4 mr-1" />
                  Skip
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
