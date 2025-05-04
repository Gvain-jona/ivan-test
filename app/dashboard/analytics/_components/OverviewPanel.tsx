'use client';

import React from 'react';
import { StatCard, ProgressBar, CategoryNavigation, DonutChart, SegmentLegend } from '@/components/analytics/StatCard';
import { LineChartComponent } from '@/components/analytics/LineChartComponent';
import { BarChartComponent } from '@/components/analytics/BarChartComponent';
import { PieChartComponent } from '@/components/analytics/PieChartComponent';
import { MarketingChannelsCard } from '@/components/analytics/MarketingChannelsCard';
import { SpendingSummaryCard } from '@/components/analytics/SpendingSummaryCard';
import { StockMarketTracker } from '@/components/analytics/StockMarketTracker';
import { KPICardWithChart } from '@/components/analytics/KPICardWithChart';
import { RevenueAreaChart } from '@/components/analytics/RevenueAreaChart';
import { useAnalyticsContext } from '../_context/AnalyticsContext';
import { useSummaryMetrics, useRevenueByPeriod, useProfitByPeriod, useExpensesByCategory, useCategoryPerformance, useNormalizedCategoryPerformance, useSpendingSummary } from '@/hooks/analytics/useAnalytics';
import { useClientSegments } from '@/hooks/analytics/useClientSegments';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/chart-config';
import {
  ShoppingCartIcon,
  BanknoteIcon,
  TrendingUpIcon,
  ArrowUpRightIcon,
  PercentIcon,
  PackageIcon,
  ReceiptIcon,
  ShoppingBag,
  Zap,
  CircleDollarSign,
  UsersIcon
} from 'lucide-react';
import { format } from 'date-fns';

