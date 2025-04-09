'use client';

import { useDashboardStats } from '@/hooks/use-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, DollarSign, CreditCard, CheckSquare } from 'lucide-react';

interface DashboardStatsProps {
  stats?: {
    totalOrders: number;
    totalRevenue: number;
    totalExpenses: number;
    pendingTasks: number;
  };
}

export function DashboardStats({ stats: initialStats }: DashboardStatsProps) {
  // Use SWR for client-side data fetching, with initialStats from the server
  const { stats, isLoading } = useDashboardStats();
  
  // Use the initialStats if provided, otherwise use the data from SWR
  const displayStats = stats || initialStats || {
    totalOrders: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    pendingTasks: 0
  };
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{displayStats.totalOrders}</div>
          <p className="text-xs text-muted-foreground">
            +2.5% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${displayStats.totalRevenue.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            +18.1% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${displayStats.totalExpenses.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            +4.3% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{displayStats.pendingTasks}</div>
          <p className="text-xs text-muted-foreground">
            -2 tasks from yesterday
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
