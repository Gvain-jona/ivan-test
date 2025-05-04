'use client';

import React from 'react';
import { KPICard } from '@/components/analytics/KPICard';
import { LineChartComponent } from '@/components/analytics/LineChartComponent';
import { BarChartComponent } from '@/components/analytics/BarChartComponent';
import { useAnalyticsContext } from '../_context/AnalyticsContext';
import { useProfitByPeriod, useCashFlowAnalysis } from '@/hooks/analytics/useAnalytics';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/chart-config';
import { 
  TrendingUpIcon, 
  ArrowUpRightIcon, 
  ArrowDownRightIcon, 
  PercentIcon,
  ArrowRightLeftIcon
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

export function FinancialsPanel() {
  const { dateRange, timeframe, setIsLoading } = useAnalyticsContext();
  
  // Fetch profit by period
  const { 
    data: profitData, 
    isLoading: isLoadingProfit 
  } = useProfitByPeriod(timeframe, dateRange);
  
  // Fetch cash flow analysis
  const { 
    cashFlow: cashFlowData, 
    isLoading: isLoadingCashFlow 
  } = useCashFlowAnalysis(timeframe, dateRange);
  
  // Update loading state
  React.useEffect(() => {
    setIsLoading(
      isLoadingProfit || 
      isLoadingCashFlow
    );
  }, [
    isLoadingProfit, 
    isLoadingCashFlow, 
    setIsLoading
  ]);
  
  // Calculate summary metrics
  const summaryMetrics = React.useMemo(() => {
    if (!profitData || profitData.length === 0 || !cashFlowData || cashFlowData.length === 0) {
      return {
        totalRevenue: 0,
        totalProfit: 0,
        profitMargin: 0,
        netCashFlow: 0
      };
    }
    
    const totalRevenue = profitData.reduce((sum, item) => sum + item.total_revenue, 0);
    const totalProfit = profitData.reduce((sum, item) => sum + item.total_profit, 0);
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    const totalInflow = cashFlowData.reduce((sum, item) => sum + item.inflow, 0);
    const totalOutflow = cashFlowData.reduce((sum, item) => sum + item.outflow, 0);
    const netCashFlow = totalInflow - totalOutflow;
    
    return {
      totalRevenue,
      totalProfit,
      profitMargin,
      netCashFlow
    };
  }, [profitData, cashFlowData]);
  
  // Prepare profit chart data
  const profitChartData = React.useMemo(() => {
    if (!profitData) return { labels: [], datasets: [] };
    
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
      labels: profitData.map(item => formatLabel(item.period)),
      datasets: [
        {
          label: 'Revenue',
          data: profitData.map(item => item.total_revenue),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
        },
        {
          label: 'Profit',
          data: profitData.map(item => item.total_profit),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
        },
        {
          label: 'Profit Margin',
          data: profitData.map(item => item.profit_margin * 100),
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          type: 'line',
          yAxisID: 'y1',
          borderDash: [5, 5],
        },
      ],
    };
  }, [profitData, timeframe]);
  
  // Prepare cash flow chart data
  const cashFlowChartData = React.useMemo(() => {
    if (!cashFlowData) return { labels: [], datasets: [] };
    
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
      labels: cashFlowData.map(item => formatLabel(item.period)),
      datasets: [
        {
          label: 'Inflow',
          data: cashFlowData.map(item => item.inflow),
          backgroundColor: '#22c55e',
          borderColor: '#22c55e',
          borderWidth: 1,
          type: 'bar',
        },
        {
          label: 'Outflow',
          data: cashFlowData.map(item => item.outflow),
          backgroundColor: '#ef4444',
          borderColor: '#ef4444',
          borderWidth: 1,
          type: 'bar',
        },
        {
          label: 'Net Flow',
          data: cashFlowData.map(item => item.net_flow),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          type: 'line',
        },
        {
          label: 'Cumulative Flow',
          data: cashFlowData.map(item => item.cumulative_flow),
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          type: 'line',
          borderDash: [5, 5],
        },
      ],
    };
  }, [cashFlowData, timeframe]);
  
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value={formatCurrency(summaryMetrics.totalRevenue)}
          icon={<ArrowUpRightIcon className="h-5 w-5 text-blue-500" />}
          isLoading={isLoadingProfit}
          iconClassName="bg-blue-100 dark:bg-blue-900/20"
        />
        
        <KPICard
          title="Total Profit"
          value={formatCurrency(summaryMetrics.totalProfit)}
          icon={<TrendingUpIcon className="h-5 w-5 text-green-500" />}
          isLoading={isLoadingProfit}
          iconClassName="bg-green-100 dark:bg-green-900/20"
        />
        
        <KPICard
          title="Profit Margin"
          value={formatPercentage(summaryMetrics.profitMargin)}
          icon={<PercentIcon className="h-5 w-5 text-purple-500" />}
          isLoading={isLoadingProfit}
          iconClassName="bg-purple-100 dark:bg-purple-900/20"
        />
        
        <KPICard
          title="Net Cash Flow"
          value={formatCurrency(summaryMetrics.netCashFlow)}
          icon={<ArrowRightLeftIcon className="h-5 w-5 text-orange-500" />}
          isLoading={isLoadingCashFlow}
          iconClassName="bg-orange-100 dark:bg-orange-900/20"
          trend={summaryMetrics.netCashFlow >= 0 ? 'up' : 'down'}
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        <LineChartComponent
          title="Profit Analysis"
          description={`Showing data by ${timeframe}`}
          data={profitChartData}
          isLoading={isLoadingProfit}
          height={300}
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
                min: 0,
                max: 100,
                ticks: {
                  callback: (value) => `${value}%`,
                },
              },
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const value = context.raw as number;
                    if (context.dataset.label === 'Profit Margin') {
                      return `${context.dataset.label}: ${value.toFixed(1)}%`;
                    }
                    return `${context.dataset.label}: ${formatCurrency(value)}`;
                  },
                },
              },
            },
          }}
        />
        
        <LineChartComponent
          title="Cash Flow Analysis"
          description={`Showing data by ${timeframe}`}
          data={cashFlowChartData}
          isLoading={isLoadingCashFlow}
          height={300}
          options={{
            scales: {
              y: {
                ticks: {
                  callback: (value) => formatCurrency(Number(value)),
                },
              },
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const value = context.raw as number;
                    return `${context.dataset.label}: ${formatCurrency(value)}`;
                  },
                },
              },
            },
          }}
        />
      </div>
      
      {/* Profit Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>Profit Analysis</CardTitle>
          <CardDescription>Detailed breakdown of profit by period</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Profit Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingProfit ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
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
              ) : profitData && profitData.length > 0 ? (
                profitData.map((profit, index) => {
                  // Format period based on timeframe
                  const formattedPeriod = (() => {
                    try {
                      const date = new Date(profit.period);
                      switch (timeframe) {
                        case 'day':
                          return format(date, 'MMM d, yyyy');
                        case 'week':
                          return `Week ${format(date, 'w, yyyy')}`;
                        case 'month':
                          return format(date, 'MMMM yyyy');
                        case 'year':
                          return format(date, 'yyyy');
                        default:
                          return profit.period;
                      }
                    } catch (error) {
                      return profit.period;
                    }
                  })();
                  
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{formattedPeriod}</TableCell>
                      <TableCell className="text-right">{formatCurrency(profit.total_revenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(profit.total_profit)}</TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={profit.profit_margin >= 0.3 ? "success" : profit.profit_margin >= 0.15 ? "warning" : "destructive"}
                          className="ml-auto"
                        >
                          {formatPercentage(profit.profit_margin * 100)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                    No profit data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Cash Flow Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Analysis</CardTitle>
          <CardDescription>Detailed breakdown of cash flow by period</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Inflow</TableHead>
                <TableHead className="text-right">Outflow</TableHead>
                <TableHead className="text-right">Net Flow</TableHead>
                <TableHead className="text-right">Cumulative Flow</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingCashFlow ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-4 w-20 bg-muted rounded animate-pulse ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-4 w-20 bg-muted rounded animate-pulse ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-4 w-20 bg-muted rounded animate-pulse ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-4 w-20 bg-muted rounded animate-pulse ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : cashFlowData && cashFlowData.length > 0 ? (
                cashFlowData.map((cashFlow, index) => {
                  // Format period based on timeframe
                  const formattedPeriod = (() => {
                    try {
                      const date = new Date(cashFlow.period);
                      switch (timeframe) {
                        case 'day':
                          return format(date, 'MMM d, yyyy');
                        case 'week':
                          return `Week ${format(date, 'w, yyyy')}`;
                        case 'month':
                          return format(date, 'MMMM yyyy');
                        case 'year':
                          return format(date, 'yyyy');
                        default:
                          return cashFlow.period;
                      }
                    } catch (error) {
                      return cashFlow.period;
                    }
                  })();
                  
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{formattedPeriod}</TableCell>
                      <TableCell className="text-right">{formatCurrency(cashFlow.inflow)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(cashFlow.outflow)}</TableCell>
                      <TableCell className="text-right">
                        <span className={cashFlow.net_flow >= 0 ? "text-green-500" : "text-red-500"}>
                          {formatCurrency(cashFlow.net_flow)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cashFlow.cumulative_flow >= 0 ? "text-green-500" : "text-red-500"}>
                          {formatCurrency(cashFlow.cumulative_flow)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No cash flow data available
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
