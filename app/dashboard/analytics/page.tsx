'use client';

import { BarChart3, DollarSign, Package, TrendingUp, ArrowUpCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Business performance and insights</p>
        </div>

        <Button variant="outline" size="sm" className="h-9 gap-1">
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(24500)}</div>
            <p className="text-xs text-orange-500 mt-1 flex items-center">
              <ArrowUpCircle className="h-3 w-3 mr-1" />
              <span>Last 30 days</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle>
            <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
              <Package className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-blue-500 mt-1 flex items-center">
              <ArrowUpCircle className="h-3 w-3 mr-1" />
              <span>This month</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Growth</CardTitle>
            <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12%</div>
            <p className="text-xs text-green-500 mt-1 flex items-center">
              <ArrowUpCircle className="h-3 w-3 mr-1" />
              <span>From last month</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Order</CardTitle>
            <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(583)}</div>
            <p className="text-xs text-purple-500 mt-1 flex items-center">
              <ArrowUpCircle className="h-3 w-3 mr-1" />
              <span>Per order</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue Overview */}
        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 rounded-xl">
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{formatCurrency(24500)}</div>
            <p className="text-sm text-muted-foreground mt-1">Last 30 days</p>
            <div className="h-40 mt-4 flex items-end space-x-2">
              {/* Placeholder for chart */}
              <div className="bg-orange-500/20 hover:bg-orange-500/30 w-8 h-20 rounded-t-md"></div>
              <div className="bg-orange-500/20 hover:bg-orange-500/30 w-8 h-24 rounded-t-md"></div>
              <div className="bg-orange-500/20 hover:bg-orange-500/30 w-8 h-16 rounded-t-md"></div>
              <div className="bg-orange-500/20 hover:bg-orange-500/30 w-8 h-32 rounded-t-md"></div>
              <div className="bg-orange-500/40 hover:bg-orange-500/50 w-8 h-36 rounded-t-md"></div>
              <div className="bg-orange-500/20 hover:bg-orange-500/30 w-8 h-28 rounded-t-md"></div>
            </div>
          </CardContent>
        </Card>

        {/* Order Status */}
        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 rounded-xl">
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Completed</span>
                  <span className="text-sm text-muted-foreground">65%</span>
                </div>
                <div className="w-full bg-muted/20 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">In Progress</span>
                  <span className="text-sm text-muted-foreground">25%</span>
                </div>
                <div className="w-full bg-muted/20 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Pending</span>
                  <span className="text-sm text-muted-foreground">10%</span>
                </div>
                <div className="w-full bg-muted/20 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 rounded-xl">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex justify-between">
                <span>Business Cards</span>
                <span className="text-orange-500 font-medium">{formatCurrency(3250)}</span>
              </li>
              <li className="flex justify-between">
                <span>Brochures</span>
                <span className="text-orange-500 font-medium">{formatCurrency(2840)}</span>
              </li>
              <li className="flex justify-between">
                <span>Posters</span>
                <span className="text-orange-500 font-medium">{formatCurrency(1920)}</span>
              </li>
              <li className="flex justify-between">
                <span>Banners</span>
                <span className="text-orange-500 font-medium">{formatCurrency(1540)}</span>
              </li>
              <li className="flex justify-between">
                <span>Flyers</span>
                <span className="text-orange-500 font-medium">{formatCurrency(1230)}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 rounded-xl">
        <CardHeader>
          <CardTitle>Monthly Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end space-x-2">
            {/* Placeholder for larger chart */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={`bg-orange-500/20 hover:bg-orange-500/40 w-full rounded-t-md transition-all duration-200 ease-in-out`}
                style={{ height: `${20 + Math.random() * 60}%` }}
              ></div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
            <span>Aug</span>
            <span>Sep</span>
            <span>Oct</span>
            <span>Nov</span>
            <span>Dec</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}