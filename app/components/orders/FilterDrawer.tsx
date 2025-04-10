import React, { useEffect, useState } from 'react';
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
import { X, Filter, RefreshCw, Loader2 } from 'lucide-react';
import { DateRange } from 'react-day-picker';

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

const FilterDrawer: React.FC<FilterDrawerProps> = ({
  open,
  onOpenChange,
  onApplyFilters,
  onResetFilters,
  initialFilters = {}
}) => {
  const [filters, setFilters] = useState<OrderFilters>(initialFilters);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [items, setItems] = useState<{id: string, name: string, category_id: string}[]>([]);
  const [sizes, setSizes] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState({
    clients: false,
    categories: false,
    items: false,
    sizes: false
  });

  // Reset form when drawer opens with initial filters
  useEffect(() => {
    if (open) {
      setFilters(initialFilters);
      fetchFilterData();
    }
  }, [open, initialFilters]);

  // Fetch data for filters from the database
  const fetchFilterData = async () => {
    // Fetch clients
    setLoading(prev => ({ ...prev, clients: true }));
    try {
      // In a real app, this would be an API call to fetch clients
      // For now, we'll use mock data
      const clientsData = [
        { id: '1', name: 'Acme Corporation' },
        { id: '2', name: 'Wayne Enterprises' },
        { id: '3', name: 'Stark Industries' },
        { id: '4', name: 'Umbrella Corporation' },
        { id: '5', name: 'Cyberdyne Systems' },
        { id: '6', name: 'Globex Corporation' },
      ];
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(prev => ({ ...prev, clients: false }));
    }

    // Fetch categories
    setLoading(prev => ({ ...prev, categories: true }));
    try {
      const categoriesData = [
        { id: '1', name: 'Banners' },
        { id: '2', name: 'Business Cards' },
        { id: '3', name: 'Flyers' },
        { id: '4', name: 'Posters' },
        { id: '5', name: 'Stickers' },
      ];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(prev => ({ ...prev, categories: false }));
    }

    // Fetch items
    setLoading(prev => ({ ...prev, items: true }));
    try {
      const itemsData = [
        { id: '1', name: 'Vinyl Banner', category_id: '1' },
        { id: '2', name: 'Mesh Banner', category_id: '1' },
        { id: '3', name: 'Standard Business Card', category_id: '2' },
        { id: '4', name: 'Premium Business Card', category_id: '2' },
        { id: '5', name: 'A5 Flyer', category_id: '3' },
        { id: '6', name: 'A4 Flyer', category_id: '3' },
        { id: '7', name: 'A3 Poster', category_id: '4' },
        { id: '8', name: 'A2 Poster', category_id: '4' },
        { id: '9', name: 'Vinyl Sticker', category_id: '5' },
        { id: '10', name: 'Paper Sticker', category_id: '5' },
      ];
      setItems(itemsData);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(prev => ({ ...prev, items: false }));
    }

    // Fetch sizes
    setLoading(prev => ({ ...prev, sizes: true }));
    try {
      const sizesData = [
        { id: '1', name: 'Small' },
        { id: '2', name: 'Medium' },
        { id: '3', name: 'Large' },
        { id: '4', name: 'Extra Large' },
        { id: '5', name: 'Custom' },
      ];
      setSizes(sizesData);
    } catch (error) {
      console.error('Error fetching sizes:', error);
    } finally {
      setLoading(prev => ({ ...prev, sizes: false }));
    }
  };

  const handleChange = (field: keyof OrderFilters, value: any) => {
    // If value is undefined, remove the field from filters
    if (value === undefined) {
      const newFilters = { ...filters };
      delete newFilters[field];
      setFilters(newFilters);
      return;
    }

    // Handle special values for dropdown filters
    if (field === 'clientType' && value === 'all_types') {
      // Remove the clientType filter
      const { clientType, ...rest } = filters;
      setFilters(rest);
      return;
    }

    if (field === 'status' && value === 'all_statuses') {
      // Remove the status filter
      const { status, ...rest } = filters;
      setFilters(rest);
      return;
    }

    if (field === 'categoryName' && value === 'all_categories') {
      // Remove the categoryName filter
      const { categoryName, ...rest } = filters;
      setFilters(rest);
      return;
    }

    if (field === 'itemName' && value === 'all_items') {
      // Remove the itemName filter
      const { itemName, ...rest } = filters;
      setFilters(rest);
      return;
    }

    if (field === 'sizeName' && value === 'all_sizes') {
      // Remove the sizeName filter
      const { sizeName, ...rest } = filters;
      setFilters(rest);
      return;
    }

    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setFilters({});
    onResetFilters();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[350px] sm:w-[450px] bg-background border-r border-border p-0 flex flex-col h-full">
        <SheetHeader className="p-6 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Filter Orders
            </SheetTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <SheetDescription>
            Apply filters to narrow down your order list
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Client Name Filter */}
          <div className="space-y-2">
            <Label htmlFor="clientName" className="text-sm font-medium">Client Name</Label>
            <Select
              value={filters.clientName || 'all_clients'}
              onValueChange={(value) => handleChange('clientName', value === 'all_clients' ? undefined : value)}
            >
              <SelectTrigger id="clientName" className="bg-muted/5 border-border">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_clients">All Clients</SelectItem>
                {loading.clients ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  clients.map(client => (
                    <SelectItem key={client.id} value={client.name}>{client.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Client Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="clientType" className="text-sm font-medium">Client Type</Label>
            <Select
              value={filters.clientType || 'all_types'}
              onValueChange={(value) => handleChange('clientType', value)}
            >
              <SelectTrigger id="clientType" className="bg-muted/5 border-border">
                <SelectValue placeholder="Select client type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_types">All Types</SelectItem>
                <SelectItem value="Regular">Regular</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
                <SelectItem value="Corporate">Corporate</SelectItem>
                <SelectItem value="Government">Government</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">Order Status</Label>
            <Select
              value={filters.status || 'all_statuses'}
              onValueChange={(value) => handleChange('status', value === 'all_statuses' ? undefined : value as OrderStatus)}
            >
              <SelectTrigger id="status" className="bg-muted/5 border-border">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_statuses">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <Label htmlFor="categoryName" className="text-sm font-medium">Category</Label>
            <Select
              value={filters.categoryName || 'all_categories'}
              onValueChange={(value) => handleChange('categoryName', value === 'all_categories' ? undefined : value)}
            >
              <SelectTrigger id="categoryName" className="bg-muted/5 border-border">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_categories">All Categories</SelectItem>
                {loading.categories ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  categories.map(category => (
                    <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Item Filter */}
          <div className="space-y-2">
            <Label htmlFor="itemName" className="text-sm font-medium">Item</Label>
            <Select
              value={filters.itemName || 'all_items'}
              onValueChange={(value) => handleChange('itemName', value === 'all_items' ? undefined : value)}
            >
              <SelectTrigger id="itemName" className="bg-muted/5 border-border">
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_items">All Items</SelectItem>
                {loading.items ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  items.map(item => (
                    <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Size Filter */}
          <div className="space-y-2">
            <Label htmlFor="sizeName" className="text-sm font-medium">Size</Label>
            <Select
              value={filters.sizeName || 'all_sizes'}
              onValueChange={(value) => handleChange('sizeName', value === 'all_sizes' ? undefined : value)}
            >
              <SelectTrigger id="sizeName" className="bg-muted/5 border-border">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_sizes">All Sizes</SelectItem>
                {loading.sizes ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  sizes.map(size => (
                    <SelectItem key={size.id} value={size.name}>{size.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
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