export function OverviewPanel() {
  const { dateRange, timeframe, setTimeframe, setIsLoading, setDateRange } = useAnalyticsContext();

  // Fetch summary metrics
  const {
    metrics: summaryMetrics,
    isLoading: isLoadingSummary
  } = useSummaryMetrics(dateRange);

  // Fetch revenue by period
  const {
    data: revenueData,
    isLoading: isLoadingRevenue
  } = useRevenueByPeriod(timeframe, dateRange);

  // Fetch profit by period
  const {
    data: profitData,
    isLoading: isLoadingProfit
  } = useProfitByPeriod(timeframe, dateRange);

  // Fetch expenses by category
  const {
    expenses: expensesByCategory,
    isLoading: isLoadingExpenses
  } = useExpensesByCategory(dateRange);

  // Fetch normalized category performance data
  const {
    categories: normalizedCategoryPerformance,
    isLoading: isLoadingCategories
  } = useNormalizedCategoryPerformance(dateRange);

  // Fetch spending summary data
  const [spendingTimeRange, setSpendingTimeRange] = React.useState('Last Week');
  const {
    totalSpend,
    spendingLimit,
    categories: spendingCategories,
    isLoading: isLoadingSpending
  } = useSpendingSummary(spendingTimeRange);

  // Fetch client segments data
  const {
    segments: clientSegments,
    isLoading: isLoadingClientSegments
  } = useClientSegments(dateRange);

  // Update loading state
  React.useEffect(() => {
    setIsLoading(
      isLoadingSummary ||
      isLoadingRevenue ||
      isLoadingProfit ||
      isLoadingExpenses ||
      isLoadingCategories ||
      isLoadingSpending ||
      isLoadingClientSegments
    );
  }, [
    isLoadingSummary,
    isLoadingRevenue,
    isLoadingProfit,
    isLoadingExpenses,
    isLoadingCategories,
    isLoadingSpending,
    isLoadingClientSegments,
    setIsLoading
  ]);

  // Prepare revenue and profit chart data
  const revenueAndProfitData = React.useMemo(() => {
    if (!revenueData || !profitData) return { labels: [], datasets: [] };

    // Combine revenue and profit data
    const combinedData = revenueData.map((revenueItem) => {
      const profitItem = profitData.find(p => p.period === revenueItem.period);
      return {
        period: revenueItem.period,
        revenue: revenueItem.total_revenue,
        profit: profitItem?.total_profit || 0,
      };
    });

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
      labels: combinedData.map(item => formatLabel(item.period)),
      datasets: [
        {
          label: 'Revenue',
          data: combinedData.map(item => item.revenue),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
        },
        {
          label: 'Profit',
          data: combinedData.map(item => item.profit),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
        },
      ],
    };
  }, [revenueData, profitData, timeframe]);

  // Prepare expenses by category chart data
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

  // State for category navigation
  const [categoryIndex, setCategoryIndex] = React.useState(0);

  // Prepare categories data for display
  const categories = React.useMemo(() => {
    if (!normalizedCategoryPerformance || normalizedCategoryPerformance.length === 0) return [];

    return normalizedCategoryPerformance.map(category => ({
      name: category.normalized_category_name,
      products: category.item_count,
      revenue: category.total_revenue,
      profit: category.total_profit,
      percentage: category.percentage,
      // Calculate change (in a real app, this would come from comparing to previous period)
      change: category.profit_margin > 0 ? Number((Math.random() * 5).toFixed(1)) : Number((-Math.random() * 3).toFixed(1))
    }));
  }, [normalizedCategoryPerformance]);

  // Current category name
  const currentCategory = React.useMemo(() => {
    if (categories.length === 0) return '';
    return categories[categoryIndex]?.name || '';
  }, [categories, categoryIndex]);

  // Transform client segments data for the DonutChart component
  const customerSegmentsForChart = React.useMemo(() => {
    if (!clientSegments || clientSegments.length === 0) {
      // Fallback data if no client segments are available
      return [
        { label: 'Premium', value: 9450, color: '#FF6B00', percentage: 32 },
        { label: 'Regular', value: 8320, color: '#FFC700', percentage: 46 },
        { label: 'New', value: 3280, color: '#00D2C6', percentage: 22 },
      ];
    }

    return clientSegments.map(segment => ({
      label: segment.segment,
      value: segment.total_revenue,
      color: segment.color,
      percentage: segment.percentage
    }));
  }, [clientSegments]);

  // Marketing channels data
  const marketingChannels = [
    { name: 'Organic Search', percentage: 45, color: '#FF6B00' },
    { name: 'Social Media', percentage: 40, color: '#FFC700' },
    { name: 'Direct', percentage: 15, color: '#00D2C6' },
  ];

  const marketingMetrics = [
    { name: 'Acquisition', value: '$38.25', change: 5.2 },
    { name: 'Conversion', value: '4.2 days', change: 3.8 },
    { name: 'ROI', value: '324%', change: 4.5 },
  ];

  // Use the existing spending data from the hook defined earlier

  const handlePreviousCategory = () => {
    if (categories.length === 0) return;
    const newIndex = (categoryIndex - 1 + categories.length) % categories.length;
    setCategoryIndex(newIndex);
  };

  const handleNextCategory = () => {
    if (categories.length === 0) return;
    const newIndex = (categoryIndex + 1) % categories.length;
    setCategoryIndex(newIndex);
  };

  // State for stock market tracker
  const [stockSymbol, setStockSymbol] = React.useState('ACME');
  const [stockTimeRange, setStockTimeRange] = React.useState('1W');

  // State for revenue area chart
  const [revenueTimeRange, setRevenueTimeRange] = React.useState('Last 30 days');

  // Prepare revenue data for the area chart
  const { revenueData: chartData, revenueLabels: chartLabels } = React.useMemo(() => {
    if (!revenueData) {
      return {
        revenueData: [],
        revenueLabels: []
      };
    }

    // Generate complete date range based on selected time range
    const generateDateRange = () => {
      const today = new Date();
      const dates = [];
      let startDate = new Date();
      let endDate = new Date();
      let interval = 'day';

      switch (revenueTimeRange) {
        case 'Last 7 days':
          // For last 7 days, show each day
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 6);
          endDate = new Date(today);
          interval = 'day';
          break;

        case 'Last 30 days':
          // For last 30 days, show each day
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 29);
          endDate = new Date(today);
          interval = 'day';
          break;

        case 'Last 90 days':
          // For last 90 days, group by weeks
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 89);
          endDate = new Date(today);

          // Adjust to start on a Sunday for clean week boundaries
          const dayOfWeek = startDate.getDay();
          startDate.setDate(startDate.getDate() - dayOfWeek);

          interval = 'week';
          break;

        case 'This year':
          // For this year, show each month
          startDate = new Date(today.getFullYear(), 0, 1);
          endDate = new Date(today.getFullYear(), 11, 31);
          interval = 'month';
          break;

        case 'Last year':
          // For last year, show each month
          startDate = new Date(today.getFullYear() - 1, 0, 1);
          endDate = new Date(today.getFullYear() - 1, 11, 31);
          interval = 'month';
          break;

        default:
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 29);
          endDate = new Date(today);
          interval = 'day';
      }

      // Generate all dates in the range
      if (interval === 'day') {
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          dates.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else if (interval === 'week') {
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          dates.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 7); // Add a week
        }
      } else if (interval === 'month') {
        // For months, ensure we have exactly 12 months for year views
        if (revenueTimeRange === 'This year' || revenueTimeRange === 'Last year') {
          const year = revenueTimeRange === 'This year' ? today.getFullYear() : today.getFullYear() - 1;
          for (let month = 0; month < 12; month++) {
            dates.push(new Date(year, month, 1));
          }
        } else {
          const currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            dates.push(new Date(currentDate));
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
        }
      }

      return dates;
    };

    // Generate complete date range
    const dateRange = generateDateRange();

    // Create a map of existing data by date string
    const dataMap = new Map();
    revenueData.forEach(item => {
      const dateStr = item.period.split('T')[0]; // Get YYYY-MM-DD part
      dataMap.set(dateStr, Number(item.total_revenue));
    });

    // Format labels based on selected time range
    const formatLabel = (date: Date, index: number, totalDates: number) => {
      try {
        // Custom formatting based on the selected time range
        switch (revenueTimeRange) {
          case 'Last 7 days':
            // For last 7 days, show day of week (Mon, Tue, etc.)
            return format(date, 'EEE');

          case 'Last 30 days':
            // For last 30 days, show specific dates at regular intervals
            // Show date for first, last, and every 5th day
            if (index === 0 || index === totalDates - 1 || index % 5 === 0) {
              return format(date, 'MMM d');
            }
            return '';

          case 'Last 90 days':
            // For last 90 days, we're using weekly intervals
            // Format as "Week of MMM d"
            return format(date, 'MMM d');

          case 'This year':
            // For this year, show month names
            // Make sure we have exactly 12 months
            if (index < 12) {
              return format(date, 'MMM');
            }
            return '';

          case 'Last year':
            // For last year, show month names
            // Make sure we have exactly 12 months
            if (index < 12) {
              return format(date, 'MMM');
            }
            return '';

          default:
            // Default formatting based on timeframe
            switch (timeframe) {
              case 'day':
                return format(date, 'MMM d');
              case 'week':
                return `W${format(date, 'w')}`;
              case 'month':
                return format(date, 'MMM');
              case 'year':
                return format(date, 'yyyy');
              default:
                return format(date, 'yyyy-MM-dd');
            }
        }
      } catch (error) {
        return format(date, 'yyyy-MM-dd');
      }
    };

    // Map the complete date range to data values with proper aggregation
    const completeData = dateRange.map((date, index) => {
      // For daily data, just use the exact date
      if (revenueTimeRange === 'Last 7 days' || revenueTimeRange === 'Last 30 days') {
        const dateStr = format(date, 'yyyy-MM-dd');
        return dataMap.has(dateStr) ? dataMap.get(dateStr) : 0;
      }

      // For weekly data (Last 90 days), aggregate the week
      else if (revenueTimeRange === 'Last 90 days') {
        let weekTotal = 0;
        const weekStart = new Date(date);
        const weekEnd = new Date(date);
        weekEnd.setDate(weekEnd.getDate() + 6);

        // Sum up all days in this week
        const currentDate = new Date(weekStart);
        while (currentDate <= weekEnd && currentDate <= new Date()) {
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          if (dataMap.has(dateStr)) {
            weekTotal += dataMap.get(dateStr);
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        return weekTotal;
      }

      // For monthly data (This year, Last year), aggregate the month
      else if (revenueTimeRange === 'This year' || revenueTimeRange === 'Last year') {
        let monthTotal = 0;
        const year = revenueTimeRange === 'This year' ? new Date().getFullYear() : new Date().getFullYear() - 1;
        const month = index; // 0-11 for Jan-Dec

        // Get the number of days in this month
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Sum up all days in this month
        for (let day = 1; day <= daysInMonth; day++) {
          const currentDate = new Date(year, month, day);
          // Don't include future dates for current year
          if (revenueTimeRange === 'This year' && currentDate > new Date()) {
            break;
          }

          const dateStr = format(currentDate, 'yyyy-MM-dd');
          if (dataMap.has(dateStr)) {
            monthTotal += dataMap.get(dateStr);
          }
        }

        return monthTotal;
      }

      // Default case
      else {
        const dateStr = format(date, 'yyyy-MM-dd');
        return dataMap.has(dateStr) ? dataMap.get(dateStr) : 0;
      }
    });

    // Generate labels for the complete date range
    const completeLabels = dateRange.map((date, index) =>
      formatLabel(date, index, dateRange.length)
    );

    return {
      revenueData: completeData,
      revenueLabels: completeLabels
    };
  }, [revenueData, timeframe, revenueTimeRange]);

  // Handle stock symbol change
  const handleStockSymbolChange = (symbol: string) => {
    setStockSymbol(symbol);
  };

  // Handle stock time range change
  const handleStockTimeRangeChange = (range: string) => {
    setStockTimeRange(range);
  };

  // Format date as YYYY-MM-DD
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Handle revenue time range change
  const handleRevenueTimeRangeChange = (range: string) => {
    setRevenueTimeRange(range);

    // Update date range based on selected time range
    const today = new Date();
    let newStartDate = new Date(today);
    let newEndDate = new Date(today);
    let newTimeframe: 'day' | 'week' | 'month' | 'year' = 'month';

    switch (range) {
      case 'Last 7 days':
        newStartDate.setDate(today.getDate() - 6);
        newTimeframe = 'day'; // For 7 days, show daily data
        break;
      case 'Last 30 days':
        newStartDate.setDate(today.getDate() - 29);
        newTimeframe = 'day'; // For 30 days, still show daily data
        break;
      case 'Last 90 days':
        newStartDate.setDate(today.getDate() - 89);
        newTimeframe = 'week'; // For 90 days, show weekly data
        break;
      case 'This year':
        newStartDate = new Date(today.getFullYear(), 0, 1);
        newTimeframe = 'month'; // For a year, show monthly data
        break;
      case 'Last year':
        newStartDate = new Date(today.getFullYear() - 1, 0, 1);
        newEndDate = new Date(today.getFullYear() - 1, 11, 31);
        newTimeframe = 'month'; // For a year, show monthly data
        break;
      default:
        newStartDate.setDate(today.getDate() - 29);
        newTimeframe = 'day';
    }

    // Update both date range and timeframe
    setDateRange({
      startDate: formatDate(newStartDate),
      endDate: formatDate(newEndDate)
    });

    // Update the timeframe in the analytics context
    setTimeframe(newTimeframe);
  };

  return (
    <div className="space-y-6">
      {/* Main 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - 3/12 width */}
        <div className="lg:col-span-3 space-y-6">
          {/* Order Categories Card */}
          <StatCard
            title="Order Categories"
            value={categories.length > 0 ?
              formatCurrency(categories.reduce((sum, cat) => sum + Number(cat.revenue), 0)) : "0"}
            badge="Revenue"
            badgeClassName="bg-black text-white"
            change={{
              value: categories.length > 0 ? categories.length : 0,
              label: "active categories",
              timeframe: ""
            }}
            infoTooltip="Categories by revenue contribution"
            onDetailsClick={() => console.log('Details clicked')}
            className="shadow-sm"
            valueClassName="text-2xl"
          >
            {isLoadingCategories ? (
              <div className="flex flex-col items-center justify-center h-[180px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[180px]">
                <p className="text-sm text-muted-foreground">No category data available</p>
              </div>
            ) : (
              <div className="max-h-[180px] overflow-hidden">
                <ProgressBar
                  value={categories.length > 0 && categoryIndex < categories.length ?
                    Math.round(categories[categoryIndex].percentage) : 0
                  }
                  className="mt-4 mb-4"
                />
                <CategoryNavigation
                  category={currentCategory}
                  change={categories.length > 0 && categoryIndex < categories.length ?
                    Math.round(categories[categoryIndex].percentage) : 0}
                  changeSuffix="%"
                  changeLabel="of total"
                  onPrevious={handlePreviousCategory}
                  onNext={handleNextCategory}
                />
              </div>
            )}
          </StatCard>

          {/* Customer Segments Card */}
          <StatCard
            title="Customer Segments"
            value={clientSegments && clientSegments.length > 0
              ? formatCurrency(clientSegments.reduce((sum, segment) => sum + segment.total_revenue, 0))
              : "Loading..."}
            change={{
              value: clientSegments && clientSegments.length > 0
                ? clientSegments.find(s => s.segment === 'New')?.percentage || 0
                : 0,
              timeframe: "new clients"
            }}
            infoTooltip="Revenue breakdown by customer segment"
            className="shadow-sm"
          >
            {isLoadingClientSegments ? (
              <div className="flex flex-col items-center justify-center h-[180px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading segments...</p>
              </div>
            ) : clientSegments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[180px]">
                <p className="text-sm text-muted-foreground">No segment data available</p>
              </div>
            ) : (
              <div className="flex mt-4 max-h-[180px] overflow-hidden">
                <div className="w-2/5 pr-2">
                  <DonutChart segments={customerSegmentsForChart} className="w-full" />
                </div>
                <div className="w-3/5 pl-2">
                  <SegmentLegend segments={customerSegmentsForChart} />
                </div>
              </div>
            )}
          </StatCard>

          {/* Marketing Channels Card */}
          <MarketingChannelsCard
            value="82%"
            change={{ value: 2.1, timeframe: "vs last week" }}
            channels={marketingChannels}
            metrics={marketingMetrics}
            className="shadow-sm bg-card dark:bg-gray-900"
            onDetailsClick={() => console.log('Marketing details clicked')}
            onViewReportsClick={() => console.log('View reports clicked')}
          />
        </div>

        {/* Center Column - 6/12 width */}
        <div className="lg:col-span-6 space-y-6">
          {/* Revenue Area Chart */}
          <RevenueAreaChart
            title="Total Revenue"
            subtitle="Revenue performance for the selected period"
            data={chartData}
            labels={chartLabels}
            timeRange={revenueTimeRange}
            onTimeRangeChange={handleRevenueTimeRangeChange}
            className="shadow-md border-0 dark:bg-gray-900/70"
            chartHeight={300} // Set a specific height for the chart
            isLoading={isLoadingRevenue}
          />

          {/* Stock Market Tracker and KPI Cards Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Stock Market Tracker and Product Categories on the left */}
            <div className="md:col-span-5 space-y-2">
              {/* Stock Market Tracker */}
              <StockMarketTracker
                stockSymbol={stockSymbol}
                stockName={stockSymbol}
                initialTimeRange={'1W' as any}
                onSymbolChange={handleStockSymbolChange}
                onTimeRangeChange={handleStockTimeRangeChange}
                className="shadow-sm"
                chartHeight={100} // Further reduced height to prevent distortion
              />

              {/* Order Categories Card */}
              <StatCard
                title="Order Categories"
                value={categories.length > 0 ?
                  formatCurrency(categories.reduce((sum, cat) => sum + Number(cat.revenue), 0)) : "0"}
                badge="Revenue"
                change={{
                  value: categories.length > 0 ? categories.length : 0,
                  timeframe: "active categories"
                }}
                infoTooltip="Categories by revenue contribution"
                className="shadow-sm"
                titleClassName="text-sm"
                valueClassName="text-lg"
              >
                {isLoadingCategories ? (
                  <div className="flex items-center justify-center h-[60px]">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="max-h-[60px] overflow-hidden">
                    <ProgressBar
                      value={categories.length > 0 && categoryIndex < categories.length ?
                        Math.round(categories[categoryIndex].percentage) : 0
                      }
                      className="mt-1 mb-1"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Top category: {categories.length > 0 ? categories[0].name : 'None'} ({categories.length > 0 ? Math.round(categories[0].percentage) : 0}%)
                    </div>
                  </div>
                )}
              </StatCard>
            </div>

            {/* Three KPI Cards stacked vertically on the right */}
            <div className="md:col-span-7 space-y-2">
              <KPICardWithChart
                title="Revenue Growth"
                value={summaryMetrics ? formatCurrency(summaryMetrics.totalRevenue).replace('UGX', 'USh') : 'Loading...'}
                change={7.2}
                changeLabel="vs last month"
                className="bg-card border-border shadow-sm"
                valueClassName="text-card-foreground"
                icon={<ArrowUpRightIcon className="h-5 w-5 text-primary" />}
                iconClassName="bg-primary/10 dark:bg-primary/20"
                chartType="line"
                chartHeight={60}
                chartColor="hsl(var(--primary))" // Use primary theme color for consistency
                isLoading={isLoadingSummary}
                chartData={{
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                  datasets: [
                    {
                      data: [12, 19, 15, 22, 18, 25, 31],
                      borderColor: 'hsl(var(--primary))', // Use primary theme color
                      backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        if (!ctx) return 'hsla(var(--primary), 0.2)';
                        // Let the component handle gradient creation
                        return 'hsl(var(--primary))';
                      },
                      fill: true,
                    },
                  ],
                }}
              />

              <KPICardWithChart
                title="Monthly Expenses"
                value={summaryMetrics ? formatCurrency(summaryMetrics.totalExpenses) : 'Loading...'}
                change={-2.5}
                changeLabel="vs last month"
                icon={<BanknoteIcon className="h-5 w-5 text-primary" />}
                iconClassName="bg-primary/10 dark:bg-primary/20"
                chartType="bar"
                chartHeight={60} // Reduced height for better stacking
                chartColor="hsl(var(--primary))" // Use primary theme color for consistency
                isLoading={isLoadingSummary}
                chartData={{
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                  datasets: [
                    {
                      data: [8, 12, 9, 14, 10, 7, 11],
                      borderColor: 'hsl(var(--primary))',
                      backgroundColor: 'hsl(var(--primary))',
                      borderRadius: 4,
                      borderWidth: 0,
                    },
                  ],
                }}
                className="bg-card border-border shadow-sm"
                valueClassName="text-card-foreground"
              />

              <KPICardWithChart
                title="Customer Acquisition"
                value="128"
                change={4.6}
                changeLabel="vs last month"
                icon={<UsersIcon className="h-5 w-5 text-primary" />}
                iconClassName="bg-primary/10 dark:bg-primary/20"
                chartType="line"
                chartHeight={60}
                chartColor="hsl(var(--primary))" // Use primary theme color for consistency
                className="bg-card border-border shadow-sm"
                valueClassName="text-card-foreground"
                chartData={{
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                  datasets: [
                    {
                      data: [15, 23, 18, 25, 27, 24, 28],
                      borderColor: 'hsl(var(--primary))', // Use primary theme color
                      backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        if (!ctx) return 'hsla(var(--primary), 0.2)';
                        // Let the component handle gradient creation
                        return 'hsl(var(--primary))';
                      },
                      fill: true,
                    },
                  ],
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Column - 3/12 width */}
        <div className="lg:col-span-3 space-y-6">
          {/* Spending Summary Card */}
          <SpendingSummaryCard
            totalSpend={totalSpend}
            spendingLimit={spendingLimit}
            categories={spendingCategories}
            className="shadow-sm"
            defaultTimeRange={spendingTimeRange}
            isLoading={isLoadingSpending}
            onTimeRangeChange={(timeRange) => setSpendingTimeRange(timeRange)}
          />
        </div>
      </div>
    </div>
  );
}
