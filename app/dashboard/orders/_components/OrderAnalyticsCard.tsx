'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  Info,
  BarChart3,
  Calendar,
  User,
  DollarSign,
  ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatCurrency } from '@/lib/utils';
import AnalyticsBarChart from './AnalyticsBarChart';

interface MetricItem {
  label: string;
  value: string;
  change: string;
  status: string;
}

interface WeeklyData {
  days: string[];
  values: number[];
  average?: number;
  activeDay: string;
}

interface ClientDebt {
  id: string;
  name: string;
  debt: number;
  orderCount: number;
}

interface PendingInvoice {
  id: string;
  clientName: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'delivered' | 'not_delivered';
}

interface OrderAnalyticsCardProps {
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  total: string | number;
  change: string;
  subtitle: string;
  categories: string[];
  activeCategory: string;
  timeRange?: 'daily' | 'weekly' | 'monthly' | 'custom';
  metrics: MetricItem[];
  weeklyData: WeeklyData;
  clientsWithDebt?: ClientDebt[];
  pendingInvoices?: PendingInvoice[];
  onCategoryChange?: (category: string) => void;
  onTimeRangeChange?: (range: string) => void;
  onViewMore?: () => void;
}

/**
 * OrderAnalyticsCard component for displaying analytics in a card format
 */
