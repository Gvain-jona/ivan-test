import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrderStatus, PaymentStatus, OrdersTableFilters } from '@/types/orders';
import { CalendarIcon, Search, X, Filter } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface OrderFiltersProps {
  filters: OrdersTableFilters;
  onFilterChange: (filters: OrdersTableFilters) => void;
  onSearch: (searchTerm: string) => void;
  onReset: () => void;
}

const OrderFilters: React.FC<OrderFiltersProps> = ({
  filters,
  onFilterChange,
  onSearch,
  onReset,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusChange = (value: OrderStatus) => {
    const newStatus = filters.status?.includes(value)
      ? filters.status.filter(s => s !== value)
      : [...(filters.status || []), value];

    onFilterChange({
      ...filters,
      status: newStatus.length > 0 ? newStatus : undefined,
    });
  };

  const handlePaymentStatusChange = (value: PaymentStatus) => {
    const newStatus = filters.paymentStatus?.includes(value)
      ? filters.paymentStatus.filter(s => s !== value)
      : [...(filters.paymentStatus || []), value];

    onFilterChange({
      ...filters,
      paymentStatus: newStatus.length > 0 ? newStatus : undefined,
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  // Format the date range for display
  const getDateRangeText = () => {
    if (filters.startDate && filters.endDate) {
      return `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`;
    }
    if (filters.startDate) {
      return `From ${formatDate(filters.startDate)}`;
    }
    if (filters.endDate) {
      return `Until ${formatDate(filters.endDate)}`;
    }
    return 'Select dates';
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.startDate || filters.endDate) count++;
    if (filters.client) count++;
    if (filters.status && filters.status.length > 0) count++;
    if (filters.paymentStatus && filters.paymentStatus.length > 0) count++;
    if (filters.search) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="flex flex-col lg:flex-row gap-3 mb-4">
      {/* Search Box */}
      <div className="flex-1">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-900 border-gray-800 focus:border-orange-600 text-white"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                if (filters.search) {
                  onSearch('');
                }
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
      </div>

      {/* Filter Button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="relative border-gray-800 bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Filter className="mr-2 h-4 w-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-2 rounded-full bg-orange-600 text-white w-5 h-5 flex items-center justify-center text-xs">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4 bg-gray-950 border-gray-800 text-gray-300">
          <div className="space-y-4">
            <h3 className="font-medium">Filter Orders</h3>

            {/* Date Range */}
            <div>
              <label className="text-sm font-medium mb-1 block">Date Range</label>
              <DateRangePicker
                dateRange={{
                  from: filters.startDate ? new Date(filters.startDate) : undefined,
                  to: filters.endDate ? new Date(filters.endDate) : undefined,
                }}
                onDateRangeChange={(range) => {
                  onFilterChange({
                    ...filters,
                    startDate: range?.from ? range.from.toISOString() : undefined,
                    endDate: range?.to ? range.to.toISOString() : undefined,
                  });
                }}
                className="w-full border-gray-800 bg-gray-900 hover:bg-gray-800 text-gray-300"
                align="start"
              />
            </div>

            {/* Client Dropdown */}
            <div>
              <label className="text-sm font-medium mb-1 block">Client</label>
              <Select
                value={filters.client || "all"}
                onValueChange={(value) => onFilterChange({ ...filters, client: value === "all" ? undefined : value })}
              >
                <SelectTrigger className="border-gray-800 bg-gray-900 text-gray-300">
                  <SelectValue placeholder="All clients" />
                </SelectTrigger>
                <SelectContent className="bg-gray-950 border-gray-800 text-gray-300">
                  <SelectItem value="all">All clients</SelectItem>
                  {/* Client options would be populated from API data */}
                  <SelectItem value="client1">Acme Corp</SelectItem>
                  <SelectItem value="client2">TechStart Inc</SelectItem>
                  <SelectItem value="client3">Local Restaurant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Order Status */}
            <div>
              <label className="text-sm font-medium mb-1 block">Order Status</label>
              <div className="flex flex-wrap gap-2">
                {(['paused', 'in_progress', 'completed', 'delivered', 'cancelled'] as OrderStatus[]).map((status) => (
                  <Button
                    key={status}
                    variant="outline"
                    size="sm"
                    className={`
                      border-gray-800
                      ${filters.status?.includes(status)
                        ? 'bg-gray-800 text-orange-500 border-orange-600'
                        : 'bg-gray-900 text-gray-400'
                      }
                    `}
                    onClick={() => handleStatusChange(status)}
                  >
                    {status
                      .split('_')
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Payment Status */}
            <div>
              <label className="text-sm font-medium mb-1 block">Payment Status</label>
              <div className="flex flex-wrap gap-2">
                {(['paid', 'partially_paid', 'unpaid'] as PaymentStatus[]).map((status) => (
                  <Button
                    key={status}
                    variant="outline"
                    size="sm"
                    className={`
                      border-gray-800
                      ${filters.paymentStatus?.includes(status)
                        ? 'bg-gray-800 text-orange-500 border-orange-600'
                        : 'bg-gray-900 text-gray-400'
                      }
                    `}
                    onClick={() => handlePaymentStatusChange(status)}
                  >
                    {status
                      .split('_')
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-800 text-gray-400 hover:text-white"
                onClick={() => {
                  onReset();
                  setIsOpen(false);
                }}
              >
                Reset
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => setIsOpen(false)}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default OrderFilters;