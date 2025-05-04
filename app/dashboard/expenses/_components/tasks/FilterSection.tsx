'use client';

import React, { useState } from 'react';
import { Clock, Filter, Search, Calendar, CalendarDays, CalendarClock, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FilterButton } from './FilterButton';
import { FilterType, FILTER_LABELS } from './types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface FilterCounts {
  all: number;
  today: number;
  tomorrow: number;
  thisWeek: number;
  nextWeek: number;
  thisMonth: number;
  upcoming: number;
  overdue: number;
  completed: number;
}

interface FilterSectionProps {
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterCounts: FilterCounts;
  isDarkMode: boolean;
}

export function FilterSection({
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
  filterCounts,
  isDarkMode
}: FilterSectionProps) {
  const [timeFilterOpen, setTimeFilterOpen] = useState(false);

  // Get filter label
  const getFilterLabel = (filterValue: string): string => {
    return FILTER_LABELS[filterValue] || filterValue.charAt(0).toUpperCase() + filterValue.slice(1);
  };

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2 flex-1">
          {/* Main filter buttons */}
          <FilterButton filter="all" currentFilter={filter} setFilter={setFilter} count={filterCounts.all} isDarkMode={isDarkMode} />
          <FilterButton filter="today" currentFilter={filter} setFilter={setFilter} count={filterCounts.today} isDarkMode={isDarkMode} icon={<Clock className="h-3 w-3 mr-1" />} />
          <FilterButton filter="upcoming" currentFilter={filter} setFilter={setFilter} count={filterCounts.upcoming} isDarkMode={isDarkMode} />
          <FilterButton filter="overdue" currentFilter={filter} setFilter={setFilter} count={filterCounts.overdue} isDarkMode={isDarkMode} />
          <FilterButton filter="completed" currentFilter={filter} setFilter={setFilter} count={filterCounts.completed} isDarkMode={isDarkMode} />

          {/* Time filter dropdown */}
          <DropdownMenu
            open={timeFilterOpen}
            onOpenChange={(open) => {
              setTimeFilterOpen(open);
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  // Prevent the button click from triggering dropdown toggle
                  // Only open the dropdown, don't close it on click
                  if (!timeFilterOpen) {
                    setTimeFilterOpen(true);
                  }
                  e.stopPropagation();
                }}
                className={cn(
                  "rounded-md border transition-all duration-200 h-9 px-3",
                  isDarkMode
                    ? "border-gray-700 bg-transparent hover:bg-gray-800/50 text-gray-300"
                    : "border-gray-200 bg-transparent hover:bg-gray-100/50 text-gray-700",
                  (filter === 'tomorrow' || filter === 'thisWeek' || filter === 'nextWeek' || filter === 'thisMonth') &&
                    (isDarkMode ? "bg-white text-black border-white" : "bg-black text-white border-black")
                )}
              >
                <Filter className="h-4 w-4 mr-1.5" />
                {(filter === 'tomorrow' || filter === 'thisWeek' || filter === 'nextWeek' || filter === 'thisMonth')
                  ? getFilterLabel(filter)
                  : "Time Range"}
                <ChevronDown className="h-3.5 w-3.5 ml-1.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className={cn(
                "w-56 rounded-lg shadow-md",
                isDarkMode
                  ? "bg-gray-900 border-gray-700"
                  : "bg-white border-gray-200"
              )}
            >
            <DropdownMenuLabel>Filter by Time</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => { setFilter('tomorrow'); setTimeFilterOpen(false); }}
                className={cn(
                  "flex items-center cursor-pointer",
                  filter === 'tomorrow' && isDarkMode
                    ? "bg-gray-800"
                    : filter === 'tomorrow'
                      ? "bg-gray-100"
                      : ""
                )}
              >
                <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                <span>Tomorrow</span>
                {filterCounts.tomorrow > 0 && (
                  <Badge className={cn(
                    "ml-auto text-xs",
                    isDarkMode
                      ? "bg-gray-800 text-gray-300"
                      : "bg-gray-100 text-gray-700"
                  )}>
                    {filterCounts.tomorrow}
                  </Badge>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setFilter('thisWeek'); setTimeFilterOpen(false); }}
                className={cn(
                  "flex items-center cursor-pointer",
                  filter === 'thisWeek' && isDarkMode
                    ? "bg-gray-800"
                    : filter === 'thisWeek'
                      ? "bg-gray-100"
                      : ""
                )}
              >
                <CalendarDays className="h-4 w-4 mr-2 text-purple-500" />
                <span>This Week</span>
                {filterCounts.thisWeek > 0 && (
                  <Badge className={cn(
                    "ml-auto text-xs",
                    isDarkMode
                      ? "bg-gray-800 text-gray-300"
                      : "bg-gray-100 text-gray-700"
                  )}>
                    {filterCounts.thisWeek}
                  </Badge>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setFilter('nextWeek'); setTimeFilterOpen(false); }}
                className={cn(
                  "flex items-center cursor-pointer",
                  filter === 'nextWeek' && isDarkMode
                    ? "bg-gray-800"
                    : filter === 'nextWeek'
                      ? "bg-gray-100"
                      : ""
                )}
              >
                <CalendarDays className="h-4 w-4 mr-2 text-green-500" />
                <span>Next Week</span>
                {filterCounts.nextWeek > 0 && (
                  <Badge className={cn(
                    "ml-auto text-xs",
                    isDarkMode
                      ? "bg-gray-800 text-gray-300"
                      : "bg-gray-100 text-gray-700"
                  )}>
                    {filterCounts.nextWeek}
                  </Badge>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setFilter('thisMonth'); setTimeFilterOpen(false); }}
                className={cn(
                  "flex items-center cursor-pointer",
                  filter === 'thisMonth' && isDarkMode
                    ? "bg-gray-800"
                    : filter === 'thisMonth'
                      ? "bg-gray-100"
                      : ""
                )}
              >
                <CalendarClock className="h-4 w-4 mr-2 text-orange-500" />
                <span>This Month</span>
                {filterCounts.thisMonth > 0 && (
                  <Badge className={cn(
                    "ml-auto text-xs",
                    isDarkMode
                      ? "bg-gray-800 text-gray-300"
                      : "bg-gray-100 text-gray-700"
                  )}>
                    {filterCounts.thisMonth}
                  </Badge>
                )}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-auto md:min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pl-10 focus-visible:ring-offset-0 rounded-md border transition-all duration-200 h-9",
              isDarkMode
                ? "bg-transparent border-gray-700 focus-visible:ring-gray-700 hover:border-gray-600"
                : "bg-transparent border-gray-200 focus-visible:ring-gray-300 hover:border-gray-300"
            )}
          />
        </div>
      </div>
    </div>
  );
}
