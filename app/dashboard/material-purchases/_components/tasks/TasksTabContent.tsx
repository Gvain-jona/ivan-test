'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { format, isToday, isTomorrow, isYesterday, addDays, isBefore, isAfter, parseISO, isValid } from 'date-fns';
import { MaterialPurchase } from '@/types/materials';
import { useMediaQuery } from '@/hooks/use-media-query';
import { FilterSection } from './FilterSection';
import { DateGroup } from './DateGroup';
import { MaterialPurchaseViewSheet } from '../view/MaterialPurchaseViewSheet';
import { Loader2 } from 'lucide-react';
import { useMaterialPurchases } from '../../_context/MaterialPurchasesContext';

// Import TaskFilterType from context

/**
 * Safely parse a date string, returning null if invalid
 */
const safeParseDate = (dateString?: string): Date | null => {
  if (!dateString) return null;
  try {
    const date = parseISO(dateString);
    return isValid(date) ? date : null;
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return null;
  }
};

/**
 * Tasks tab content for material purchases
 * Displays all material purchases that are not fully paid (unpaid or partially paid)
 * Includes both regular purchases and those with installment plans
 */
export function TasksTabContent() {
  // Check if we're in dark mode - we'll use this for theming
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const isDarkMode = typeof document !== 'undefined'
    ? document.documentElement.classList.contains('dark')
    : prefersDarkMode;

  // State for view
  const [viewPurchase, setViewPurchase] = useState<MaterialPurchase | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Use the shared context
  const {
    purchases = [],
    isLoading,
    refreshPurchases,
    searchQuery,
    setSearchQuery,
    taskFilter,
    setTaskFilter,
    syncFilters
  } = useMaterialPurchases();

  // Sync filters when switching to this tab
  useEffect(() => {
    syncFilters('tasks');
  }, [syncFilters]);

  // Filter purchases to include all that are not fully paid
  const purchasesNotFullyPaid = useMemo(() => {
    // Ensure purchases is an array before filtering
    if (!Array.isArray(purchases)) {
      console.warn('TasksTabContent - purchases is not an array:', purchases);
      return [];
    }

    return purchases.filter(purchase =>
      purchase && (purchase.payment_status === 'unpaid' || purchase.payment_status === 'partially_paid')
    );
  }, [purchases]);

  // Group purchases by due date or purchase date
  const groupedPurchases = useMemo(() => {
    const groups: Record<string, MaterialPurchase[]> = {};

    purchasesNotFullyPaid.forEach(purchase => {
      if (!purchase) return;

      // Determine the date to use for grouping
      // Safely handle potentially invalid dates
      let groupDate = purchase.next_payment_date || purchase.date;

      // Skip if no valid date is available
      if (!groupDate) {
        console.warn('TasksTabContent - Purchase has no valid date:', purchase.id);
        return;
      }

      // Ensure the date is valid
      try {
        const testDate = parseISO(groupDate);
        if (!isValid(testDate)) {
          console.warn('TasksTabContent - Invalid date for purchase:', purchase.id, groupDate);
          return;
        }
      } catch (error) {
        console.error('TasksTabContent - Error parsing date:', groupDate, error);
        return;
      }

      if (!groups[groupDate]) {
        groups[groupDate] = [];
      }
      groups[groupDate].push(purchase);
    });

    return groups;
  }, [purchasesNotFullyPaid]);

  // Filter purchases based on selected filter
  const filteredGroups = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = addDays(today, 1);
    const nextWeek = addDays(today, 7);
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const filtered: Record<string, MaterialPurchase[]> = {};

    Object.entries(groupedPurchases).forEach(([date, purchases]) => {
      // Safely parse the date
      const dueDate = safeParseDate(date);

      // Skip if date is invalid
      if (!dueDate) return;

      // Apply filters
      if (taskFilter === 'all' ||
          (taskFilter === 'today' && isToday(dueDate)) ||
          (taskFilter === 'tomorrow' && isTomorrow(dueDate)) ||
          (taskFilter === 'thisWeek' && isAfter(dueDate, today) && isBefore(dueDate, nextWeek)) ||
          (taskFilter === 'nextWeek' && isAfter(dueDate, nextWeek) && isBefore(dueDate, addDays(nextWeek, 7))) ||
          (taskFilter === 'thisMonth' && isAfter(dueDate, today) && isBefore(dueDate, nextMonth)) ||
          (taskFilter === 'upcoming' && isAfter(dueDate, today)) ||
          (taskFilter === 'overdue' && isBefore(dueDate, today))) {

        // Apply search filter if provided
        if (searchQuery) {
          const filteredPurchases = purchases.filter(purchase =>
            (purchase.material_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (purchase.supplier_name || '').toLowerCase().includes(searchQuery.toLowerCase())
          );

          if (filteredPurchases.length > 0) {
            filtered[date] = filteredPurchases;
          }
        } else {
          filtered[date] = purchases;
        }
      }
    });

    return filtered;
  }, [groupedPurchases, taskFilter, searchQuery]);

  // Sort dates for display
  const sortedDates = useMemo(() => {
    return Object.keys(filteredGroups).sort((a, b) => {
      const dateA = safeParseDate(a);
      const dateB = safeParseDate(b);

      // Handle invalid dates
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      return dateA.getTime() - dateB.getTime();
    });
  }, [filteredGroups]);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = addDays(today, 1);
    const nextWeek = addDays(today, 7);
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    let allCount = 0;
    let todayCount = 0;
    let tomorrowCount = 0;
    let thisWeekCount = 0;
    let nextWeekCount = 0;
    let thisMonthCount = 0;
    let upcomingCount = 0;
    let overdueCount = 0;

    purchasesNotFullyPaid.forEach(purchase => {
      // Determine the date to use for filtering
      let dateToUse = purchase.next_payment_date || purchase.date;
      if (!dateToUse) return;

      // Safely parse the date
      const dueDate = safeParseDate(dateToUse);
      if (!dueDate) return;

      allCount++;

      if (isToday(dueDate)) todayCount++;
      if (isTomorrow(dueDate)) tomorrowCount++;
      if (isAfter(dueDate, today) && isBefore(dueDate, nextWeek)) thisWeekCount++;
      if (isAfter(dueDate, nextWeek) && isBefore(dueDate, addDays(nextWeek, 7))) nextWeekCount++;
      if (isAfter(dueDate, today) && isBefore(dueDate, nextMonth)) thisMonthCount++;
      if (isAfter(dueDate, today)) upcomingCount++;
      if (isBefore(dueDate, today)) overdueCount++;
    });

    return {
      all: allCount,
      today: todayCount,
      tomorrow: tomorrowCount,
      thisWeek: thisWeekCount,
      nextWeek: nextWeekCount,
      thisMonth: thisMonthCount,
      upcoming: upcomingCount,
      overdue: overdueCount
    };
  }, [purchasesNotFullyPaid]);

  // Handle view purchase
  const handleViewPurchase = (purchase: MaterialPurchase) => {
    setViewPurchase(purchase);
    setIsViewOpen(true);
  };

  // Handle edit purchase
  const handleEditPurchase = async (purchase: MaterialPurchase) => {
    // This will be handled by the view sheet
    return purchase;
  };

  // Handle delete purchase
  const handleDeletePurchase = async (id: string) => {
    // This will be handled by the view sheet
    await refreshPurchases();
  };

  // Add console log for debugging
  console.log('TasksTabContent - Loading state:', {
    isLoading,
    purchasesLength: Array.isArray(purchases) ? purchases.length : 'not an array',
    purchasesNotFullyPaidLength: purchasesNotFullyPaid.length
  });

  // Add loading timeout to prevent infinite loading
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Set a timeout to exit loading state after 5 seconds
  useEffect(() => {
    if (isLoading && purchasesNotFullyPaid.length === 0) {
      const timer = setTimeout(() => {
        console.log('Loading timeout reached, forcing exit from loading state');
        setLoadingTimeout(true);
      }, 5000); // 5 seconds

      return () => clearTimeout(timer);
    }
  }, [isLoading, purchasesNotFullyPaid.length]);

  // Render loading state - only show if we don't have any data yet and timeout hasn't occurred
  if (isLoading && purchasesNotFullyPaid.length === 0 && !loadingTimeout) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Render empty state
  if (purchasesNotFullyPaid.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h3 className="text-lg font-medium mb-2">No Unpaid Purchases</h3>
        <p className="text-muted-foreground max-w-md">
          There are no material purchases that require payment.
        </p>
      </div>
    );
  }

  // Render main content
  return (
    <div className="space-y-4">
      {/* Filter Section */}
      <FilterSection
        filter={taskFilter}
        setFilter={setTaskFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterCounts={filterCounts}
        isDarkMode={isDarkMode}
      />

      {/* Date Groups */}
      <div className="space-y-8">
        {sortedDates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <h3 className="text-lg font-medium mb-2">No Matching Tasks</h3>
            <p className="text-muted-foreground max-w-md">
              There are no material purchases matching your current filters.
            </p>
          </div>
        ) : (
          sortedDates.map(dateKey => (
            <DateGroup
              key={dateKey}
              dateKey={dateKey}
              dateItems={filteredGroups[dateKey]}
              isDarkMode={isDarkMode}
              onViewPurchase={handleViewPurchase}
            />
          ))
        )}
      </div>

      {/* Material Purchase View Sheet */}
      {viewPurchase && (
        <MaterialPurchaseViewSheet
          purchase={viewPurchase}
          open={isViewOpen}
          onOpenChange={setIsViewOpen}
          onEdit={handleEditPurchase}
          onDelete={handleDeletePurchase}
        />
      )}
    </div>
  );
}
