'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, ChevronDownIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';

export type DateRangePreset = {
  label: string;
  value: string;
  range: () => DateRange;
};

const DEFAULT_PRESETS: DateRangePreset[] = [
  {
    label: 'Today',
    value: 'today',
    range: () => {
      const today = new Date();
      return { from: today, to: today };
    },
  },
  {
    label: 'Yesterday',
    value: 'yesterday',
    range: () => {
      const yesterday = subDays(new Date(), 1);
      return { from: yesterday, to: yesterday };
    },
  },
  {
    label: 'Last 7 days',
    value: 'last7days',
    range: () => ({
      from: subDays(new Date(), 6),
      to: new Date(),
    }),
  },
  {
    label: 'Last 30 days',
    value: 'last30days',
    range: () => ({
      from: subDays(new Date(), 29),
      to: new Date(),
    }),
  },
  {
    label: 'This week',
    value: 'thisWeek',
    range: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: endOfWeek(new Date(), { weekStartsOn: 1 }),
    }),
  },
  {
    label: 'Last week',
    value: 'lastWeek',
    range: () => {
      const lastWeek = subWeeks(new Date(), 1);
      return {
        from: startOfWeek(lastWeek, { weekStartsOn: 1 }),
        to: endOfWeek(lastWeek, { weekStartsOn: 1 }),
      };
    },
  },
  {
    label: 'This month',
    value: 'thisMonth',
    range: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: 'Last month',
    value: 'lastMonth',
    range: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      };
    },
  },
  {
    label: 'This year',
    value: 'thisYear',
    range: () => ({
      from: startOfYear(new Date()),
      to: endOfYear(new Date()),
    }),
  },
  {
    label: 'Last year',
    value: 'lastYear',
    range: () => {
      const lastYear = subYears(new Date(), 1);
      return {
        from: startOfYear(lastYear),
        to: endOfYear(lastYear),
      };
    },
  },
];

interface AnalyticsDateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  presets?: DateRangePreset[];
  align?: 'start' | 'center' | 'end';
  className?: string;
  showCompare?: boolean;
  onCompareRangeChange?: (range: DateRange | undefined) => void;
  compareRange?: DateRange | undefined;
}

export function AnalyticsDateRangePicker({
  dateRange,
  onDateRangeChange,
  presets = DEFAULT_PRESETS,
  align = 'center',
  className,
  showCompare = false,
  onCompareRangeChange,
  compareRange,
}: AnalyticsDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handlePresetClick = (preset: DateRangePreset) => {
    const range = preset.range();
    onDateRangeChange(range);
    setSelectedPreset(preset.value);
    
    // If compare is enabled, automatically set compare range to previous period
    if (showCompare && onCompareRangeChange && range.from && range.to) {
      const daysDiff = Math.round(
        (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)
      );
      const compareFrom = subDays(range.from, daysDiff + 1);
      const compareTo = subDays(range.from, 1);
      onCompareRangeChange({ from: compareFrom, to: compareTo });
    }
  };

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) return 'Select date range';
    if (!range.to) return format(range.from, 'LLL dd, yyyy');
    return `${format(range.from, 'LLL dd, yyyy')} - ${format(range.to, 'LLL dd, yyyy')}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-between w-auto min-w-[240px] px-3 py-2 h-9 text-sm",
            className
          )}
        >
          <div className="flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>{formatDateRange(dateRange)}</span>
          </div>
          <ChevronDownIcon className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align={align}
        side="bottom"
        sideOffset={8}
      >
        <div className="flex flex-col sm:flex-row border-b">
          <div className="sm:border-r p-3 space-y-1 sm:w-48">
            {presets.map((preset) => (
              <Button
                key={preset.value}
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-start text-sm w-full font-normal",
                  selectedPreset === preset.value && "bg-muted"
                )}
                onClick={() => handlePresetClick(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="p-3">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
              disabled={{ after: new Date() }}
            />
          </div>
        </div>
        
        {showCompare && (
          <div className="border-t p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Compare with</span>
              {compareRange && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onCompareRangeChange?.(undefined)}
                >
                  Clear
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {compareRange ? (
                formatDateRange(compareRange)
              ) : (
                "No comparison selected"
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  if (dateRange?.from && dateRange.to) {
                    const daysDiff = Math.round(
                      (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const compareFrom = subDays(dateRange.from, daysDiff + 1);
                    const compareTo = subDays(dateRange.from, 1);
                    onCompareRangeChange?.({ from: compareFrom, to: compareTo });
                  }
                }}
                disabled={!dateRange?.from || !dateRange.to}
              >
                Previous period
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  if (dateRange?.from && dateRange.to) {
                    const prevYearFrom = new Date(dateRange.from);
                    const prevYearTo = new Date(dateRange.to);
                    prevYearFrom.setFullYear(prevYearFrom.getFullYear() - 1);
                    prevYearTo.setFullYear(prevYearTo.getFullYear() - 1);
                    onCompareRangeChange?.({ from: prevYearFrom, to: prevYearTo });
                  }
                }}
                disabled={!dateRange?.from || !dateRange.to}
              >
                Previous year
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-end gap-2 p-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onDateRangeChange(undefined);
              if (showCompare) onCompareRangeChange?.(undefined);
              setSelectedPreset(null);
              setIsOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setIsOpen(false);
            }}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
