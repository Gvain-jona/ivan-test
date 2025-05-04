'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DateRange } from '@/types/date-range';
import { subDays, format } from 'date-fns';

export type AnalyticsTab = 'overview' | 'orders' | 'expenses' | 'materials' | 'financials';

export type AnalyticsTimeframe = 'day' | 'week' | 'month' | 'year';

interface AnalyticsContextType {
  // Date ranges
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  compareRange: DateRange | undefined;
  setCompareRange: (range: DateRange | undefined) => void;
  showCompare: boolean;
  setShowCompare: (show: boolean) => void;

  // Tab navigation
  activeTab: AnalyticsTab;
  setActiveTab: (tab: AnalyticsTab) => void;

  // Filters
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;

  // Timeframe for charts
  timeframe: AnalyticsTimeframe;
  setTimeframe: (timeframe: AnalyticsTimeframe) => void;

  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Refresh trigger
  refreshTrigger: number;
  refreshData: () => void;
}

// Format date as YYYY-MM-DD
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const defaultDateRange: DateRange = {
  startDate: formatDate(subDays(new Date(), 29)),
  endDate: formatDate(new Date()),
};

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  // Date ranges
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);
  const [compareRange, setCompareRange] = useState<DateRange | undefined>(undefined);
  const [showCompare, setShowCompare] = useState<boolean>(false);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Timeframe for charts
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('month');

  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Reset filters when tab changes
  useEffect(() => {
    setCategoryFilter('all');
    setStatusFilter('all');
  }, [activeTab]);

  const value = {
    dateRange,
    setDateRange,
    compareRange,
    setCompareRange,
    showCompare,
    setShowCompare,
    activeTab,
    setActiveTab,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    timeframe,
    setTimeframe,
    isLoading,
    setIsLoading,
    refreshTrigger,
    refreshData,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext);

  if (context === undefined) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }

  return context;
}
