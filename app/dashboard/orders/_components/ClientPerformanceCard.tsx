'use client';

import React, { useMemo } from 'react';
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
  ExternalLink,
  TrendingUp,
  Users,
  Repeat
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatCurrency } from '@/lib/utils';
import AnalyticsBarChart from './AnalyticsBarChart';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Types
interface MetricItem {
  label: string;
  value: string;
  change: string;
  status: string;
}

interface ClientData {
  id: string;
  name: string;
  totalSpent: number;
  orderCount: number;
  avgOrderValue: number;
  lastOrderDate: string;
  retentionScore: number;
}

// Client Revenue Chart Component
interface ClientRevenueChartProps {
  clients: ClientData[];
  accentColor: string;
  activeCategory: string;
}

const ClientRevenueChart: React.FC<ClientRevenueChartProps> = ({ clients, accentColor, activeCategory }) => {
  // Prepare data for the chart
  const chartData = useMemo(() => {
    if (!clients || clients.length === 0) return [];

    // Filter clients based on active category
    let filteredClients = [...clients];
    if (activeCategory.toLowerCase() === 'regular') {
      filteredClients = filteredClients.filter(client => client.retentionScore >= 7);
    } else if (activeCategory.toLowerCase() === 'contract') {
      filteredClients = filteredClients.filter(client => client.retentionScore < 7);
    }

    // Sort clients by total spent (highest first)
    return filteredClients
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 7) // Limit to top 7 clients for better visualization
      .map(client => {
        // Determine if this is a high-performing client (top 3)
        const isHighPerforming = client.totalSpent > 500000 || client.retentionScore >= 8;

        return {
          name: client.name.length > 10 ? `${client.name.substring(0, 10)}...` : client.name,
          value: client.totalSpent,
          isActive: isHighPerforming, // Use isActive to apply different color
          fullName: client.name,
          orderCount: client.orderCount,
          retentionScore: client.retentionScore
        };
      });
  }, [clients, activeCategory]);

  // Calculate average revenue per client
  const averageRevenue = useMemo(() => {
    if (!clients || clients.length === 0) return 0;
    const total = clients.reduce((sum, client) => sum + client.totalSpent, 0);
    return total / clients.length;
  }, [clients]);

  // Get color based on accent color
  const getBarColor = (accentColor: string) => {
    const colorMap: Record<string, string> = {
      orange: 'var(--orange-500)',
      blue: 'var(--blue-500)',
      green: 'var(--green-500)',
      red: 'var(--red-500)',
      purple: 'var(--purple-500)'
    };

    return colorMap[accentColor] || 'var(--purple-500)';
  };

  if (clients.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-muted-foreground">
        No client data available
      </div>
    );
  }

  return (
    <div className="h-[180px] w-full">
      <AnalyticsBarChart
        data={chartData}
        average={averageRevenue}
        accentColor={accentColor}
        showXAxis={true}
        showYAxis={false}
        showGrid={false}
        showAverage={true}
        valueFormatter={(value) => formatCurrency(value).replace('UGX', '').trim()}
      />
    </div>
  );
};

interface ClientPerformanceCardProps {
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
  topClients: ClientData[];
  onCategoryChange?: (category: string) => void;
  onTimeRangeChange?: (range: string) => void;
  onViewMore?: () => void;
}

