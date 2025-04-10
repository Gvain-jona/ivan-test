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
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
  align = "start"
}: DateRangePickerProps) {
  const today = new Date();
  const [month, setMonth] = useState(today);
  const [isOpen, setIsOpen] = useState(false);

  // Preset date ranges
  const presets = {
    today: {
      label: "Today",
      range: {
        from: today,
        to: today,
      },
    },
    yesterday: {
      label: "Yesterday",
      range: {
        from: subDays(today, 1),
        to: subDays(today, 1),
      },
    },
    last7Days: {
      label: "Last 7 days",
      range: {
        from: subDays(today, 6),
        to: today,
      },
    },
    last30Days: {
      label: "Last 30 days",
      range: {
        from: subDays(today, 29),
        to: today,
      },
    },
    thisMonth: {
      label: "This month",
      range: {
        from: startOfMonth(today),
        to: today,
      },
    },
    lastMonth: {
      label: "Last month",
      range: {
        from: startOfMonth(subMonths(today, 1)),
        to: endOfMonth(subMonths(today, 1)),
      },
    },
    thisYear: {
      label: "This year",
      range: {
        from: startOfYear(today),
        to: today,
      },
    },
    lastYear: {
      label: "Last year",
      range: {
        from: startOfYear(subYears(today, 1)),
        to: endOfYear(subYears(today, 1)),
      },
    },
  };

  const selectPreset = (preset: keyof typeof presets) => {
    onDateRangeChange(presets[preset].range);
    setMonth(presets[preset].range.to || today);
    setIsOpen(false);
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
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRange?.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "LLL dd, y")} -{" "}
                {format(dateRange.to, "LLL dd, y")}
              </>
            ) : (
              format(dateRange.from, "LLL dd, y")
            )
          ) : (
            <span>Select date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <div className="flex max-h-[500px] flex-col sm:flex-row">
          <div className="border-r border-border p-2 sm:w-40">
            <div className="flex flex-col space-y-1">
              {Object.entries(presets).map(([key, { label }]) => (
                <Button
                  key={key}
                  variant="ghost"
                  size="sm"
                  className="justify-start font-normal"
                  onClick={() => selectPreset(key as keyof typeof presets)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={onDateRangeChange}
            month={month}
            onMonthChange={setMonth}
            className="p-2 bg-background"
            disabled={[{ after: today }]}
            numberOfMonths={1}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
