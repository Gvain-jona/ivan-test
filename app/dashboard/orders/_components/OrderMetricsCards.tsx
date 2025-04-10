'use client';

import React from 'react';
import {
  Package,
  Users,
  Clock,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { formatCurrency, formatNumber } from '../../../lib/utils';
import { METRICS_DATA } from '../_data/metrics-data';

interface OrderMetricsCardsProps {
  stats?: typeof METRICS_DATA;
  isLoading?: boolean;
  onFilterByStatus?: (status?: string[]) => void;
}

/**
 * Grid of metric cards displaying order statistics
 */
const OrderMetricsCards: React.FC<OrderMetricsCardsProps> = ({
  stats = METRICS_DATA,
  isLoading = false,
  onFilterByStatus
}) => {
  // Handle card clicks to filter orders
  const handleTotalOrdersClick = () => {
    if (onFilterByStatus) onFilterByStatus(undefined); // Show all orders
  };

  const handlePendingOrdersClick = () => {
    if (onFilterByStatus) onFilterByStatus(['pending', 'in_progress', 'draft']);
  };

  const handleRevenueClick = () => {
    if (onFilterByStatus) onFilterByStatus(['completed', 'delivered']);
  };

  const handleActiveClientsClick = () => {
    // This would typically filter by client, but we'll just show all orders
    if (onFilterByStatus) onFilterByStatus(undefined);
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Orders Card */}
      <Card
        className="bg-popover backdrop-blur-md hover:bg-popover/90 border border-border/40 shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all duration-200 cursor-pointer rounded-xl"
        onClick={handleTotalOrdersClick}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-400/10 dark:to-blue-500/5 rounded-full flex items-center justify-center shadow-md ring-1 ring-blue-200/50 dark:ring-blue-500/30">
            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400 drop-shadow-sm" strokeWidth={1.5} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-7 w-16 bg-muted/20" />
          ) : (
            <>
              <div className="text-2xl font-bold">{formatNumber(stats.totalOrders)}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+12% from last month</span>
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Revenue Card */}
      <Card
        className="bg-popover backdrop-blur-md hover:bg-popover/90 border border-border/40 shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all duration-200 cursor-pointer rounded-xl"
        onClick={handleRevenueClick}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
          <div className="w-11 h-11 bg-gradient-to-br from-green-500/10 to-green-600/5 dark:from-green-400/10 dark:to-green-500/5 rounded-full flex items-center justify-center shadow-md ring-1 ring-green-200/50 dark:ring-green-500/30">
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400 drop-shadow-sm" strokeWidth={1.5} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-7 w-24 bg-muted/20" />
          ) : (
            <>
              <div className="text-2xl font-bold">{formatCurrency(stats.revenue)}</div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+8.5% from last month</span>
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Active Clients Card */}
      <Card
        className="bg-popover backdrop-blur-md hover:bg-popover/90 border border-border/40 shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all duration-200 cursor-pointer rounded-xl"
        onClick={handleActiveClientsClick}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Clients</CardTitle>
          <div className="w-11 h-11 bg-gradient-to-br from-purple-500/10 to-purple-600/5 dark:from-purple-400/10 dark:to-purple-500/5 rounded-full flex items-center justify-center shadow-md ring-1 ring-purple-200/50 dark:ring-purple-500/30">
            <Users className="h-5 w-5 text-purple-600 dark:text-purple-400 drop-shadow-sm" strokeWidth={1.5} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-7 w-16 bg-muted/20" />
          ) : (
            <>
              <div className="text-2xl font-bold">{formatNumber(stats.activeClients)}</div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+4.2% from last month</span>
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pending Orders Card */}
      <Card
        className="bg-popover backdrop-blur-md hover:bg-popover/90 border border-border/40 shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all duration-200 cursor-pointer rounded-xl"
        onClick={handlePendingOrdersClick}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
          <div className="w-11 h-11 bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-amber-400/10 dark:to-amber-500/5 rounded-full flex items-center justify-center shadow-md ring-1 ring-amber-200/50 dark:ring-amber-500/30">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 drop-shadow-sm" strokeWidth={1.5} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-7 w-16 bg-muted/20" />
          ) : (
            <>
              <div className="text-2xl font-bold">{formatNumber(stats.pendingOrders)}</div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+2 new today</span>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderMetricsCards;