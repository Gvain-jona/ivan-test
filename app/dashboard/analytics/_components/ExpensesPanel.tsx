'use client';

import React from 'react';
import { KPICard } from '@/components/analytics/KPICard';
import { LineChartComponent } from '@/components/analytics/LineChartComponent';
import { BarChartComponent } from '@/components/analytics/BarChartComponent';
import { PieChartComponent } from '@/components/analytics/PieChartComponent';
import { useAnalyticsContext } from '../_context/AnalyticsContext';
import { useExpensesByCategory, useExpenseToRevenueRatio } from '@/hooks/analytics/useAnalytics';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/chart-config';
import { 
  BanknoteIcon, 
  PercentIcon, 
  ArrowDownIcon, 
  ArrowUpIcon,
  CalendarIcon
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

export function ExpensesPanel() {
  const { dateRange, timeframe, categoryFilter, statusFilter, setIsLoading } = useAnalyticsContext();
  
  // Fetch expenses by category
  const { 
    expenses: expensesByCategory, 
    isLoading: isLoadingExpenses 
  } = useExpensesByCategory(dateRange);
  
  // Fetch expense to revenue ratio
  const { 
    ratios: expenseToRevenueRatio, 
    isLoading: isLoadingRatios 
  } = useExpenseToRevenueRatio(timeframe, dateRange);
  
  // Update loading state
  React.useEffect(() => {
    setIsLoading(
      isLoadingExpenses || 
      isLoadingRatios
    );
  }, [
    isLoadingExpenses, 
    isLoadingRatios, 
    setIsLoading
  ]);
  
  // Calculate summary metrics
  const summaryMetrics = React.useMemo(() => {
    if (!expensesByCategory || expensesByCategory.length === 0 || !expenseToRevenueRatio || expenseToRevenueRatio.length === 0) {
      return {
        totalExpenses: 0,
        fixedExpenses: 0,
        variableExpenses: 0,
        expenseRatio: 0
      };
    }
    
    const totalExpenses = expensesByCategory.reduce((sum, item) => sum + item.total_amount, 0);
    const fixedExpenses = expensesByCategory
      .filter(item => item.category.toLowerCase() === 'fixed')
      .reduce((sum, item) => sum + item.total_amount, 0);
    const variableExpenses = expensesByCategory
      .filter(item => item.category.toLowerCase() === 'variable')
      .reduce((sum, item) => sum + item.total_amount, 0);
    
    // Get the average expense ratio
    const avgExpenseRatio = expenseToRevenueRatio.reduce((sum, item) => sum + item.expense_ratio, 0) / expenseToRevenueRatio.length;
    
    return {
      totalExpenses,
      fixedExpenses,
      variableExpenses,
      expenseRatio: avgExpenseRatio
    };
  }, [expensesByCategory, expenseToRevenueRatio]);
  
  // Prepare expense by category chart data
  const expensesByCategoryData = React.useMemo(() => {
    if (!expensesByCategory) return { labels: [], datasets: [] };
    
    return {
      labels: expensesByCategory.map(item => item.category),
      datasets: [
        {
          data: expensesByCategory.map(item => item.total_amount),
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
  }, [expensesByCategory]);
  
  // Prepare expense to revenue ratio chart data
  const expenseRatioChartData = React.useMemo(() => {
    if (!expenseToRevenueRatio) return { labels: [], datasets: [] };
    
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
      labels: expenseToRevenueRatio.map(item => formatLabel(item.period)),
      datasets: [
        {
          label: 'Revenue',
          data: expenseToRevenueRatio.map(item => item.total_revenue),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          type: 'line',
          yAxisID: 'y',
        },
        {
          label: 'Expenses',
          data: expenseToRevenueRatio.map(item => item.total_expenses),
          backgroundColor: '#ef4444',
          borderColor: '#ef4444',
          borderWidth: 1,
          type: 'bar',
          yAxisID: 'y',
        },
        {
          label: 'Materials',
          data: expenseToRevenueRatio.map(item => item.total_materials),
          backgroundColor: '#f97316',
          borderColor: '#f97316',
          borderWidth: 1,
          type: 'bar',
          yAxisID: 'y',
        },
        {
          label: 'Expense Ratio',
          data: expenseToRevenueRatio.map(item => item.expense_ratio * 100),
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          type: 'line',
          yAxisID: 'y1',
          borderDash: [5, 5],
        },
      ],
    };
  }, [expenseToRevenueRatio, timeframe]);
  
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Expenses"
          value={formatCurrency(summaryMetrics.totalExpenses)}
          icon={<BanknoteIcon className="h-5 w-5 text-red-500" />}
          isLoading={isLoadingExpenses}
          iconClassName="bg-red-100 dark:bg-red-900/20"
        />
        
        <KPICard
          title="Fixed Expenses"
          value={formatCurrency(summaryMetrics.fixedExpenses)}
          icon={<ArrowDownIcon className="h-5 w-5 text-blue-500" />}
          isLoading={isLoadingExpenses}
          iconClassName="bg-blue-100 dark:bg-blue-900/20"
        />
        
        <KPICard
          title="Variable Expenses"
          value={formatCurrency(summaryMetrics.variableExpenses)}
          icon={<ArrowUpIcon className="h-5 w-5 text-orange-500" />}
          isLoading={isLoadingExpenses}
          iconClassName="bg-orange-100 dark:bg-orange-900/20"
        />
        
        <KPICard
          title="Expense Ratio"
          value={formatPercentage(summaryMetrics.expenseRatio * 100)}
          icon={<PercentIcon className="h-5 w-5 text-purple-500" />}
          isLoading={isLoadingRatios}
          iconClassName="bg-purple-100 dark:bg-purple-900/20"
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChartComponent
          title="Expense to Revenue Ratio"
          description={`Showing data by ${timeframe}`}
          data={expenseRatioChartData}
          isLoading={isLoadingRatios}
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
                    if (context.dataset.label === 'Expense Ratio') {
                      return `${context.dataset.label}: ${value.toFixed(1)}%`;
                    }
                    return `${context.dataset.label}: ${formatCurrency(value)}`;
                  },
                },
              },
            },
          }}
        />
        
        <PieChartComponent
          title="Expenses by Category"
          description="Distribution of expenses by category"
          data={expensesByCategoryData}
          isLoading={isLoadingExpenses}
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
      
      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses by Category</CardTitle>
          <CardDescription>Detailed breakdown of expenses by category</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingExpenses ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-4 w-20 bg-muted rounded animate-pulse ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-4 w-16 bg-muted rounded animate-pulse ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : expensesByCategory && expensesByCategory.length > 0 ? (
                expensesByCategory.map((expense, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{expense.category}</TableCell>
                    <TableCell className="text-right">{formatCurrency(expense.total_amount)}</TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant={expense.percentage >= 30 ? "destructive" : expense.percentage >= 15 ? "warning" : "success"}
                        className="ml-auto"
                      >
                        {formatPercentage(expense.percentage)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                    No expense data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Expense to Revenue Ratio Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expense to Revenue Ratio</CardTitle>
          <CardDescription>Detailed breakdown of expense to revenue ratio by period</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Materials</TableHead>
                <TableHead className="text-right">Expense Ratio</TableHead>
                <TableHead className="text-right">Combined Ratio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingRatios ? (
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
                      <div className="h-4 w-16 bg-muted rounded animate-pulse ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-4 w-16 bg-muted rounded animate-pulse ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : expenseToRevenueRatio && expenseToRevenueRatio.length > 0 ? (
                expenseToRevenueRatio.map((ratio, index) => {
                  // Format period based on timeframe
                  const formattedPeriod = (() => {
                    try {
                      const date = new Date(ratio.period);
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
                          return ratio.period;
                      }
                    } catch (error) {
                      return ratio.period;
                    }
                  })();
                  
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{formattedPeriod}</TableCell>
                      <TableCell className="text-right">{formatCurrency(ratio.total_revenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(ratio.total_expenses)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(ratio.total_materials)}</TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={ratio.expense_ratio >= 0.3 ? "destructive" : ratio.expense_ratio >= 0.15 ? "warning" : "success"}
                          className="ml-auto"
                        >
                          {formatPercentage(ratio.expense_ratio * 100)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={ratio.combined_ratio >= 0.5 ? "destructive" : ratio.combined_ratio >= 0.3 ? "warning" : "success"}
                          className="ml-auto"
                        >
                          {formatPercentage(ratio.combined_ratio * 100)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                    No ratio data available
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
