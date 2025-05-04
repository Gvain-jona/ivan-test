'use client';

import { format, isSameDay } from 'date-fns';
import { Calendar, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRecurringExpenses } from '../../_context/RecurringExpensesContext';
import { cn } from '@/lib/utils';
import { ImprovedCalendar } from '@/components/ui/improved-calendar';
import { useMediaQuery } from '@/hooks/use-media-query';
import { TaskSidebar } from './TaskSidebar';

export function CalendarWithSidebar() {
  // Check if we're in dark mode - we'll use this for theming
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const isDarkMode = typeof document !== 'undefined'
    ? document.documentElement.classList.contains('dark')
    : prefersDarkMode;

  // Use the recurring expenses context
  const {
    occurrences,
    isLoading,
    updateOccurrenceStatus,
    currentMonth,
    setCurrentMonth,
    selectedDate,
    setSelectedDate
  } = useRecurringExpenses();

  // Handle status update
  const handleStatusUpdate = async (occurrenceId: string, status: 'completed' | 'skipped') => {
    await updateOccurrenceStatus(occurrenceId, status);
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

  // Create a custom handler for the ImprovedCalendar
  const handleCalendarDaySelect = (day: Date) => {
    setSelectedDate(day);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-220px)]">
      {/* Calendar Section */}
      <div className="border rounded-lg overflow-hidden lg:w-3/4 h-full">
        <ImprovedCalendar
          data={calendarData}
          onDaySelect={handleCalendarDaySelect}
          className="h-full"
        />
      </div>

      {/* Sidebar Section */}
      <TaskSidebar
        selectedDate={selectedDate}
        occurrences={selectedDateOccurrences}
        isLoading={isLoading}
        onStatusUpdate={handleStatusUpdate}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
