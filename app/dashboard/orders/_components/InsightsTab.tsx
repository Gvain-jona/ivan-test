'use client';

import React, { useState, useMemo } from 'react';
import { formatDate } from '@/lib/utils';
import { useOrdersPage } from '../_context/OrdersPageContext';
import { useLoading } from '@/components/loading';
import { useOrders } from '@/hooks/useData';
import OrderAnalyticsCard from './OrderAnalyticsCard';
import PendingInvoicesPanel from './PendingInvoicesPanel';
import { formatCurrency } from '@/lib/utils';
import {
  ShoppingBag,
  DollarSign,
  Users
} from 'lucide-react';
import { LoadingState, AnalyticsCardSkeleton } from '@/components/ui/loading-states';
import { EmptyState } from '@/components/ui/error-states';

/**
 * InsightsTab component for displaying analytics and insights about orders
 */
const InsightsTab: React.FC = () => {
  const {
    filteredOrders,
    loading,
  } = useOrdersPage();

  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('weekly');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

  // Calculate order analytics
  const calculateOrderAnalytics = () => {
    if (!filteredOrders || filteredOrders.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        pendingOrders: 0,
        completedOrders: 0,
        completionRate: 0,
        responseTime: '0m',
        avgResolutionTime: '0m',
        customerSatisfaction: '0/5',
        unpaidTotal: 0,
        unpaidOrders: 0,
        clientsWithDebt: [],
        weeklyData: {
          days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          values: [0, 0, 0, 0, 0, 0, 0],
          target: 30,
          activeDay: 'Fri'
        }
      };
    }

    // Calculate total revenue
    const totalRevenue = filteredOrders.reduce((sum, order) =>
      sum + (typeof order.total_amount === 'number' ? order.total_amount : 0), 0);

    // Calculate average order value
    const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

    // Count orders by status
    const pendingOrders = filteredOrders.filter(order =>
      order && (order.status === 'pending' || order.status === 'in_progress')).length;

    const completedOrders = filteredOrders.filter(order =>
      order && order.status === 'completed').length;

    // Calculate completion rate
    const completionRate = filteredOrders.length > 0
      ? (completedOrders / filteredOrders.length) * 100
      : 0;

    // Calculate unpaid orders information
    const unpaidOrders = filteredOrders.filter(order =>
      order && (order.payment_status === 'unpaid' || order.payment_status === 'partially_paid'));

    const unpaidTotal = unpaidOrders.reduce((sum, order) =>
      sum + (order.balance || 0), 0);

    // Group unpaid orders by client
    const clientDebtMap = new Map();
    unpaidOrders.forEach(order => {
      if (!order.client_id || !order.client_name) return;

      const clientId = order.client_id;
      const currentDebt = clientDebtMap.get(clientId) || {
        id: clientId,
        name: order.client_name,
        debt: 0,
        orderCount: 0
      };

      currentDebt.debt += (order.balance || 0);
      currentDebt.orderCount += 1;
      clientDebtMap.set(clientId, currentDebt);
    });

    // Convert to array and sort by debt amount (highest first)
    const clientsWithDebt = Array.from(clientDebtMap.values())
      .sort((a, b) => b.debt - a.debt)
      .slice(0, 5); // Top 5 clients with debt

    // Generate weekly data based on real orders
    const weeklyData = {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      values: [0, 0, 0, 0, 0, 0, 0],
      target: 30,
      activeDay: 'Fri'
    };

    // Count orders by day of week
    filteredOrders.forEach(order => {
      if (!order.date) return;

      const orderDate = new Date(order.date);
      const dayOfWeek = orderDate.getDay(); // 0 = Sunday, 1 = Monday, ...
      const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to 0 = Monday, ..., 6 = Sunday

      weeklyData.values[dayIndex]++;
    });

    return {
      totalOrders: filteredOrders.length,
      totalRevenue,
      avgOrderValue,
      pendingOrders,
      completedOrders,
      completionRate,
      // No mock data for these metrics
      unpaidTotal,
      unpaidOrders: unpaidOrders.length,
      clientsWithDebt,
      weeklyData
    };
  };

  const analytics = calculateOrderAnalytics();

  // Order analytics metrics
  const orderMetrics = [
    {
      label: "Pending Orders",
      value: analytics.pendingOrders.toString(),
      change: analytics.pendingOrders > 0 ? `${((analytics.pendingOrders / analytics.totalOrders) * 100).toFixed(1)}%` : "0%",
      status: "Needs Attention"
    },
    {
      label: "Completed Orders",
      value: analytics.completedOrders.toString(),
      change: analytics.completedOrders > 0 ? `${((analytics.completedOrders / analytics.totalOrders) * 100).toFixed(1)}%` : "0%",
      status: "Meeting Target"
    },
    {
      label: "Completion Rate",
      value: `${analytics.completionRate.toFixed(1)}%`,
      change: "+2.3%",
      status: "Above Target"
    }
  ];

  // Revenue analytics metrics
  const revenueMetrics = [
    {
      label: "Avg Order Value",
      value: formatCurrency(analytics.avgOrderValue),
      change: "+5.7%",
      status: "Above Target"
    },
    {
      label: "Total Revenue",
      value: formatCurrency(analytics.totalRevenue),
      change: "+8.2%",
      status: "Above Target"
    },
    {
      label: "Orders Count",
      value: analytics.totalOrders.toString(),
      change: "+3.5%",
      status: "Meeting Target"
    }
  ];

  // Pending invoices metrics
  const pendingInvoicesMetrics = [
    {
      label: "Unpaid Orders",
      value: analytics.unpaidOrders.toString(),
      change: "+3.2%",
      status: "Needs Attention"
    },
    {
      label: "Total Unpaid Amount",
      value: formatCurrency(analytics.unpaidTotal),
      change: "+5.7%",
      status: "Above Target"
    },
    {
      label: "Avg. Debt per Client",
      value: analytics.clientsWithDebt.length > 0
        ? formatCurrency(analytics.unpaidTotal / analytics.clientsWithDebt.length)
        : formatCurrency(0),
      change: "+2.1%",
      status: "Needs Follow-up"
    }
  ];

  // Generate real pending invoices data from unpaid orders
  const pendingInvoicesData = useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) {
      return [];
    }

    return filteredOrders
      .filter(order => order.payment_status === 'unpaid' || order.payment_status === 'partially_paid')
      .map(order => ({
        id: order.id,
        clientName: order.client_name || 'Unknown Client',
        amount: order.balance || 0,
        dueDate: order.date || formatDate(new Date()),
        status: order.payment_status === 'unpaid' ? 'pending' : 'partially_paid'
      }))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 7); // Limit to 7 items
  }, [filteredOrders]);

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  // Handle time range change
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range as any);
    console.log(`Time range changed to: ${range}`);
    // Here you would typically fetch data for the selected time range
  };

  // Handle opening the pending invoices panel
  const handleOpenPanel = () => {
    setIsPanelOpen(true);
  };

  // Get loading state and data from the orders hook directly
  const { isLoading: ordersLoading, orders: directOrders } = useOrders();

  // Use the loading provider for component-specific loading states
  const { loadingIds } = useLoading();

  // Combined loading state - show skeleton if either context loading or SWR loading is true
  const isLoading = loading || ordersLoading || loadingIds.has('orders');

  // Track if we have any data at all (either from context or direct hook)
  const hasAnyData =
    (filteredOrders && filteredOrders.length > 0) ||
    (directOrders && directOrders.length > 0);

  // Track if we've attempted to load data
  const [dataAttempted, setDataAttempted] = useState(false);

  // Set dataAttempted to true once loading completes
  React.useEffect(() => {
    if (!isLoading && !dataAttempted) {
      setDataAttempted(true);
    }
  }, [isLoading, dataAttempted]);

  // Show loading state - but only if we're loading and haven't attempted to load data yet
  if (isLoading && !hasAnyData && !dataAttempted) {
    console.log('Showing analytics loading skeleton');
    return <AnalyticsCardSkeleton cards={3} />;
  }

  // Show empty state if we've attempted to load data but have no orders
  if ((!isLoading || dataAttempted) && !hasAnyData) {
    console.log('Showing analytics empty state');
    return (
      <EmptyState
        title="No order data available"
        description="There are no orders to analyze. Create some orders to see insights."
      />
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
          {/* Pending Invoices Panel */}
          <PendingInvoicesPanel
            open={isPanelOpen}
            onOpenChange={setIsPanelOpen}
            pendingInvoices={pendingInvoicesData}
          />
          {/* Order Analytics Card */}
          <OrderAnalyticsCard
            title="Order Analytics"
            icon={<ShoppingBag size={20} className="text-orange-500" />}
            accentColor="orange"
            total={analytics.totalOrders}
            change="+5.4%"
            subtitle="total orders"
            categories={['All', 'Pending', 'Completed', 'Cancelled']}
            activeCategory={activeCategory}
            timeRange={timeRange}
            metrics={orderMetrics}
            weeklyData={analytics.weeklyData}
            onCategoryChange={handleCategoryChange}
            onTimeRangeChange={handleTimeRangeChange}
          />

          {/* Revenue Analytics Card */}
          <OrderAnalyticsCard
            title="Revenue Analytics"
            icon={<DollarSign size={20} className="text-blue-500" />}
            accentColor="blue"
            total={formatCurrency(analytics.totalRevenue)}
            change="+8.2%"
            subtitle="total revenue"
            categories={['All Revenue', 'Paid', 'Pending', 'Overdue']}
            activeCategory={activeCategory}
            timeRange={timeRange}
            metrics={revenueMetrics}
            weeklyData={analytics.weeklyData}
            onCategoryChange={handleCategoryChange}
            onTimeRangeChange={handleTimeRangeChange}
          />

          {/* Pending Invoices Card */}
          <OrderAnalyticsCard
            title="Pending Invoices"
            icon={<Users size={20} className="text-green-500" />}
            accentColor="green"
            total={formatCurrency(analytics.unpaidTotal)}
            change="+3.7%"
            subtitle="unpaid balance"
            categories={['All Clients', 'Regular', 'Contract']}
            activeCategory={activeCategory}
            timeRange={timeRange}
            metrics={pendingInvoicesMetrics}
            weeklyData={analytics.weeklyData}
            clientsWithDebt={analytics.clientsWithDebt}
            pendingInvoices={pendingInvoicesData}
            onCategoryChange={handleCategoryChange}
            onTimeRangeChange={handleTimeRangeChange}
            onViewMore={handleOpenPanel}
          />
        </div>
      </div>
    </div>
  );
};

export default InsightsTab;
