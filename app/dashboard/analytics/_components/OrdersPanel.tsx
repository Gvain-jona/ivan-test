'use client';

import React from 'react';
import { KPICard } from '@/components/analytics/KPICard';
import { LineChartComponent } from '@/components/analytics/LineChartComponent';
import { BarChartComponent } from '@/components/analytics/BarChartComponent';
import { PieChartComponent } from '@/components/analytics/PieChartComponent';
import { useAnalyticsContext } from '../_context/AnalyticsContext';
import { useRevenueByPeriod, useClientPerformance, useCategoryPerformance } from '@/hooks/analytics/useAnalytics';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/chart-config';
import { 
  ShoppingCartIcon, 
  UsersIcon, 
  TagIcon, 
  ClockIcon 
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function OrdersPanel() {
  const { dateRange, timeframe, categoryFilter, statusFilter, setIsLoading } = useAnalyticsContext();
  
  // Fetch revenue by period
  const { 
    data: revenueData, 
    isLoading: isLoadingRevenue 
  } = useRevenueByPeriod(timeframe, dateRange);
  
  // Fetch client performance
  const { 
    clients: clientPerformance, 
    isLoading: isLoadingClients 
  } = useClientPerformance(dateRange, 10);
  
  // Fetch category performance
  const { 
    categories: categoryPerformance, 
    isLoading: isLoadingCategories 
  } = useCategoryPerformance(dateRange);
  
  // Update loading state
  React.useEffect(() => {
    setIsLoading(
      isLoadingRevenue || 
      isLoadingClients || 
      isLoadingCategories
    );
  }, [
    isLoadingRevenue, 
    isLoadingClients, 
    isLoadingCategories, 
    setIsLoading
  ]);
  
  // Calculate summary metrics
  const summaryMetrics = React.useMemo(() => {
    if (!revenueData || revenueData.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        ordersPerDay: 0
      };
    }
    
    const totalOrders = revenueData.reduce((sum, item) => sum + item.total_orders, 0);
    const totalRevenue = revenueData.reduce((sum, item) => sum + item.total_revenue, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const dayCount = revenueData.length;
    const ordersPerDay = dayCount > 0 ? totalOrders / dayCount : 0;
    
    return {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      ordersPerDay
    };
  }, [revenueData]);
  
  // Prepare revenue chart data
  const revenueChartData = React.useMemo(() => {
    if (!revenueData) return { labels: [], datasets: [] };
    
    // Format labels based on timeframe
    const formatLabel = (period: string) => {
      try {
        const date = new Date(period);
        switch (timeframe) {
          case 'day':
            return format(date, 'MMM d');
          case 'week':
            return `Week ${format(date, 'w')}`;
          case 'month':
            return format(date, 'MMM yyyy');
          case 'year':
            return format(date, 'yyyy');
          default:
            return period;
        }
      } catch (error) {
        return period;
      }
    };
    
    return {
      labels: revenueData.map(item => formatLabel(item.period)),
      datasets: [
        {
          label: 'Revenue',
          data: revenueData.map(item => item.total_revenue),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
        },
        {
          label: 'Orders',
          data: revenueData.map(item => item.total_orders * 10000), // Scale for visibility
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          yAxisID: 'y1',
        },
      ],
    };
  }, [revenueData, timeframe]);
  
  // Prepare client performance chart data
  const clientPerformanceData = React.useMemo(() => {
    if (!clientPerformance) return { labels: [], datasets: [] };
    
    return {
      labels: clientPerformance.map(client => client.client_name),
      datasets: [
        {
          label: 'Revenue',
          data: clientPerformance.map(client => client.total_revenue),
          backgroundColor: '#3b82f6',
        },
      ],
    };
  }, [clientPerformance]);
  
  // Prepare category performance chart data
  const categoryPerformanceData = React.useMemo(() => {
    if (!categoryPerformance) return { labels: [], datasets: [] };
    
    return {
      labels: categoryPerformance.map(category => category.category_name),
      datasets: [
        {
          data: categoryPerformance.map(category => category.total_revenue),
          backgroundColor: [
            '#3b82f6',
            '#22c55e',
            '#f97316',
            '#a855f7',
            '#ef4444',
            '#eab308',
          ],
          borderWidth: 1,
          borderColor: 'rgb(var(--background))',
        },
      ],
    };
  }, [categoryPerformance]);
  
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Orders"
          value={formatNumber(summaryMetrics.totalOrders)}
          icon={<ShoppingCartIcon className="h-5 w-5 text-purple-500" />}
          isLoading={isLoadingRevenue}
          iconClassName="bg-purple-100 dark:bg-purple-900/20"
        />
        
        <KPICard
          title="Total Revenue"
          value={formatCurrency(summaryMetrics.totalRevenue)}
          icon={<TagIcon className="h-5 w-5 text-blue-500" />}
          isLoading={isLoadingRevenue}
          iconClassName="bg-blue-100 dark:bg-blue-900/20"
        />
        
        <KPICard
          title="Average Order Value"
          value={formatCurrency(summaryMetrics.avgOrderValue)}
          icon={<TagIcon className="h-5 w-5 text-green-500" />}
          isLoading={isLoadingRevenue}
          iconClassName="bg-green-100 dark:bg-green-900/20"
        />
        
        <KPICard
          title="Orders Per Day"
          value={formatNumber(summaryMetrics.ordersPerDay)}
          icon={<ClockIcon className="h-5 w-5 text-orange-500" />}
          isLoading={isLoadingRevenue}
          iconClassName="bg-orange-100 dark:bg-orange-900/20"
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChartComponent
          title="Revenue & Order Trends"
          description={`Showing data by ${timeframe}`}
          data={revenueChartData}
          isLoading={isLoadingRevenue}
          height={300}
          fillArea={true}
          options={{
            scales: {
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                ticks: {
                  callback: (value) => formatCurrency(Number(value)),
                },
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: {
                  drawOnChartArea: false,
                },
                ticks: {
                  callback: (value) => formatNumber(Number(value) / 10000), // Unscale for display
                },
              },
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const value = context.raw as number;
                    if (context.dataset.label === 'Orders') {
                      return `${context.dataset.label}: ${formatNumber(value / 10000)}`; // Unscale for display
                    }
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
          data={categoryPerformanceData}
          isLoading={isLoadingCategories}
          height={300}
          type="doughnut"
          options={{
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const value = context.raw as number;
                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                  },
                },
              },
            },
          }}
        />
      </div>
      
      {/* Top Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Clients by Revenue</CardTitle>
          <CardDescription>Showing the top 10 clients by revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Avg. Order Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingClients ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-4 w-12 bg-muted rounded animate-pulse ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-4 w-20 bg-muted rounded animate-pulse ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-4 w-16 bg-muted rounded animate-pulse ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : clientPerformance && clientPerformance.length > 0 ? (
                clientPerformance.map((client, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{client.client_name}</TableCell>
                    <TableCell className="text-right">{formatNumber(client.total_orders)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(client.total_revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(client.average_order_value)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                    No client data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
          <CardDescription>Performance metrics by category</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingCategories ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-4 w-12 bg-muted rounded animate-pulse ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-4 w-12 bg-muted rounded animate-pulse ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-4 w-20 bg-muted rounded animate-pulse ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-4 w-20 bg-muted rounded animate-pulse ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-4 w-16 bg-muted rounded animate-pulse ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : categoryPerformance && categoryPerformance.length > 0 ? (
                categoryPerformance.map((category, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{category.category_name}</TableCell>
                    <TableCell className="text-right">{formatNumber(category.order_count)}</TableCell>
                    <TableCell className="text-right">{formatNumber(category.item_count)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(category.total_revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(category.total_profit)}</TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant={category.profit_margin >= 30 ? "success" : category.profit_margin >= 15 ? "warning" : "destructive"}
                        className="ml-auto"
                      >
                        {formatPercentage(category.profit_margin)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                    No category data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