const OrderAnalyticsCard: React.FC<OrderAnalyticsCardProps> = ({
  title,
  icon,
  accentColor,
  total,
  change,
  subtitle,
  categories,
  activeCategory,
  timeRange = 'weekly',
  metrics,
  weeklyData,
  clientsWithDebt = [],
  pendingInvoices = [],
  onCategoryChange,
  onTimeRangeChange,
  onViewMore
}) => {
  // Helper function to get color classes based on accent color
  const getColorClasses = (accentColor: string, isActive: boolean) => {
    const colorMap: Record<string, any> = {
      orange: {
        active: {
          bg: "bg-orange-100 dark:bg-orange-900/20",
          text: "text-orange-800 dark:text-orange-400"
        },
        activeBg: "bg-orange-500"
      },
      blue: {
        active: {
          bg: "bg-blue-100 dark:bg-blue-900/20",
          text: "text-blue-800 dark:text-blue-400"
        },
        activeBg: "bg-blue-500"
      },
      green: {
        active: {
          bg: "bg-green-100 dark:bg-green-900/20",
          text: "text-green-800 dark:text-green-400"
        },
        activeBg: "bg-green-500"
      }
    };

    if (isActive && colorMap[accentColor]) {
      return colorMap[accentColor].active || { bg: "bg-primary/20", text: "text-primary" };
    }

    return { bg: "bg-muted", text: "text-foreground hover:bg-accent" };
  };

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden">
      <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            {icon}
            {title}
            <button className="ml-1 text-muted-foreground hover:text-foreground">
              <Info size={16} />
            </button>
          </CardTitle>
          <div className="flex flex-col mt-1">
            <div className="flex items-center">
              <span className="text-2xl font-bold">{total}</span>
              <Badge
                className={cn(
                  "ml-2 px-1.5 py-0.5 text-xs",
                  change.startsWith('+') ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" :
                  "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                )}
              >
                {change}
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground mt-0.5">{subtitle}</span>
          </div>
        </div>
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-xs h-8 px-3"
              >
                {timeRange === 'daily' ? 'Daily' :
                 timeRange === 'weekly' ? 'Weekly' :
                 timeRange === 'monthly' ? 'Monthly' : 'Custom'}
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem
                className={cn("text-xs", timeRange === 'daily' && "bg-muted")}
                onClick={() => onTimeRangeChange && onTimeRangeChange('daily')}
              >
                Daily
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn("text-xs", timeRange === 'weekly' && "bg-muted")}
                onClick={() => onTimeRangeChange && onTimeRangeChange('weekly')}
              >
                Weekly
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn("text-xs", timeRange === 'monthly' && "bg-muted")}
                onClick={() => onTimeRangeChange && onTimeRangeChange('monthly')}
              >
                Monthly
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Category tabs */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category: string) => {
              const isActive = category === activeCategory;
              const colorClasses = getColorClasses(accentColor, isActive);

              return (
                <button
                  key={category}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium",
                    isActive ? `${colorClasses.bg} ${colorClasses.text}` : "bg-muted text-foreground hover:bg-accent"
                  )}
                  onClick={() => onCategoryChange && onCategoryChange(category)}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chart area */}
        <div className="mb-4">
          <AnalyticsBarChart
            data={weeklyData.days.map((day, index) => ({
              name: day,
              value: weeklyData.values[index],
              isActive: day === weeklyData.activeDay
            }))}
            average={weeklyData.average}
            accentColor={accentColor}
            showXAxis={true}
            showYAxis={false}
            showGrid={false}
            showAverage={true}
          />
        </div>

        {/* Metrics */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full bg-muted mb-4">
            {title === "Pending Invoices" ? (
              <>
                <TabsTrigger value="all" className="flex-1">All Orders</TabsTrigger>
                <TabsTrigger value="delivered" className="flex-1">Delivered</TabsTrigger>
                <TabsTrigger value="not_delivered" className="flex-1">Not Delivered</TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="all" className="flex-1">All Orders</TabsTrigger>
                <TabsTrigger value="pending" className="flex-1">Pending</TabsTrigger>
                <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="all" className="mt-0">
            {title === "Pending Invoices" ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium">All Pending Invoices</div>
                  {pendingInvoices.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs flex items-center gap-1 h-7 px-2"
                      onClick={onViewMore}
                    >
                      View All <ExternalLink size={12} />
                    </Button>
                  )}
                </div>
                {pendingInvoices.length > 0 ? (
                  // Show only top 3 clients with highest amounts
                  [...pendingInvoices]
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 3)
                    .map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => window.location.href = `/dashboard/orders?client=${invoice.clientName}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{invoice.clientName}</div>
                            <div className="text-xs text-muted-foreground">Due: {new Date(invoice.dueDate).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="text-sm font-medium">
                            {formatCurrency(invoice.amount).replace('UGX', '').trim()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {invoice.status === 'pending' ? 'Pending' :
                             invoice.status === 'delivered' ? 'Delivered' : 'Not Delivered'}
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="h-[150px] flex items-center justify-center text-muted-foreground">
                    No pending invoices found
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 text-sm text-muted-foreground">
                    Metrics
                  </div>
                  <div className="col-span-1 text-sm text-right font-medium">
                    Actual
                  </div>
                  <div className="col-span-1 text-sm text-right font-medium">
                    Change
                  </div>
                </div>

                {metrics.map((metric, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4 mb-2">
                    <div className="col-span-1">
                      <div className="text-sm font-medium">{metric.label}</div>
                      <div className="text-xs text-muted-foreground">{metric.status}</div>
                    </div>
                    <div className="col-span-1 text-right font-medium">
                      {metric.value}
                    </div>
                    <div className="col-span-1 text-right">
                      <span className={cn(
                        "text-sm",
                        (metric.change.startsWith('+') && !metric.label.includes("Time")) ||
                        (metric.change.startsWith('-') && metric.label.includes("Time"))
                          ? "text-green-500" : "text-red-500"
                      )}>
                        {metric.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pending tab for regular analytics cards */}
          {title !== "Pending Invoices" && (
            <TabsContent value="pending" className="mt-0">
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Pending orders data will appear here
              </div>
            </TabsContent>
          )}

          {/* Delivered tab for Pending Invoices card */}
          {title === "Pending Invoices" && (
            <TabsContent value="delivered" className="mt-0">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium">Delivered Orders with Balance</div>
                  {pendingInvoices.filter(inv => inv.status === 'delivered').length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs flex items-center gap-1 h-7 px-2"
                      onClick={onViewMore}
                    >
                      View All <ExternalLink size={12} />
                    </Button>
                  )}
                </div>
                {pendingInvoices.filter(inv => inv.status === 'delivered').length > 0 ? (
                  // Show only top 3 delivered orders with highest amounts
                  [...pendingInvoices.filter(inv => inv.status === 'delivered')]
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 3)
                    .map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => window.location.href = `/dashboard/orders?client=${invoice.clientName}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                            <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{invoice.clientName}</div>
                            <div className="text-xs text-muted-foreground">Due: {new Date(invoice.dueDate).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="text-sm font-medium">
                            {formatCurrency(invoice.amount).replace('UGX', '').trim()}
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            Delivered
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="h-[150px] flex items-center justify-center text-muted-foreground">
                    No delivered orders with balance
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {/* Completed tab for regular analytics cards */}
          {title !== "Pending Invoices" && (
            <TabsContent value="completed" className="mt-0">
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Completed orders data will appear here
              </div>
            </TabsContent>
          )}

          {/* Not Delivered tab for Pending Invoices card */}
          {title === "Pending Invoices" && (
            <TabsContent value="not_delivered" className="mt-0">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium">Orders Not Yet Delivered</div>
                  {pendingInvoices.filter(inv => inv.status === 'not_delivered').length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs flex items-center gap-1 h-7 px-2"
                      onClick={onViewMore}
                    >
                      View All <ExternalLink size={12} />
                    </Button>
                  )}
                </div>
                {pendingInvoices.filter(inv => inv.status === 'not_delivered').length > 0 ? (
                  // Show only top 3 not delivered orders with highest amounts
                  [...pendingInvoices.filter(inv => inv.status === 'not_delivered')]
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 3)
                    .map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => window.location.href = `/dashboard/orders?client=${invoice.clientName}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                            <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{invoice.clientName}</div>
                            <div className="text-xs text-muted-foreground">Due: {new Date(invoice.dueDate).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="text-sm font-medium">
                            {formatCurrency(invoice.amount).replace('UGX', '').trim()}
                          </div>
                          <div className="text-xs text-purple-600 dark:text-purple-400">
                            Not Delivered
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="h-[150px] flex items-center justify-center text-muted-foreground">
                    No pending orders awaiting delivery
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default OrderAnalyticsCard;
