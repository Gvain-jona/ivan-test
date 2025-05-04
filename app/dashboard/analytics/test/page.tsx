'use client';

import React, { useState } from 'react';
import { LineChartComponent } from '@/components/analytics/LineChartComponent';
import { BarChartComponent } from '@/components/analytics/BarChartComponent';
import { PieChartComponent } from '@/components/analytics/PieChartComponent';
import { KPICard } from '@/components/analytics/KPICard';
import { AnalyticsFilterBar } from '@/components/analytics/AnalyticsFilterBar';
import { DateRange } from '@/types/date-range';
import { subDays, format } from 'date-fns';
import {
  ShoppingCartIcon,
  BanknoteIcon,
  TrendingUpIcon,
  PercentIcon
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/chart-config';

export default function AnalyticsTestPage() {
  // Format date as YYYY-MM-DD
  const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

  // State for date range
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: formatDate(subDays(new Date(), 29)),
    endDate: formatDate(new Date()),
  });

  // State for compare range
  const [compareRange, setCompareRange] = useState<DateRange | undefined>(undefined);

  // State for filters
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Sample data for charts
  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Revenue',
        data: [1200, 1900, 3000, 5000, 4000, 6000, 7000, 6500, 8000, 8500, 9000, 9500],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
      },
      {
        label: 'Profit',
        data: [500, 800, 1200, 2000, 1800, 2500, 3000, 2800, 3500, 3800, 4000, 4200],
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
      },
    ],
  };

  const barChartData = {
    labels: ['Client A', 'Client B', 'Client C', 'Client D', 'Client E'],
    datasets: [
      {
        label: 'Revenue',
        data: [12000, 9000, 7500, 6000, 5000],
        backgroundColor: '#3b82f6',
      },
    ],
  };

  const pieChartData = {
    labels: ['Printing', 'Design', 'Packaging', 'Delivery', 'Other'],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          '#3b82f6',
          '#22c55e',
          '#f97316',
          '#a855f7',
          '#ef4444',
        ],
        borderWidth: 1,
        borderColor: 'rgb(var(--background))',
      },
    ],
  };

  // Sample category options
  const categoryOptions = [
    { label: 'Printing', value: 'printing' },
    { label: 'Design', value: 'design' },
    { label: 'Packaging', value: 'packaging' },
    { label: 'Delivery', value: 'delivery' },
  ];

  // Sample status options
  const statusOptions = [
    { label: 'Completed', value: 'completed' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Pending', value: 'pending' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Test Page</h1>
        <p className="text-muted-foreground mt-1">Testing the analytics components</p>
      </div>

      <AnalyticsFilterBar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        compareRange={compareRange}
        onCompareRangeChange={setCompareRange}
        showCompare={true}
        categoryOptions={categoryOptions}
        selectedCategory={categoryFilter}
        onCategoryChange={setCategoryFilter}
        statusOptions={statusOptions}
        selectedStatus={statusFilter}
        onStatusChange={setStatusFilter}
        onRefresh={() => console.log('Refreshing data...')}
        onExport={(format) => console.log(`Exporting as ${format}...`)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value={formatCurrency(125000)}
          change={12.5}
          changeLabel="vs. previous period"
          icon={<BanknoteIcon className="h-5 w-5 text-blue-500" />}
          iconClassName="bg-blue-100 dark:bg-blue-900/20"
        />

        <KPICard
          title="Total Orders"
          value={formatNumber(256)}
          change={8.3}
          changeLabel="vs. previous period"
          icon={<ShoppingCartIcon className="h-5 w-5 text-purple-500" />}
          iconClassName="bg-purple-100 dark:bg-purple-900/20"
        />

        <KPICard
          title="Total Profit"
          value={formatCurrency(45000)}
          change={15.2}
          changeLabel="vs. previous period"
          icon={<TrendingUpIcon className="h-5 w-5 text-green-500" />}
          iconClassName="bg-green-100 dark:bg-green-900/20"
        />

        <KPICard
          title="Profit Margin"
          value={formatPercentage(36)}
          change={2.5}
          changeLabel="vs. previous period"
          icon={<PercentIcon className="h-5 w-5 text-orange-500" />}
          iconClassName="bg-orange-100 dark:bg-orange-900/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <LineChartComponent
          title="Revenue & Profit Trends"
          description="Monthly data for the current year"
          data={lineChartData}
          className="lg:col-span-2"
          height={300}
          fillArea={true}
          options={{
            scales: {
              y: {
                ticks: {
                  callback: (value) => formatCurrency(Number(value)),
                },
              },
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const value = context.raw as number;
                    return `${context.dataset.label}: ${formatCurrency(value)}`;
                  },
                },
              },
            },
          }}
        />

        <PieChartComponent
          title="Revenue by Category"
          description="Distribution of revenue by category"
          data={pieChartData}
          height={300}
          type="doughnut"
          options={{
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const value = context.raw as number;
                    return `${context.label}: ${value}%`;
                  },
                },
              },
            },
          }}
        />
      </div>

      <BarChartComponent
        title="Top Clients by Revenue"
        description="Showing top 5 clients"
        data={barChartData}
        height={300}
        options={{
          scales: {
            y: {
              ticks: {
                callback: (value) => formatCurrency(Number(value)),
              },
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.raw as number;
                  return `${context.dataset.label}: ${formatCurrency(value)}`;
                },
              },
            },
          },
        }}
      />
    </div>
  );
}
