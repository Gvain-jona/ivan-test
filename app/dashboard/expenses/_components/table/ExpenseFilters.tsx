import React from 'react';
import { format } from 'date-fns';
import { Search, Filter, CalendarRange } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define categories (formerly expense types)
const CATEGORIES = [
  'All',
  'Fixed',
  'Variable',
];

// Define payment statuses
const PAYMENT_STATUSES = [
  'All',
  'Paid',
  'Partially Paid',
  'Unpaid',
];

// Define recurring options
const RECURRING_OPTIONS = [
  { value: 'all', label: 'All Expenses' },
  { value: 'recurring', label: 'Recurring Only' },
  { value: 'non-recurring', label: 'Non-Recurring Only' },
];

interface ExpenseFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (value: DateRange | undefined) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  selectedType: string;
  setSelectedType: (value: string) => void;
  showRecurring: boolean | undefined;
  setShowRecurring: (value: boolean | undefined) => void;
  resetFilters: () => void;
}

/**
 * Filters section of the expenses table
 */
export function ExpenseFilters({
  searchQuery,
  setSearchQuery,
  dateRange,
  setDateRange,
  selectedStatus,
  setSelectedStatus,
  selectedType,
  setSelectedType,
  showRecurring,
  setShowRecurring,
  resetFilters,
}: ExpenseFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div className="relative w-full sm:w-auto flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search expenses..."
          className="pl-8 w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex gap-2 w-full sm:w-auto">
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          className="w-auto h-9"
          align="end"
        />

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[110px] h-9">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={showRecurring === undefined ? 'all' : showRecurring ? 'recurring' : 'non-recurring'}
          onValueChange={(value) => {
            if (value === 'all') {
              setShowRecurring(undefined);
            } else if (value === 'recurring') {
              setShowRecurring(true);
            } else {
              setShowRecurring(false);
            }
          }}
        >
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Recurrence" />
          </SelectTrigger>
          <SelectContent>
            {RECURRING_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="ghost" size="sm" className="h-9" onClick={resetFilters}>
          Reset
        </Button>
      </div>
    </div>
  );
}