// Generate initials from client name
const getInitials = (name: string): string => {
  if (!name) return '--';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Get avatar color based on client name
const getAvatarColor = (name: string): string => {
  if (!name) return 'bg-gray-200';

  const colors = [
    'bg-red-100 text-red-800',
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
    'bg-indigo-100 text-indigo-800',
  ];

  // Simple hash function to get consistent color for the same name
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// Get retention score color
const getRetentionScoreColor = (score: number): string => {
  if (score >= 8) return 'text-green-500';
  if (score >= 5) return 'text-amber-500';
  return 'text-red-500';
};

/**
 * ClientPerformanceCard component for displaying client analytics in a card format
 */
const ClientPerformanceCard: React.FC<ClientPerformanceCardProps> = ({
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
  topClients = [],
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
      },
      red: {
        active: {
          bg: "bg-red-100 dark:bg-red-900/20",
          text: "text-red-800 dark:text-red-400"
        },
        activeBg: "bg-red-500"
      },
      purple: {
        active: {
          bg: "bg-purple-100 dark:bg-purple-900/20",
          text: "text-purple-800 dark:text-purple-400"
        },
        activeBg: "bg-purple-500"
      }
    };

    return isActive ? colorMap[accentColor]?.active || {} : {};
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${accentColor === 'orange' ? 'bg-orange-100 dark:bg-orange-900/20' : accentColor === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-green-100 dark:bg-green-900/20'}`}>
              {icon}
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  {timeRange === 'daily' ? 'Daily' : timeRange === 'weekly' ? 'Weekly' : timeRange === 'monthly' ? 'Monthly' : 'Custom'}
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onTimeRangeChange?.('daily')}>Daily</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTimeRangeChange?.('weekly')}>Weekly</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTimeRangeChange?.('monthly')}>Monthly</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTimeRangeChange?.('custom')}>Custom</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-baseline mt-2">
          <div className="text-2xl font-bold">{total}</div>
          <div className={`ml-2 text-sm ${change.startsWith('+') ? 'text-green-500' : change.startsWith('-') ? 'text-red-500' : 'text-muted-foreground'}`}>
            {change}
          </div>
          <div className="ml-1 text-sm text-muted-foreground">{subtitle}</div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <Tabs defaultValue="clients" className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-3 mb-4">
            {categories.map((category) => {
              // Change "Clients" to "All Clients" for display
              const displayName = category === 'Clients' ? 'All Clients' : category;

              return (
                <TabsTrigger
                  key={category}
                  value={category.toLowerCase().replace(/\s+/g, '-')}
                  onClick={() => onCategoryChange?.(category)}
                  className={cn(
                    "text-xs py-1.5",
                    activeCategory === category &&
                      (accentColor === 'orange' ? 'data-[state=active]:bg-orange-100 data-[state=active]:text-orange-900 dark:data-[state=active]:bg-orange-900/20 dark:data-[state=active]:text-orange-400' :
                       accentColor === 'blue' ? 'data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-400' :
                       accentColor === 'purple' ? 'data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900 dark:data-[state=active]:bg-purple-900/20 dark:data-[state=active]:text-purple-400' :
                       'data-[state=active]:bg-green-100 data-[state=active]:text-green-900 dark:data-[state=active]:bg-green-900/20 dark:data-[state=active]:text-green-400')
                  )}
                >
                  {displayName}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="clients" className="flex-1 flex flex-col">
            {/* Client Revenue Chart */}
            <div className="mb-4">
              <div className="mb-2 text-xs text-muted-foreground">
                <span className="inline-block w-3 h-3 rounded-full bg-purple-500 mr-1"></span> High-value clients
                <span className="inline-block w-3 h-3 rounded-full bg-muted ml-3 mr-1"></span> Regular clients
              </div>
              <ClientRevenueChart
                clients={topClients}
                accentColor={accentColor}
                activeCategory={activeCategory}
              />
            </div>

            {/* Top Clients */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium">Top Clients</h4>
                {onViewMore && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={onViewMore}
                  >
                    View All <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {topClients.length > 0 ? (
                  topClients
                    .sort((a, b) => b.totalSpent - a.totalSpent)
                    .slice(0, 3) // Limit to top 3 clients
                    .map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors cursor-pointer group hover:translate-y-[-2px] duration-200"
                        onClick={() => window.location.href = `/dashboard/orders?client=${client.name}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className={`h-9 w-9 ${getAvatarColor(client.name)}`}>
                            <AvatarFallback className="text-sm font-medium">
                              {getInitials(client.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">{client.name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Repeat className="h-3 w-3" />
                              {client.orderCount} orders
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="text-sm font-medium">
                            {formatCurrency(client.totalSpent).replace('UGX', '').trim()}
                          </div>
                          <div className="text-xs flex items-center gap-1">
                            <span className={getRetentionScoreColor(client.retentionScore)}>
                              {client.retentionScore}/10
                            </span>
                            <TrendingUp className={`h-3 w-3 ${getRetentionScoreColor(client.retentionScore)}`} />
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="h-[120px] flex items-center justify-center text-muted-foreground">
                    No client data available
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="regular" className="flex-1 flex flex-col">
            <div className="h-[150px] flex items-center justify-center text-muted-foreground">
              Regular client data will be shown here
            </div>
          </TabsContent>

          <TabsContent value="contract" className="flex-1 flex flex-col">
            <div className="h-[150px] flex items-center justify-center text-muted-foreground">
              Contract client data will be shown here
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ClientPerformanceCard;
