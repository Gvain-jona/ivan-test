"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
  align?: "center" | "start" | "end";
  disabled?: boolean;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
  align = "start",
  disabled = false
}: DateRangePickerProps) {
  const today = new Date();
  const [month, setMonth] = useState(today);
  const [isOpen, setIsOpen] = useState(false);

  // Preset date ranges
  const yesterday = {
    from: subDays(today, 1),
    to: subDays(today, 1),
  };
  const last7Days = {
    from: subDays(today, 6),
    to: today,
  };
  const last30Days = {
    from: subDays(today, 29),
    to: today,
  };
  const monthToDate = {
    from: startOfMonth(today),
    to: today,
  };
  const lastMonth = {
    from: startOfMonth(subMonths(today, 1)),
    to: endOfMonth(subMonths(today, 1)),
  };
  const yearToDate = {
    from: startOfYear(today),
    to: today,
  };
  const lastYear = {
    from: startOfYear(subYears(today, 1)),
    to: endOfYear(subYears(today, 1)),
  };

  // Format the date range for display
  const formatDateRange = () => {
    if (!dateRange?.from) return "Select date range";

    if (dateRange.to) {
      return `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`;
    }

    return format(dateRange.from, "LLL dd, y");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateRange && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>{formatDateRange()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 date-range-picker-popover bg-background border-border" align="center" side="bottom" sideOffset={8}>
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Left panel with presets and buttons */}
            <div className="border-border md:border-r md:w-48 py-2 bg-background">
              <div className="flex flex-col space-y-1 px-2">
                {/* Quick presets */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm text-foreground hover:bg-foreground hover:text-background"
                  onClick={() => {
                    onDateRangeChange({
                      from: today,
                      to: today,
                    });
                    setMonth(today);
                    // Don't close automatically
                  }}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm text-foreground hover:bg-foreground hover:text-background"
                  onClick={() => {
                    onDateRangeChange(yesterday);
                    setMonth(yesterday.to);
                    // Don't close automatically
                  }}
                >
                  Yesterday
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm text-foreground hover:bg-foreground hover:text-background"
                  onClick={() => {
                    onDateRangeChange(last7Days);
                    setMonth(last7Days.to);
                    // Don't close automatically
                  }}
                >
                  Last 7 days
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm text-foreground hover:bg-foreground hover:text-background"
                  onClick={() => {
                    onDateRangeChange(last30Days);
                    setMonth(last30Days.to);
                    // Don't close automatically
                  }}
                >
                  Last 30 days
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm text-foreground hover:bg-foreground hover:text-background"
                  onClick={() => {
                    onDateRangeChange(monthToDate);
                    setMonth(monthToDate.to);
                    // Don't close automatically
                  }}
                >
                  Month to date
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm text-foreground hover:bg-foreground hover:text-background"
                  onClick={() => {
                    onDateRangeChange(lastMonth);
                    setMonth(lastMonth.to);
                    // Don't close automatically
                  }}
                >
                  Last month
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm text-foreground hover:bg-foreground hover:text-background"
                  onClick={() => {
                    onDateRangeChange(yearToDate);
                    setMonth(yearToDate.to);
                    // Don't close automatically
                  }}
                >
                  Year to date
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm text-foreground hover:bg-foreground hover:text-background"
                  onClick={() => {
                    onDateRangeChange(lastYear);
                    setMonth(lastYear.to);
                    // Don't close automatically
                  }}
                >
                  Last year
                </Button>

                {/* Divider */}
                <div className="border-t border-border my-2"></div>

                {/* Action buttons */}
                <div className="flex flex-col space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-sm text-foreground hover:bg-foreground hover:text-background"
                    onClick={() => {
                      onDateRangeChange(undefined);
                      setIsOpen(false);
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    className="w-full justify-center bg-foreground text-background hover:bg-foreground/90"
                    onClick={() => setIsOpen(false)}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>

            {/* Calendar column */}
            <div className="p-3 bg-background min-w-[280px] md:min-w-[320px] flex-1">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(newDate) => {
                  if (newDate) {
                    onDateRangeChange(newDate);
                  }
                }}
                month={month}
                onMonthChange={setMonth}
                className="w-full calendar-container"
                disabled={[
                  { after: today },
                ]}
                numberOfMonths={1}
                showOutsideDays={true}
                fixedWeeks={true}
                ISOWeek={false}
                captionLayout="buttons"
                styles={{
                  month: { width: '100%' },
                  caption: { display: 'flex', justifyContent: 'space-between', padding: '0 8px', marginBottom: '8px' },
                  caption_label: { fontSize: '1rem', fontWeight: 500 },
                  table: { width: '100%', tableLayout: 'fixed' },
                  head_cell: { textAlign: 'center', padding: '8px 0', fontSize: '0.75rem' },
                  cell: { textAlign: 'center', padding: 0 },
                  day: { margin: '0 auto', width: '36px', height: '36px', fontSize: '0.875rem' }
                }}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
