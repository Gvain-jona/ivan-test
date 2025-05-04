'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, DayClickEventHandler } from 'react-day-picker';
import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface RecurringExpenseCalendarViewProps {
  month: Date;
  onMonthChange: (month: Date) => void;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  occurrencesByDate: Record<string, any[]>;
}

export function RecurringExpenseCalendarView({
  month,
  onMonthChange,
  selectedDate,
  onDateSelect,
  occurrencesByDate,
}: RecurringExpenseCalendarViewProps) {
  // Custom day renderer to show occurrence badges
  const renderDay = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const hasOccurrences = occurrencesByDate[dateKey] && occurrencesByDate[dateKey].length > 0;
    
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <span>{format(day, 'd')}</span>
        {hasOccurrences && (
          <Badge className="mt-1 text-xs px-1.5 py-0 bg-orange-500 text-white">
            {occurrencesByDate[dateKey].length}
          </Badge>
        )}
      </div>
    );
  };

  // Handle day click
  const handleDayClick: DayClickEventHandler = (day) => {
    onDateSelect(day);
  };

  // Custom styles for the calendar
  const calendarClassNames = {
    months: "relative flex flex-col sm:flex-row gap-4",
    month: "w-full",
    month_caption: "relative mx-10 mb-1 flex h-9 items-center justify-center z-20",
    caption_label: "text-sm font-medium",
    nav: "absolute top-0 flex w-full justify-between z-10",
    button_previous: cn(
      buttonVariants({ variant: "ghost" }),
      "size-9 text-muted-foreground/80 hover:text-foreground p-0",
    ),
    button_next: cn(
      buttonVariants({ variant: "ghost" }),
      "size-9 text-muted-foreground/80 hover:text-foreground p-0",
    ),
    weekday: "size-9 p-0 text-xs font-medium text-muted-foreground/80",
    day_button: cn(
      "relative flex size-9 items-center justify-center whitespace-nowrap rounded-lg p-0 text-foreground",
      "hover:bg-muted focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70",
      "h-14" // Make day cells taller to accommodate badges
    ),
    day: "group size-9 px-0 text-sm h-full w-full",
    today: "border border-orange-500",
    selected: "bg-orange-500 text-white rounded-lg",
    head_row: "flex w-full justify-between",
    row: "flex w-full justify-between mt-2",
    table: "border-collapse border-spacing-0 w-full table-fixed",
  };

  // Custom components
  const components = {
    Chevron: (props: any) => {
      if (props.orientation === "left") {
        return <ChevronLeft size={16} strokeWidth={2} {...props} aria-hidden="true" />;
      }
      return <ChevronRight size={16} strokeWidth={2} {...props} aria-hidden="true" />;
    },
  };

  // Selected day modifier
  const modifiers = {
    selected: (day: Date) => selectedDate !== null && isSameDay(day, selectedDate),
  };

  // Selected day styles
  const modifiersStyles = {
    selected: {
      backgroundColor: 'var(--orange-500)',
      color: 'white',
      borderRadius: '0.5rem',
    },
  };

  return (
    <div className="recurring-expense-calendar">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Recurring Expenses Calendar</h2>
      </div>
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={(day) => day && onDateSelect(day)}
        month={month}
        onMonthChange={onMonthChange}
        showOutsideDays
        classNames={calendarClassNames}
        components={components}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        captionLayout="dropdown-buttons"
        fixedWeeks
        renderDay={renderDay}
      />
    </div>
  );
}
