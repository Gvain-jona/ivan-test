import { Suspense } from 'react';
import { DashboardSkeleton } from '@/components/skeletons';
import { DashboardStats } from './DashboardStats';
import { RecentActivity } from './RecentActivity';
import { DashboardCharts } from './DashboardCharts';
import { dataService } from '@/lib/supabase';

export default async function ServerPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your business performance and recent activity.
          </p>
        </div>
      </div>
      
      <Suspense fallback={<div className="h-24 bg-gray-800/20 animate-pulse rounded-lg" />}>
        <DashboardStatsContainer />
      </Suspense>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Suspense fallback={<div className="h-96 bg-gray-800/20 animate-pulse rounded-lg" />}>
          <DashboardChartsContainer />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 bg-gray-800/20 animate-pulse rounded-lg" />}>
          <RecentActivityContainer />
        </Suspense>
      </div>
    </div>
  );
}

// Server components that fetch data
async function DashboardStatsContainer() {
  const stats = await dataService.getDashboardStats();
  return <DashboardStats stats={stats} />;
}

async function DashboardChartsContainer() {
  const orders = await dataService.getOrders();
  return <DashboardCharts orders={orders} />;
}

async function RecentActivityContainer() {
  const [orders, tasks] = await Promise.all([
    dataService.getOrders(),
    dataService.getTasks()
  ]);
  
  // Combine and sort by date
  const activities = [
    ...orders.slice(0, 5).map(order => ({
      type: 'order',
      id: order.id,
      title: `New order ${order.id}`,
      date: order.date,
      data: order
    })),
    ...tasks.slice(0, 5).map(task => ({
      type: 'task',
      id: task.id,
      title: task.title,
      date: task.dueDate,
      data: task
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   .slice(0, 5);
  
  return <RecentActivity activities={activities} />;
}
