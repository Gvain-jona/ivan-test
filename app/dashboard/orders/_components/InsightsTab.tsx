'use client';

import React, { useState } from 'react';
import { useOrdersPage } from '../_context/OrdersPageContext';
import OrderAnalyticsCard from './OrderAnalyticsCard';
import PendingInvoicesPanel from './PendingInvoicesPanel';
import { formatCurrency } from '@/lib/utils';
import {
  ShoppingBag,
  DollarSign,
  Users
} from 'lucide-react';

/**
 * InsightsTab component for displaying analytics and insights about orders
 */
const InsightsTab: React.FC = () => {
  const {
    filteredOrders,
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

    // Generate weekly data (simplified for demo)
    const weeklyData = {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      values: [30, 45, 60, 75, 90, 40, 35],
      target: 30,
      activeDay: 'Fri'
    };

    return {
      totalOrders: filteredOrders.length,
      totalRevenue,
      avgOrderValue,
      pendingOrders,
      completedOrders,
      completionRate,
      responseTime: '15m',
      avgResolutionTime: '48m',
      customerSatisfaction: '4.8/5',
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
      label: "First response time",
      value: "15m",
      change: "-22%",
      status: "Below Target"
    },
    {
      label: "Avg Resolution Time",
      value: "48m",
      change: "-18%",
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
      label: "Conversion Rate",
      value: "3.8%",
      change: "+0.5%",
      status: "Meeting Target"
    },
    {
      label: "Return Rate",
      value: "2.1%",
      change: "-0.8%",
      status: "Below Target"
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

  // Mock data for pending invoices
  const pendingInvoicesData = [
    { id: '1', clientName: 'John Doe', amount: 450000, dueDate: '2023-12-15', status: 'pending' as const },
    { id: '2', clientName: 'Jane Smith', amount: 780000, dueDate: '2023-12-18', status: 'pending' as const },
    { id: '3', clientName: 'Robert Johnson', amount: 320000, dueDate: '2023-12-20', status: 'pending' as const },
    { id: '4', clientName: 'Emily Davis', amount: 560000, dueDate: '2023-12-22', status: 'delivered' as const },
    { id: '5', clientName: 'Michael Wilson', amount: 890000, dueDate: '2023-12-25', status: 'delivered' as const },
    { id: '6', clientName: 'Sarah Brown', amount: 230000, dueDate: '2023-12-28', status: 'not_delivered' as const },
    { id: '7', clientName: 'David Miller', amount: 670000, dueDate: '2023-12-30', status: 'not_delivered' as const }
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

  // Handle opening the pending invoices panel
  const handleOpenPanel = () => {
    setIsPanelOpen(true);
  };

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
            weeklyData={{
              days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              values: [30, 45, 60, 75, 90, 40, 35],
              average: 54, // Average of the values
              activeDay: 'Fri'
            }}
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
            weeklyData={{
              days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              values: [2100, 2300, 2500, 2700, 3100, 2900, 2400],
              average: 2571, // Average of the values
              activeDay: 'Fri'
            }}
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
            weeklyData={{
              days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              values: [85, 110, 95, 120, 150, 130, 90],
              average: 111, // Average of the values
              activeDay: 'Fri'
            }}
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
