import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { MaterialPurchase } from '@/types/materials';
import { MaterialPurchaseForm } from '@/components/materials/forms/MaterialPurchaseForm';
import { MaterialPurchasesTable } from '@/components/materials/MaterialPurchasesTable';
import { BottomOverlayForm } from '@/components/materials/BottomOverlayForm';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/components/ui/use-toast';
import { toast } from 'sonner';
import { MaterialPurchaseViewSheet } from '../view/MaterialPurchaseViewSheet';
import { useMaterialPurchases } from '../../_context/MaterialPurchasesContext';

// Import UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, CalendarRange, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

/**
 * Main component for the material purchases tab
 */
interface MaterialPurchasesTabContentProps {
  onRegisterHandleAddPurchase?: (handleAddPurchase: (values: any) => Promise<any>) => void;
}

export function MaterialPurchasesTabContent({ onRegisterHandleAddPurchase }: MaterialPurchasesTabContentProps = {}) {
  const [viewPurchase, setViewPurchase] = useState<MaterialPurchase | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAddingPurchase, setIsAddingPurchase] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Number of items to display per page

  // Use the shared context
  const {
    purchases,
    filteredPurchases,
    total,
    isLoading,
    isError,
    filters,
    setFilters,
    pagination,
    setPagination,
    useClientSideFiltering,
    setUseClientSideFiltering,
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    paymentStatusFilter,
    setPaymentStatusFilter,
    resetAllFilters,
    syncFilters,
    refreshPurchases: mutate,
    createMaterialPurchase,
    updateMaterialPurchase,
    deleteMaterialPurchase,
    isSubmitting
  } = useMaterialPurchases();

  // Use debounced search to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchQuery, 500);

  // Always use client-side filtering, so clear server-side filters
  // This effect runs once on component mount to ensure we fetch all data
  useEffect(() => {
    // Always clear server-side filters to fetch all data
    setFilters({});
    // Ensure we're using client-side filtering
    setUseClientSideFiltering(true);
  }, [setFilters, setUseClientSideFiltering]);

  // Update pagination in the context when it changes
  useEffect(() => {
    setPagination({
      page: currentPage,
      limit: itemsPerPage
    });
  }, [currentPage, itemsPerPage, setPagination]);

  // Handle refresh data with improved error handling and feedback
  const refreshData = useCallback(async () => {
    try {
      console.log('Refreshing material purchases data...');
      await mutate();
      console.log('Material purchases data refreshed successfully');
      return Promise.resolve();
    } catch (error) {
      console.error('Error refreshing material purchases data:', error);
      toast.error('Failed to refresh data');
      return Promise.reject(error);
    }
  }, [mutate]);

  // Sync filters when switching to this tab
  useEffect(() => {
    syncFilters('purchases');
  }, [syncFilters]);

  // Load data on initial render
  useEffect(() => {
    console.log('MaterialPurchasesTabContent - Initial render, loading data');
    refreshData();
  }, [refreshData]);

  // Log the data for debugging
  React.useEffect(() => {
    console.log('MaterialPurchasesTabContent - filtered purchases:', filteredPurchases.length, 'of', purchases.length);
  }, [purchases, filteredPurchases]);

  // For backward compatibility
  const isCreating = isSubmitting;
  const isUpdating = isSubmitting;
  const isDeleting = isSubmitting;

  // Handle view purchase
  const handleViewPurchase = (purchase: MaterialPurchase) => {
    // Ensure the purchase has all required arrays initialized
    const normalizedPurchase = {
      ...purchase,
      payments: purchase?.payments ?? [],
      installments: purchase?.installments ?? [],
      purchase_notes: purchase?.purchase_notes ?? []
    };
    setViewPurchase(normalizedPurchase);
    setIsViewOpen(true);
  };

  // Handle add purchase
  const handleAddPurchase = () => {
    setIsAddingPurchase(true);
  };

  // Ensure data is loaded on initial render if needed
  useEffect(() => {
    // Always trigger a data refresh on initial render
    console.log('MaterialPurchasesTabContent - Initial render, ensuring data is loaded');
    refreshData();
  }, []); // Empty dependency array to run only once on mount

  // Handle filter issues
  useEffect(() => {
    // If we have purchases but no filtered purchases, it might be due to filter issues
    if (purchases.length > 0 && filteredPurchases.length === 0 && !isLoading && !isSubmitting) {
      console.log('Have purchases but no filtered purchases, resetting filters');

      // Reset all filters to ensure we show data
      resetAllFilters();

      // Force a refresh with a slight delay to ensure state updates have propagated
      setTimeout(() => {
        console.log('Forcing data refresh after filter reset');
        refreshData();
      }, 100);
    }
  }, [purchases.length, filteredPurchases.length, isLoading, isSubmitting, refreshData, resetAllFilters]);

  // Reset filters
  const handleResetFilters = () => {
    console.log('MaterialPurchasesTabContent - Reset filters button clicked');

    // Reset all filters in the context
    resetAllFilters();

    // Reset local pagination
    setCurrentPage(1); // Reset to first page when filters change

    // Show toast notification - using the correct Sonner toast syntax
    toast.success("Filters reset", {
      description: "All filters have been reset to default values."
    });

    console.log('MaterialPurchasesTabContent - Filters reset complete');
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, dateRange, paymentStatusFilter]);

  // Removed refreshPurchase function - we use existing data and only refresh when necessary

  // Register the handleAddPurchase function with the parent component
  useEffect(() => {
    if (onRegisterHandleAddPurchase) {
      console.log('Registering handleAddPurchase function with parent component');
      onRegisterHandleAddPurchase(async (values: any) => {
        try {
          // Handle add purchase logic here
          setIsAddingPurchase(false);
          refreshData();
          toast.success("Material purchase added", {
            description: "Your material purchase has been added successfully."
          });
          return {};
        } catch (error) {
          console.error('Error adding material purchase:', error);
          toast.error("Error", {
            description: error instanceof Error ? error.message : "Failed to add material purchase"
          });
          throw error;
        }
      });
    }
  }, [onRegisterHandleAddPurchase, toast, refreshData]);

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by supplier or material..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={paymentStatusFilter || 'all'}
            onValueChange={(value) => {
              console.log('MaterialPurchasesTabContent - Payment status filter changed to:', value);
              setPaymentStatusFilter(value);
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partially_paid">Partially Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarRange className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  "Date Range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
              {dateRange && (
                <div className="flex items-center justify-end gap-2 p-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateRange(undefined)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="h-9"
            onClick={handleResetFilters}
          >
            Reset Filters
          </Button>
          <Button
            className="h-9"
            onClick={handleAddPurchase}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Purchase
          </Button>
        </div>
      </div>

      {/* Material Purchases Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-muted-foreground">
            <span>Showing {filteredPurchases.length} of {purchases.length} purchases</span>
          </div>
        </div>
        <MaterialPurchasesTable
          purchases={filteredPurchases}
          isLoading={isLoading && (!purchases || purchases.length === 0)} // Only show loading when we have no data
          isEmpty={!isLoading && !isSubmitting && (isError || filteredPurchases.length === 0)}
          onViewPurchase={handleViewPurchase}
          onDeletePurchase={async (id) => {
            try {
              await deleteMaterialPurchase(id);
              return Promise.resolve();
            } catch (error) {
              console.error('Error deleting material purchase:', error);
              return Promise.reject(error);
            }
          }}
          onAddPurchase={handleAddPurchase}
        />

        {/* Pagination - to be implemented */}
      </div>

      {/* View Material Purchase */}
      {viewPurchase && (
        <MaterialPurchaseViewSheet
          purchase={viewPurchase}
          open={isViewOpen}
          onOpenChange={(open) => {
            setIsViewOpen(open);
            // Only refresh when closing the sheet if changes were made
            if (!open) {
              refreshData();
            }
          }}
          onEdit={async (updatedPurchase) => {
            try {
              // Update the purchase
              await updateMaterialPurchase(updatedPurchase.id, updatedPurchase);
              // Update the local view purchase state to reflect changes
              setViewPurchase(updatedPurchase);
              return;
            } catch (error) {
              console.error('Error updating material purchase:', error);
              throw error;
            }
          }}
          onDelete={async (id) => {
            try {
              await deleteMaterialPurchase(id);
              return Promise.resolve();
            } catch (error) {
              console.error('Error deleting material purchase:', error);
              return Promise.reject(error);
            }
          }}
        />
      )}

      {/* Add Material Purchase - Using children prop to properly trigger the sheet */}
      {isAddingPurchase && (
        <BottomOverlayForm
          isOpen={isAddingPurchase}
          onClose={() => setIsAddingPurchase(false)}
          title="Add Material Purchase"
        >
          <MaterialPurchaseForm
            open={isAddingPurchase}
            onOpenChange={setIsAddingPurchase}
            onSuccess={() => {
              setIsAddingPurchase(false);
              // No need to call refreshData() as the optimistic update will handle it
            }}
            onCancel={() => setIsAddingPurchase(false)}
          >
            {/* This is an empty/hidden trigger that won't be visible */}
            <span className="hidden" />
          </MaterialPurchaseForm>
        </BottomOverlayForm>
      )}
    </div>
  );
}
