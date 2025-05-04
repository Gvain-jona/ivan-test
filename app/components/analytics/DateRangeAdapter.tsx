'use client';

import React, { useEffect, useState } from 'react';
import { DateRange as ReactDayPickerDateRange } from 'react-day-picker';
import { DateRange as ApiDateRange } from '@/types/date-range';
import { AnalyticsDateRangePicker } from './AnalyticsDateRangePicker';
import { format } from 'date-fns';

interface DateRangeAdapterProps {
  dateRange: ApiDateRange;
  onDateRangeChange: (range: ApiDateRange) => void;
  compareRange?: ApiDateRange;
  onCompareRangeChange?: (range: ApiDateRange | undefined) => void;
  showCompare?: boolean;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export function DateRangeAdapter({
  dateRange,
  onDateRangeChange,
  compareRange,
  onCompareRangeChange,
  showCompare = false,
  align = 'center',
  className,
}: DateRangeAdapterProps) {
  // Convert API DateRange to react-day-picker DateRange
  const [pickerDateRange, setPickerDateRange] = useState<ReactDayPickerDateRange | undefined>(() => {
    if (!dateRange.startDate || !dateRange.endDate) return undefined;
    
    return {
      from: new Date(dateRange.startDate),
      to: new Date(dateRange.endDate),
    };
  });
  
  // Convert API compareRange to react-day-picker DateRange
  const [pickerCompareRange, setPickerCompareRange] = useState<ReactDayPickerDateRange | undefined>(() => {
    if (!compareRange?.startDate || !compareRange?.endDate) return undefined;
    
    return {
      from: new Date(compareRange.startDate),
      to: new Date(compareRange.endDate),
    };
  });
  
  // Update pickerDateRange when dateRange changes
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      setPickerDateRange({
        from: new Date(dateRange.startDate),
        to: new Date(dateRange.endDate),
      });
    }
  }, [dateRange]);
  
  // Update pickerCompareRange when compareRange changes
  useEffect(() => {
    if (compareRange?.startDate && compareRange?.endDate) {
      setPickerCompareRange({
        from: new Date(compareRange.startDate),
        to: new Date(compareRange.endDate),
      });
    } else {
      setPickerCompareRange(undefined);
    }
  }, [compareRange]);
  
  // Handle date range change from picker
  const handleDateRangeChange = (range: ReactDayPickerDateRange | undefined) => {
    setPickerDateRange(range);
    
    if (range?.from && range?.to) {
      onDateRangeChange({
        startDate: format(range.from, 'yyyy-MM-dd'),
        endDate: format(range.to, 'yyyy-MM-dd'),
      });
    }
  };
  
  // Handle compare range change from picker
  const handleCompareRangeChange = (range: ReactDayPickerDateRange | undefined) => {
    setPickerCompareRange(range);
    
    if (range?.from && range?.to) {
      onCompareRangeChange?.({
        startDate: format(range.from, 'yyyy-MM-dd'),
        endDate: format(range.to, 'yyyy-MM-dd'),
      });
    } else {
      onCompareRangeChange?.(undefined);
    }
  };
  
  return (
    <AnalyticsDateRangePicker
      dateRange={pickerDateRange}
      onDateRangeChange={handleDateRangeChange}
      compareRange={pickerCompareRange}
      onCompareRangeChange={handleCompareRangeChange}
      showCompare={showCompare}
      align={align}
      className={className}
    />
  );
}
