import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TaskStatus, TaskPriority } from '@/types/orders';
import { CalendarIcon, Filter, X, Search, RotateCcw } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface TaskFiltersProps {
  onSearch: (value: string) => void;
  onFilter: (filters: TaskFilters) => void;
  onReset: () => void;
  userRole: 'admin' | 'manager' | 'employee';
}

export interface TaskFilters {
  search: string;
  status: TaskStatus[];
  priority: TaskPriority[];
  startDate?: string;
  endDate?: string;
  assignedToMe?: boolean;
  recurring?: boolean;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
  onSearch,
  onFilter,
  onReset,
  userRole,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: [],
    priority: [],
    startDate: undefined,
    endDate: undefined,
    assignedToMe: false,
    recurring: false,
  });

  const [dateRange, setDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({
    from: undefined,
    to: undefined,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
    setFilters({ ...filters, search: searchTerm });
  };

  const handleFilterChange = (newFilters: Partial<TaskFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilter(updatedFilters);
  };

  const handleStatusChange = (status: TaskStatus) => {
    const statuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    handleFilterChange({ status: statuses });
  };

  const handlePriorityChange = (priority: TaskPriority) => {
    const priorities = filters.priority.includes(priority)
      ? filters.priority.filter(p => p !== priority)
      : [...filters.priority, priority];
    handleFilterChange({ priority: priorities });
  };

  const handleDateChange = (range: { from?: Date; to?: Date }) => {
    setDateRange(range);
    handleFilterChange({
      startDate: range.from?.toISOString().split('T')[0],
      endDate: range.to?.toISOString().split('T')[0],
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilters({
      search: '',
      status: [],
      priority: [],
      startDate: undefined,
      endDate: undefined,
      assignedToMe: false,
      recurring: false,
    });
    setDateRange({ from: undefined, to: undefined });
    onReset();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status.length) count++;
    if (filters.priority.length) count++;
    if (filters.startDate || filters.endDate) count++;
    if (filters.assignedToMe) count++;
    if (filters.recurring) count++;
    return count;
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-gray-900 border-gray-800 focus-visible:ring-orange-600"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-gray-800 hover:bg-gray-800 hover:text-white"
          onClick={() => setFiltersVisible(!filtersVisible)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {getActiveFiltersCount() > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 bg-orange-600 text-white text-xs"
            >
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>
        {(getActiveFiltersCount() > 0 || searchTerm) && (
          <Button
            type="button"
            variant="ghost"
            className="text-gray-400 hover:text-white"
            onClick={handleResetFilters}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        )}
      </form>

      {filtersVisible && (
        <div className="bg-gray-900 border border-gray-800 rounded-md p-4 text-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Filter Tasks</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setFiltersVisible(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Date Range */}
            <div>
              <Label className="text-sm text-gray-400 mb-2 block">Due Date Range</Label>
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={handleDateChange}
                className="w-full border-gray-700 bg-gray-900 hover:bg-gray-800"
                align="start"
              />
            </div>

            {/* Task Status */}
            <div>
              <Label className="text-sm text-gray-400 mb-2 block">Task Status</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={filters.status.includes('pending') ? 'default' : 'outline'}
                  className={
                    filters.status.includes('pending')
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'border-gray-700 text-gray-400 hover:bg-gray-800'
                  }
                  onClick={() => handleStatusChange('pending')}
                >
                  Pending
                </Button>
                <Button
                  size="sm"
                  variant={filters.status.includes('in_progress') ? 'default' : 'outline'}
                  className={
                    filters.status.includes('in_progress')
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border-gray-700 text-gray-400 hover:bg-gray-800'
                  }
                  onClick={() => handleStatusChange('in_progress')}
                >
                  In Progress
                </Button>
                <Button
                  size="sm"
                  variant={filters.status.includes('completed') ? 'default' : 'outline'}
                  className={
                    filters.status.includes('completed')
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'border-gray-700 text-gray-400 hover:bg-gray-800'
                  }
                  onClick={() => handleStatusChange('completed')}
                >
                  Completed
                </Button>
                <Button
                  size="sm"
                  variant={filters.status.includes('cancelled') ? 'default' : 'outline'}
                  className={
                    filters.status.includes('cancelled')
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'border-gray-700 text-gray-400 hover:bg-gray-800'
                  }
                  onClick={() => handleStatusChange('cancelled')}
                >
                  Cancelled
                </Button>
              </div>
            </div>

            {/* Priority */}
            <div>
              <Label className="text-sm text-gray-400 mb-2 block">Priority</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={filters.priority.includes('low') ? 'default' : 'outline'}
                  className={
                    filters.priority.includes('low')
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border-gray-700 text-gray-400 hover:bg-gray-800'
                  }
                  onClick={() => handlePriorityChange('low')}
                >
                  Low
                </Button>
                <Button
                  size="sm"
                  variant={filters.priority.includes('medium') ? 'default' : 'outline'}
                  className={
                    filters.priority.includes('medium')
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                      : 'border-gray-700 text-gray-400 hover:bg-gray-800'
                  }
                  onClick={() => handlePriorityChange('medium')}
                >
                  Medium
                </Button>
                <Button
                  size="sm"
                  variant={filters.priority.includes('high') ? 'default' : 'outline'}
                  className={
                    filters.priority.includes('high')
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'border-gray-700 text-gray-400 hover:bg-gray-800'
                  }
                  onClick={() => handlePriorityChange('high')}
                >
                  High
                </Button>
                <Button
                  size="sm"
                  variant={filters.priority.includes('urgent') ? 'default' : 'outline'}
                  className={
                    filters.priority.includes('urgent')
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'border-gray-700 text-gray-400 hover:bg-gray-800'
                  }
                  onClick={() => handlePriorityChange('urgent')}
                >
                  Urgent
                </Button>
              </div>
            </div>
          </div>

          <Separator className="my-4 bg-gray-800" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={filters.assignedToMe}
                onCheckedChange={(checked: boolean | "indeterminate") =>
                  handleFilterChange({ assignedToMe: checked === true })}
              />
              <Label htmlFor="assignedToMe" className="text-sm">
                Assigned to me
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={filters.recurring}
                onCheckedChange={(checked: boolean | "indeterminate") =>
                  handleFilterChange({ recurring: checked === true })}
              />
              <Label htmlFor="recurring" className="text-sm">
                Recurring tasks only
              </Label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskFilters;