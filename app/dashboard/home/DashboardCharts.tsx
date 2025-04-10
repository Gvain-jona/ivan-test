'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DashboardChartsProps {
  orders: any[];
}

export function DashboardCharts({ orders }: DashboardChartsProps) {
  // Group orders by month
  const ordersByMonth = orders.reduce((acc, order) => {
    const date = new Date(order.date);
    const month = date.toLocaleString('default', { month: 'short' });
    
    if (!acc[month]) {
      acc[month] = {
        count: 0,
        revenue: 0
      };
    }
    
    acc[month].count += 1;
    acc[month].revenue += order.total;
    
    return acc;
  }, {});
  
  // Convert to arrays for charting
  const months = Object.keys(ordersByMonth);
  const orderCounts = months.map(month => ordersByMonth[month].count);
  const revenues = months.map(month => ordersByMonth[month].revenue);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
        <CardDescription>
          Sales and order statistics for the current year.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="orders">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>
          <TabsContent value="orders" className="space-y-4">
            <div className="h-[200px] mt-4">
              {/* This would be a real chart in a production app */}
              <div className="flex h-full items-end gap-2">
                {orderCounts.map((count, i) => (
                  <div key={i} className="relative flex-1">
                    <div
                      className="absolute bottom-0 w-full bg-orange-500 rounded-sm"
                      style={{ height: `${(count / Math.max(...orderCounts)) * 100}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              {months.map((month, i) => (
                <div key={i}>{month}</div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="revenue" className="space-y-4">
            <div className="h-[200px] mt-4">
              {/* This would be a real chart in a production app */}
              <div className="flex h-full items-end gap-2">
                {revenues.map((revenue, i) => (
                  <div key={i} className="relative flex-1">
                    <div
                      className="absolute bottom-0 w-full bg-green-500 rounded-sm"
                      style={{ height: `${(revenue / Math.max(...revenues)) * 100}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              {months.map((month, i) => (
                <div key={i}>{month}</div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
