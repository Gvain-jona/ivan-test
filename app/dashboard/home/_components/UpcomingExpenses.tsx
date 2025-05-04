'use client';

import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { Calendar, Check, Clock, X } from 'lucide-react';
import { useRecurringExpenses } from '@/hooks/useExpenses';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export function UpcomingExpenses() {
  // Get today and 7 days from now
  const today = new Date();
  const nextWeek = addDays(today, 7);

  // Format dates for API
  const startDate = format(today, 'yyyy-MM-dd');
  const endDate = format(nextWeek, 'yyyy-MM-dd');

  // Fetch upcoming recurring expenses
  const { occurrences, isLoading, isEmpty, updateOccurrenceStatus } = useRecurringExpenses(
    startDate,
    endDate
  );

  // Handle status update
  const handleStatusUpdate = async (occurrenceId: string, status: 'completed' | 'skipped') => {
    try {
      await updateOccurrenceStatus(occurrenceId, status);
    } catch (error) {
      console.error('Error updating occurrence status:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Upcoming Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Upcoming Expenses</CardTitle>
          <Link href="/dashboard/expenses?tab=recurring">
            <Button variant="ghost" size="sm" className="h-8">View All</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No upcoming expenses in the next 7 days.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {occurrences.slice(0, 5).map((occurrence) => {
              const expense = occurrence.expense || {};
              return (
                <div key={occurrence.id} className="flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    expense.expense_type === 'fixed'
                      ? 'bg-blue-500/10 text-blue-500'
                      : 'bg-orange-500/10 text-orange-500'
                  }`}>
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{expense.item_name}</h4>
                      <Badge variant="outline" className="capitalize">
                        {expense.expense_type}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{format(new Date(occurrence.occurrence_date), 'MMM d, yyyy')}</span>
                      <span className="mx-2">•</span>
                      <span>{formatCurrency(expense.total_amount)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleStatusUpdate(occurrence.id, 'completed')}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleStatusUpdate(occurrence.id, 'skipped')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {occurrences.length > 5 && (
              <div className="text-center pt-2">
                <Link href="/dashboard/expenses/recurring">
                  <Button variant="link" size="sm">
                    View {occurrences.length - 5} more
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
