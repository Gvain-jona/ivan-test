'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Filter,
  Search,
  Clock,
  Calendar,
  ChevronDown,
  AlertTriangle,
  CalendarDays,
  CalendarClock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskFilterType } from '../../_context/MaterialPurchasesContext';

// Filter labels for display
const FILTER_LABELS: Record<string, string> = {
  all: 'All Tasks',
  today: 'Today',
  tomorrow: 'Tomorrow',
  thisWeek: 'This Week',
  nextWeek: 'Next Week',
  thisMonth: 'This Month',
  upcoming: 'Upcoming',
  overdue: 'Overdue',
};

// Filter button component
interface FilterButtonProps {
  filter: TaskFilterType;
  currentFilter: TaskFilterType;
  setFilter: (filter: TaskFilterType) => void;
  count: number;
  isDarkMode: boolean;
  icon?: React.ReactNode;
}

function FilterButton({
  filter,
  currentFilter,
  setFilter,
  count,
  isDarkMode,
  icon
}: FilterButtonProps) {
  const isActive = filter === currentFilter;

  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      onClick={() => setFilter(filter)}
      className={cn(
        "h-8 text-xs",
        isActive
          ? isDarkMode
            ? "bg-primary text-primary-foreground"
            : "bg-primary text-primary-foreground"
          : isDarkMode
            ? "bg-transparent border-border hover:bg-muted"
            : "bg-transparent border-border hover:bg-muted"
      )}
    >
      {icon}
      {FILTER_LABELS[filter]}
      {count > 0 && (
        <Badge
          variant="outline"
          className={cn(
            "ml-1 px-1 py-0 text-xs",
            isActive
              ? "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30"
              : isDarkMode
                ? "bg-muted text-muted-foreground border-muted-foreground/30"
                : "bg-muted text-muted-foreground border-muted-foreground/30"
          )}
        >
          {count}
        </Badge>
      )}
    </Button>
  );
}

// Filter counts interface
interface FilterCounts {
  all: number;
  today: number;
  tomorrow: number;
  thisWeek: number;
  nextWeek: number;
  thisMonth: number;
  upcoming: number;
  overdue: number;
}

// Filter section props
interface FilterSectionProps {
  filter: TaskFilterType;
  setFilter: (filter: TaskFilterType) => void;
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
          <FilterButton filter="upcoming" currentFilter={filter} setFilter={setFilter} count={filterCounts.upcoming} isDarkMode={isDarkMode} icon={<CalendarClock className="h-3 w-3 mr-1" />} />
          <FilterButton filter="overdue" currentFilter={filter} setFilter={setFilter} count={filterCounts.overdue} isDarkMode={isDarkMode} icon={<AlertTriangle className="h-3 w-3 mr-1" />} />

          {/* Time filter dropdown */}
          <DropdownMenu open={timeFilterOpen} onOpenChange={setTimeFilterOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 text-xs",
                  (filter === 'tomorrow' || filter === 'thisWeek' || filter === 'nextWeek' || filter === 'thisMonth')
                    ? isDarkMode
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary text-primary-foreground"
                    : isDarkMode
                      ? "bg-transparent border-border hover:bg-muted"
                      : "bg-transparent border-border hover:bg-muted"
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
                  ? "bg-card border-border"
                  : "bg-card border-border"
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
                      ? "bg-muted"
                      : filter === 'tomorrow'
                        ? "bg-muted"
                        : ""
                  )}
                >
                  <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                  <span>Tomorrow</span>
                  {filterCounts.tomorrow > 0 && (
                    <Badge className={cn(
                      "ml-auto text-xs",
                      isDarkMode
                        ? "bg-muted text-muted-foreground"
                        : "bg-muted text-muted-foreground"
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
                      ? "bg-muted"
                      : filter === 'thisWeek'
                        ? "bg-muted"
                        : ""
                  )}
                >
                  <CalendarDays className="h-4 w-4 mr-2 text-indigo-500" />
                  <span>This Week</span>
                  {filterCounts.thisWeek > 0 && (
                    <Badge className={cn(
                      "ml-auto text-xs",
                      isDarkMode
                        ? "bg-muted text-muted-foreground"
                        : "bg-muted text-muted-foreground"
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
                      ? "bg-muted"
                      : filter === 'nextWeek'
                        ? "bg-muted"
                        : ""
                  )}
                >
                  <CalendarDays className="h-4 w-4 mr-2 text-purple-500" />
                  <span>Next Week</span>
                  {filterCounts.nextWeek > 0 && (
                    <Badge className={cn(
                      "ml-auto text-xs",
                      isDarkMode
                        ? "bg-muted text-muted-foreground"
                        : "bg-muted text-muted-foreground"
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
                      ? "bg-muted"
                      : filter === 'thisMonth'
                        ? "bg-muted"
                        : ""
                  )}
                >
                  <CalendarDays className="h-4 w-4 mr-2 text-teal-500" />
                  <span>This Month</span>
                  {filterCounts.thisMonth > 0 && (
                    <Badge className={cn(
                      "ml-auto text-xs",
                      isDarkMode
                        ? "bg-muted text-muted-foreground"
                        : "bg-muted text-muted-foreground"
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
            placeholder="Search materials or suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pl-10 focus-visible:ring-offset-0 rounded-md border transition-all duration-200 h-9",
              isDarkMode
                ? "bg-transparent border-border focus-visible:ring-border hover:border-border/80"
                : "bg-transparent border-border focus-visible:ring-border hover:border-border/80"
            )}
          />
        </div>
      </div>
    </div>
  );
}
