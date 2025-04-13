'use client';

import React from 'react';
import {
  Package,
  Users,
  Clock,
  DollarSign,
  CheckSquare,
  ArrowUpIcon,
  Activity
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { formatCurrency, formatNumber } from '../../../lib/utils';
import { HOME_METRICS_DATA } from '../_data/home-data';

interface HomeMetricsCardsProps {
  metrics?: typeof HOME_METRICS_DATA;
  isLoading?: boolean;
}

/**
 * Grid of metric cards displaying home dashboard statistics
 */
const HomeMetricsCards: React.FC<HomeMetricsCardsProps> = ({
  metrics = HOME_METRICS_DATA,
  isLoading = false
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Orders Card */}
      <Card className="bg-transparent border-[hsl(var(--border))]/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
          <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
            <Package className="h-4 w-4 text-orange-500" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-7 w-16 bg-muted/10" />
          ) : (
            <>
              <div className="text-2xl font-bold">{formatNumber(metrics.totalOrders)}</div>
              <p className="text-xs text-orange-500 mt-1 flex items-center">
                <ArrowUpIcon className="h-3 w-3 mr-1" />
                <span>{metrics.pendingOrders} pending</span>
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Revenue Card */}
      <Card className="bg-transparent border-[hsl(var(--border))]/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
          <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-orange-500" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-7 w-24 bg-muted/10" />
          ) : (
            <>
              <div className="text-2xl font-bold">{formatCurrency(metrics.revenue)}</div>
              <p className="text-xs text-orange-500 mt-1 flex items-center">
                <ArrowUpIcon className="h-3 w-3 mr-1" />
                <span>8% from last month</span>
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Active Clients Card */}
      <Card className="bg-transparent border-[hsl(var(--border))]/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Clients</CardTitle>
          <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
            <Users className="h-4 w-4 text-orange-500" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-7 w-16 bg-muted/10" />
          ) : (
            <>
              <div className="text-2xl font-bold">{formatNumber(metrics.activeClients)}</div>
              <p className="text-xs text-orange-500 mt-1 flex items-center">
                <ArrowUpIcon className="h-3 w-3 mr-1" />
                <span>4% from last month</span>
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tasks Card */}
      <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tasks</CardTitle>
          <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
            <CheckSquare className="h-4 w-4 text-orange-500" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-7 w-16 bg-muted/10" />
          ) : (
            <>
              <div className="text-2xl font-bold">{formatNumber(metrics.totalTasks)}</div>
              <p className="text-xs text-orange-500 mt-1 flex items-center">
                <ArrowUpIcon className="h-3 w-3 mr-1" />
                <span>{metrics.pendingTasks} pending</span>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HomeMetricsCards;
