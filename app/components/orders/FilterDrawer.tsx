'use client'

import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { OrderStatus } from '@/types/orders';
import { X, Filter, RefreshCw } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { OptimizedSmartCombobox } from '@/components/ui/optimized-smart-combobox';

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: OrderFilters) => void;
  onResetFilters: () => void;
  initialFilters?: OrderFilters;
}

export interface OrderFilters {
  clientName?: string;
  clientType?: string;
  status?: OrderStatus;
  dateRange?: DateRange;
  minAmount?: number | null;
  maxAmount?: number | null;
  isPaid?: boolean | null;
  hasBalance?: boolean | null;
  itemName?: string;
  categoryName?: string;
  sizeName?: string;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  open,
  onOpenChange,
  onApplyFilters,
  onResetFilters,
  initialFilters = {},
}) => {
  const [filters, setFilters] = useState<OrderFilters>(initialFilters);

  // We don't need to load data here anymore - the CachedSmartCombobox will handle it

  const handleChange = (key: keyof OrderFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = () => {
    setFilters({});
    onResetFilters();
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onOpenChange(false);
  };

  // Reset form when drawer opens with initial filters
  useEffect(() => {
    if (open) {
      setFilters(initialFilters);
    }
  }, [open, initialFilters]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="p-6 border-b border-border">
          <SheetTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filter Orders
          </SheetTitle>
          <SheetDescription>
            Filter orders by various criteria. Changes will be applied when you click the Apply button.
          </SheetDescription>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* Client Filter */}
          <div className="space-y-2">
            <Label htmlFor="clientName" className="text-sm font-medium">Client</Label>
            <OptimizedSmartCombobox
              entityType="clients"
              value={filters.clientName || ''}
              onChange={(value) => handleChange('clientName', value)}
              placeholder="Any client"
              className="w-full"
              allowCreate={false}
              skipLoading={!open}
            />
          </div>

          {/* Client Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="clientType" className="text-sm font-medium">Client Type</Label>
            <Select
              value={filters.clientType}
              onValueChange={(value) => handleChange('clientType', value)}
            >
              <SelectTrigger className="bg-muted/5 border-border">
                <SelectValue placeholder="Any type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any type</SelectItem>
                <SelectItem value="Regular">Regular</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
                <SelectItem value="Corporate">Corporate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleChange('status', value as OrderStatus)}
            >
              <SelectTrigger className="bg-muted/5 border-border">
                <SelectValue placeholder="Any status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <Label htmlFor="categoryName" className="text-sm font-medium">Category</Label>
            <OptimizedSmartCombobox
              entityType="categories"
              value={filters.categoryName || ''}
              onChange={(value) => handleChange('categoryName', value)}
              placeholder="Any category"
              className="w-full"
              allowCreate={false}
              skipLoading={!open}
            />
          </div>

          {/* Item Filter */}
          <div className="space-y-2">
            <Label htmlFor="itemName" className="text-sm font-medium">Item</Label>
            <OptimizedSmartCombobox
              entityType="items"
              parentId={filters.categoryName}
              value={filters.itemName || ''}
              onChange={(value) => handleChange('itemName', value)}
              placeholder="Any item"
              className="w-full"
              allowCreate={false}
              disabled={!filters.categoryName}
              skipLoading={!open || !filters.categoryName}
            />
          </div>

          {/* Size Filter */}
          <div className="space-y-2">
            <Label htmlFor="sizeName" className="text-sm font-medium">Size</Label>
            <OptimizedSmartCombobox
              entityType="sizes"
              value={filters.sizeName || ''}
              onChange={(value) => handleChange('sizeName', value)}
              placeholder="Any size"
              className="w-full"
              allowCreate={false}
              skipLoading={!open}
            />
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label htmlFor="dateRange" className="text-sm font-medium">Date Range</Label>
            <DateRangePicker
              dateRange={filters.dateRange}
              onDateRangeChange={(dateRange) => handleChange('dateRange', dateRange)}
              className="bg-muted/5 border-border w-full"
            />
          </div>

          {/* Amount Range Filter */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minAmount" className="text-sm font-medium">Min Amount</Label>
              <Input
                id="minAmount"
                type="number"
                placeholder="0"
                value={filters.minAmount || ''}
                onChange={(e) => handleChange('minAmount', e.target.value ? Number(e.target.value) : null)}
                className="bg-muted/5 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAmount" className="text-sm font-medium">Max Amount</Label>
              <Input
                id="maxAmount"
                type="number"
                placeholder="Any"
                value={filters.maxAmount || ''}
                onChange={(e) => handleChange('maxAmount', e.target.value ? Number(e.target.value) : null)}
                className="bg-muted/5 border-border"
              />
            </div>
          </div>

          {/* Payment Status Filters */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Payment Status</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPaid"
                checked={filters.isPaid === true}
                onCheckedChange={(checked) => handleChange('isPaid', checked ? true : null)}
              />
              <label
                htmlFor="isPaid"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Fully Paid
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasBalance"
                checked={filters.hasBalance === true}
                onCheckedChange={(checked) => handleChange('hasBalance', checked ? true : null)}
              />
              <label
                htmlFor="hasBalance"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Has Balance
              </label>
            </div>
          </div>
        </div>

        <SheetFooter className="p-6 border-t border-border sticky bottom-0 bg-background z-10 flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto border-border flex items-center"
            onClick={handleReset}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset Filters
          </Button>
          <Button
            className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90"
            onClick={handleApply}
          >
            <Filter className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default FilterDrawer;
