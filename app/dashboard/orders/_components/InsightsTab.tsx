'use client';

import React, { useState, useMemo } from 'react';
import { formatDate } from '@/lib/utils';
import { useOrdersPage } from '../_context/OrdersPageContext';
import { useLoading } from '@/components/loading';
import { useOrders } from '@/hooks/useData';
import OrderAnalyticsCard from './OrderAnalyticsCard';
import ClientPerformanceCard from './ClientPerformanceCard';
import { formatCurrency } from '@/lib/utils';
import { shouldShowLoading, shouldShowEmptyState } from '@/lib/utils/loading-utils';
import {
  ShoppingBag,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  BarChart4
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
        avgFulfillmentTime: 0,
        unpaidTotal: 0,
        unpaidOrders: 0,
        clientsWithDebt: [],
        topClients: [],
        weeklyData: {
          days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          values: [0, 0, 0, 0, 0, 0, 0],
          average: 0,
          activeDay: 'Fri'
        },
        profitMargin: 0,
        repeatOrderRate: 0
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

    // Calculate average fulfillment time (in days)
    // This is a simplified calculation - in a real app, you'd calculate the time between order creation and completion
    const avgFulfillmentTime = 3.2; // Placeholder value

    // Calculate unpaid orders information
    const unpaidOrders = filteredOrders.filter(order =>
      order && (order.payment_status === 'unpaid' || order.payment_status === 'partially_paid'));

    const unpaidTotal = unpaidOrders.reduce((sum, order) =>
      sum + (order.balance || 0), 0);

    // Group orders by client to calculate client performance metrics
    const clientMap = new Map();
    filteredOrders.forEach(order => {
      if (!order.client_id || !order.client_name) return;

      const clientId = order.client_id;
      const currentClient = clientMap.get(clientId) || {
        id: clientId,
        name: order.client_name,
        totalSpent: 0,
        orderCount: 0,
        orders: [],
        lastOrderDate: null
      };

      currentClient.totalSpent += (order.total_amount || 0);
      currentClient.orderCount += 1;
      currentClient.orders.push(order);

      // Track the most recent order date
      const orderDate = new Date(order.date || new Date());
      if (!currentClient.lastOrderDate || orderDate > new Date(currentClient.lastOrderDate)) {
        currentClient.lastOrderDate = order.date;
      }

      clientMap.set(clientId, currentClient);
    });

    // Calculate additional client metrics and convert to array
    const clientsArray = Array.from(clientMap.values()).map(client => {
      // Calculate average order value for this client
      const avgOrderValue = client.totalSpent / client.orderCount;

      // Calculate a retention score (1-10) based on order frequency and recency
      // This is a simplified calculation - in a real app, you'd use more sophisticated metrics
      const daysSinceLastOrder = client.lastOrderDate ?
        Math.floor((new Date().getTime() - new Date(client.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)) : 100;

      const orderFrequencyScore = Math.min(10, client.orderCount);
      const recencyScore = daysSinceLastOrder < 30 ? 10 : daysSinceLastOrder < 60 ? 7 : daysSinceLastOrder < 90 ? 5 : 3;
      const retentionScore = Math.round((orderFrequencyScore + recencyScore) / 2);

      return {
        ...client,
        avgOrderValue,
        retentionScore
      };
    });

    // Sort clients by total spent (highest first) for top clients
    const topClients = [...clientsArray]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)
      .map(client => ({
        id: client.id,
        name: client.name,
        totalSpent: client.totalSpent,
        orderCount: client.orderCount,
        avgOrderValue: client.avgOrderValue,
        lastOrderDate: client.lastOrderDate || '',
        retentionScore: client.retentionScore
      }));

    // Sort clients by debt (highest first) for clients with debt
    const clientsWithDebt = [...clientsArray]
      .filter(client => {
        // Calculate total debt for this client
        const clientDebt = client.orders
          .filter(order => order.payment_status === 'unpaid' || order.payment_status === 'partially_paid')
          .reduce((sum, order) => sum + (order.balance || 0), 0);

        return clientDebt > 0;
      })
      .map(client => {
        // Calculate total debt for this client
        const clientDebt = client.orders
          .filter(order => order.payment_status === 'unpaid' || order.payment_status === 'partially_paid')
          .reduce((sum, order) => sum + (order.balance || 0), 0);

        return {
          id: client.id,
          name: client.name,
          debt: clientDebt,
          orderCount: client.orders
            .filter(order => order.payment_status === 'unpaid' || order.payment_status === 'partially_paid')
            .length
        };
      })
      .sort((a, b) => b.debt - a.debt)
      .slice(0, 5);

    // Calculate repeat order rate
    const clientsWithMultipleOrders = clientsArray.filter(client => client.orderCount > 1).length;
    const repeatOrderRate = clientsArray.length > 0 ?
      (clientsWithMultipleOrders / clientsArray.length) * 100 : 0;

    // Calculate estimated profit margin (placeholder - in a real app, you'd use actual cost data)
    const profitMargin = 32.5; // Placeholder value

    // Generate weekly data based on real orders
    const weeklyData = {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      values: [0, 0, 0, 0, 0, 0, 0],
      average: 0,
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

    // Calculate average orders per day
    weeklyData.average = weeklyData.values.reduce((sum, val) => sum + val, 0) / 7;

    return {
      totalOrders: filteredOrders.length,
      totalRevenue,
      avgOrderValue,
      pendingOrders,
      completedOrders,
      completionRate,
      avgFulfillmentTime,
      unpaidTotal,
      unpaidOrders: unpaidOrders.length,
      clientsWithDebt,
      topClients,
      weeklyData,
      profitMargin,
      repeatOrderRate
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
      label: "Avg Fulfillment",
      value: `${analytics.avgFulfillmentTime.toFixed(1)} days`,
      change: "-0.5 days",
      status: "Improving"
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
      label: "Profit Margin",
      value: `${analytics.profitMargin.toFixed(1)}%`,
      change: "+1.2%",
      status: "Above Target"
    },
    {
      label: "Collection Rate",
      value: analytics.unpaidTotal > 0 ?
        `${(100 - ((analytics.unpaidTotal / analytics.totalRevenue) * 100)).toFixed(1)}%` :
        "100%",
      change: "+3.5%",
      status: "Meeting Target"
    }
  ];

  // Client performance metrics
  const clientPerformanceMetrics = [
    {
      label: "Active Clients",
      value: analytics.topClients.length.toString(),
      change: "+2",
      status: "Growing"
    },
    {
      label: "Repeat Order Rate",
      value: `${analytics.repeatOrderRate.toFixed(1)}%`,
      change: "+4.3%",
      status: "Above Target"
    },
    {
      label: "Avg Client Value",
      value: analytics.topClients.length > 0 ?
        formatCurrency(analytics.totalRevenue / analytics.topClients.length) :
        formatCurrency(0),
      change: "+7.8%",
      status: "Growing"
    }
  ];

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



  // Get loading state and data from the orders hook directly
  const { isLoading: ordersLoading, orders: directOrders } = useOrders();

  // Use the loading provider for component-specific loading states
  const { loadingIds } = useLoading();

  // Track if we have any data at all (either from context or direct hook)
  const hasAnyData =
    (filteredOrders && filteredOrders.length > 0) ||
    (directOrders && directOrders.length > 0);

  // Combined loading state - show skeleton if either context loading or SWR loading is true
  const isLoading = loading || ordersLoading || loadingIds.has('orders');
  const isValidating = false; // We don't have isValidating from useOrders, so set to false

  // Track if we've attempted to load data
  const [dataAttempted, setDataAttempted] = useState(false);

  // Set dataAttempted to true once loading completes
  React.useEffect(() => {
    if (!isLoading && !dataAttempted) {
      setDataAttempted(true);
    }
  }, [isLoading, dataAttempted]);

  // Use our utility functions to determine what to show
  const showLoading = shouldShowLoading(isLoading, isValidating, hasAnyData ? [1] : [], dataAttempted);
  const showEmpty = shouldShowEmptyState(isLoading, hasAnyData ? [1] : [], dataAttempted);

  // Show loading state - but only if we're loading and haven't attempted to load data yet
  if (showLoading) {
    console.log('Showing analytics loading skeleton');
    return <AnalyticsCardSkeleton cards={3} />;
  }

  // Show empty state if we've attempted to load data but have no orders
  if (showEmpty) {
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
          {/* Client Performance Card */}
          <ClientPerformanceCard
            title="Client Performance"
            icon={<Users size={20} className="text-purple-500" />}
            accentColor="purple"
            total={analytics.topClients.length}
            change="+2"
            subtitle="active clients"
            categories={['Clients', 'Regular', 'Contract']}
            activeCategory={activeCategory}
            timeRange={timeRange}
            metrics={clientPerformanceMetrics}
            topClients={analytics.topClients}
            onCategoryChange={handleCategoryChange}
            onTimeRangeChange={handleTimeRangeChange}
            onViewMore={() => window.location.href = '/dashboard/clients'}
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
        </div>
      </div>
    </div>
  );
};

export default InsightsTab;
