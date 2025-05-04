'use client';

import React from 'react';
import { DateRangeAdapter } from './DateRangeAdapter';
import { DateRange } from '@/types/date-range';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DownloadIcon,
  RefreshCwIcon,
  FilterIcon,
  XIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface FilterOption {
  label: string;
  value: string;
}

interface AnalyticsFilterBarProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  compareRange?: DateRange | undefined;
  onCompareRangeChange?: (range: DateRange | undefined) => void;
  showCompare?: boolean;
  categoryOptions?: FilterOption[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  statusOptions?: FilterOption[];
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  onRefresh?: () => void;
  onExport?: (format: 'csv' | 'pdf' | 'excel') => void;
  isLoading?: boolean;
  className?: string;
  showCategoryFilter?: boolean;
  showStatusFilter?: boolean;
  showExport?: boolean;
  showRefresh?: boolean;
  additionalFilters?: React.ReactNode;
}

export function AnalyticsFilterBar({
  dateRange,
  onDateRangeChange,
  compareRange,
  onCompareRangeChange,
  showCompare = false,
  categoryOptions = [],
  selectedCategory,
  onCategoryChange,
  statusOptions = [],
  selectedStatus,
  onStatusChange,
  onRefresh,
  onExport,
  isLoading = false,
  className,
  showCategoryFilter = true,
  showStatusFilter = true,
  showExport = true,
  showRefresh = true,
  additionalFilters,
}: AnalyticsFilterBarProps) {
  const hasActiveFilters = (selectedCategory && selectedCategory !== 'all') ||
                       (selectedStatus && selectedStatus !== 'all');

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <DateRangeAdapter
        dateRange={dateRange}
        onDateRangeChange={onDateRangeChange}
        showCompare={showCompare}
        compareRange={compareRange}
        onCompareRangeChange={onCompareRangeChange}
      />

      {showCategoryFilter && categoryOptions.length > 0 && (
        <Select
          value={selectedCategory}
          onValueChange={onCategoryChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showStatusFilter && statusOptions.length > 0 && (
        <Select
          value={selectedStatus}
          onValueChange={onStatusChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {additionalFilters}

      <div className="flex-1" />

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1"
          onClick={() => {
            if (onCategoryChange) onCategoryChange('all');
            if (onStatusChange) onStatusChange('all');
          }}
        >
          <XIcon className="h-4 w-4" />
          <span>Clear Filters</span>
        </Button>
      )}

      {showRefresh && onRefresh && (
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCwIcon className="h-4 w-4" />
          <span className="sr-only">Refresh</span>
        </Button>
      )}

      {showExport && onExport && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1"
              disabled={isLoading}
            >
              <DownloadIcon className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExport('csv')}>
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('excel')}>
              Export as Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('pdf')}>
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
