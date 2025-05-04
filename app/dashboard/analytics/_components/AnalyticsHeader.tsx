'use client';

import React from 'react';
import { DateRangeAdapter } from '@/components/analytics/DateRangeAdapter';
import { useAnalyticsContext } from '../_context/AnalyticsContext';
import {
  BarChart3Icon,
  ShoppingCartIcon,
  BanknoteIcon,
  PackageIcon,
  LineChartIcon,
  FilterIcon
} from 'lucide-react';

export function AnalyticsHeader() {
  const {
    activeTab,
    setActiveTab,
    dateRange,
    setDateRange,
    compareRange,
    setCompareRange,
    showCompare,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    isLoading,
    refreshData,
  } = useAnalyticsContext();

  // Category options based on active tab
  const getCategoryOptions = () => {
    switch (activeTab) {
      case 'orders':
        return [
          { label: 'Completed', value: 'completed' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Pending', value: 'pending' },
        ];
      case 'expenses':
        return [
          { label: 'Fixed', value: 'fixed' },
          { label: 'Variable', value: 'variable' },
        ];
      case 'materials':
        return [
          { label: 'Paper', value: 'paper' },
          { label: 'Ink', value: 'ink' },
          { label: 'Equipment', value: 'equipment' },
          { label: 'Other', value: 'other' },
        ];
      default:
        return [];
    }
  };

  // Status options based on active tab
  const getStatusOptions = () => {
    switch (activeTab) {
      case 'orders':
        return [
          { label: 'Paid', value: 'paid' },
          { label: 'Partially Paid', value: 'partially_paid' },
          { label: 'Unpaid', value: 'unpaid' },
        ];
      case 'expenses':
        return [
          { label: 'Paid', value: 'paid' },
          { label: 'Unpaid', value: 'unpaid' },
        ];
      case 'materials':
        return [
          { label: 'Paid', value: 'paid' },
          { label: 'Partially Paid', value: 'partially_paid' },
          { label: 'Unpaid', value: 'unpaid' },
        ];
      default:
        return [];
    }
  };

  // Handle filter click
  const handleFilterClick = () => {
    // Show filter dialog or toggle filter panel
    console.log('Filter button clicked');
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
      </div>

      <div className="w-full mb-4 border-b-2 border-border pb-2">
        <div className="flex justify-between items-center flex-wrap gap-y-3">
          <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1 py-1 px-3 font-medium text-sm transition-all border rounded-md h-9 ${
              activeTab === 'overview'
                ? 'border-foreground text-background bg-foreground font-semibold'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground'
            }`}
          >
            <BarChart3Icon className={`h-4 w-4 ${activeTab === 'overview' ? 'text-background' : ''}`} />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1 py-1 px-3 font-medium text-sm transition-all border rounded-md h-9 ${
              activeTab === 'orders'
                ? 'border-foreground text-background bg-foreground font-semibold'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground'
            }`}
          >
            <ShoppingCartIcon className={`h-4 w-4 ${activeTab === 'orders' ? 'text-background' : ''}`} />
            <span>Orders</span>
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex items-center gap-1 py-1 px-3 font-medium text-sm transition-all border rounded-md h-9 ${
              activeTab === 'expenses'
                ? 'border-foreground text-background bg-foreground font-semibold'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground'
            }`}
          >
            <BanknoteIcon className={`h-4 w-4 ${activeTab === 'expenses' ? 'text-background' : ''}`} />
            <span>Expenses</span>
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-1 py-1 px-3 font-medium text-sm transition-all border rounded-md h-9 ${
              activeTab === 'materials'
                ? 'border-foreground text-background bg-foreground font-semibold'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground'
            }`}
          >
            <PackageIcon className={`h-4 w-4 ${activeTab === 'materials' ? 'text-background' : ''}`} />
            <span>Materials</span>
          </button>
          <button
            onClick={() => setActiveTab('financials')}
            className={`flex items-center gap-1 py-1 px-3 font-medium text-sm transition-all border rounded-md h-9 ${
              activeTab === 'financials'
                ? 'border-foreground text-background bg-foreground font-semibold'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground'
            }`}
          >
            <LineChartIcon className={`h-4 w-4 ${activeTab === 'financials' ? 'text-background' : ''}`} />
            <span>Financials</span>
          </button>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <DateRangeAdapter
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              showCompare={false}
            />
            <button
              onClick={handleFilterClick}
              className="flex items-center gap-1 py-1 px-3 font-medium text-sm border border-border rounded-md h-9 transition-all hover:border-foreground"
            >
              <FilterIcon className="h-4 w-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
