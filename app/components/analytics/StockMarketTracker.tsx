'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Line } from 'react-chartjs-2';
import { ChartData, ChartOptions } from 'chart.js';
import { lineChartOptions } from '@/lib/chart-config';
import { cn } from '@/lib/utils';
import { TrendingUp, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface StockMarketTrackerProps {
  stockSymbol?: string;
  stockName?: string;
  className?: string;
  initialTimeRange?: '1D' | '1W' | '1M' | '3M' | '1Y';
  onTimeRangeChange?: (timeRange: string) => void;
  onSymbolChange?: (symbol: string) => void;
  chartHeight?: number;
}

interface StockData {
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  chartData: {
    labels: string[];
    prices: number[];
  };
}

export function StockMarketTracker({
  stockSymbol = 'ACME',
  stockName = 'ACME TECH INC.',
  className,
  initialTimeRange = '1W',
  onTimeRangeChange,
  onSymbolChange,
  chartHeight = 200,
}: StockMarketTrackerProps) {
  const [timeRange, setTimeRange] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>(initialTimeRange);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipData, setTooltipData] = useState({ price: 0, position: { x: 0, y: 0 } });
  const chartRef = useRef<any>(null);

  // Mock data generator - in a real app, this would be an API call
  const generateMockData = (range: '1D' | '1W' | '1M' | '3M' | '1Y') => {
    setIsLoading(true);

    // Generate different data points based on time range
    const dataPoints = range === '1D' ? 24 :
                      range === '1W' ? 7 :
                      range === '1M' ? 30 :
                      range === '3M' ? 90 :
                      250; // 1Y

    const basePrice = 440;
    const volatility = range === '1D' ? 2 :
                      range === '1W' ? 5 :
                      range === '1M' ? 10 :
                      range === '3M' ? 20 :
                      40; // 1Y

    const labels: string[] = [];
    const prices: number[] = [];

    // Generate random price data with some trend
    for (let i = 0; i < dataPoints; i++) {
      const randomChange = (Math.random() - 0.48) * volatility;
      const price = i === 0 ? basePrice : prices[i - 1] + randomChange;
      prices.push(parseFloat(price.toFixed(2)));

      // Generate appropriate labels based on time range
      if (range === '1D') {
        const hour = Math.floor(i * (24 / dataPoints));
        labels.push(`${hour}:00`);
      } else if (range === '1W') {
        const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i % 7];
        labels.push(day);
      } else {
        labels.push(`Day ${i + 1}`);
      }
    }

    const currentPrice = prices[prices.length - 1];
    const previousClose = basePrice - 2 + Math.random() * 4;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    const mockData: StockData = {
      currentPrice,
      previousClose,
      change,
      changePercent,
      open: previousClose + (Math.random() - 0.5) * 2,
      high: Math.max(...prices),
      low: Math.min(...prices),
      chartData: {
        labels,
        prices,
      }
    };

    setTimeout(() => {
      setStockData(mockData);
      setIsLoading(false);
    }, 500);
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Handle time range change
  const handleTimeRangeChange = (range: '1D' | '1W' | '1M' | '3M' | '1Y') => {
    setTimeRange(range);
    if (onTimeRangeChange) {
      onTimeRangeChange(range);
    }
    generateMockData(range);
  };

  // Initialize data on mount
  useEffect(() => {
    generateMockData(timeRange);
  }, []);

  // Prepare chart data
  const chartData: ChartData<'line'> = {
    labels: stockData?.chartData.labels || [],
    datasets: [
      {
        label: stockSymbol,
        data: stockData?.chartData.prices || [],
        borderColor: '#1e88e5', // Blue line to match the image
        borderWidth: 2,
        pointRadius: 0, // No points except on hover
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#1e88e5',
        pointHoverBorderColor: 'hsl(var(--background))',
        pointHoverBorderWidth: 2,
        tension: 0.4,
        fill: false,
      },
    ],
  };

  // Chart options
  const chartOptions: ChartOptions<'line'> = {
    ...lineChartOptions as ChartOptions<'line'>,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        display: false,
        grid: {
          display: false,
        },
      },
      y: {
        display: false,
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false, // We'll use custom tooltip
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    hover: {
      mode: 'nearest',
      intersect: false,
    },
  };

  // Handle chart hover
  const handleChartHover = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const chart = chartRef.current;
    if (!chart) return;

    const points = chart.getElementsAtEventForMode(
      event.nativeEvent,
      'nearest',
      { intersect: false },
      true
    );

    if (points.length) {
      const point = points[0];
      const { x, y } = point.element;
      const dataIndex = point.index;
      const price = stockData?.chartData.prices[dataIndex] || 0;

      setTooltipData({
        price,
        position: { x, y },
      });
      setTooltipVisible(true);
    } else {
      setTooltipVisible(false);
    }
  };

  return (
    <Card className={cn("overflow-hidden bg-card dark:bg-gray-900 border-border", className)}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">Stock Market</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs rounded-md"
              >
                {stockSymbol}
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {['ACME', 'TECH', 'GLOB', 'FNCE'].map((symbol) => (
                <DropdownMenuItem
                  key={symbol}
                  className={cn(
                    "text-xs py-1",
                    stockSymbol === symbol && "bg-accent"
                  )}
                  onClick={() => onSymbolChange && onSymbolChange(symbol)}
                >
                  {symbol}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stock Price and Change */}
        <div className="mb-3">
          <div className="flex items-baseline">
            <div className="text-2xl font-bold tracking-tight">
              {isLoading ? '...' : formatCurrency(stockData?.currentPrice || 0)}
            </div>
            <div className="ml-2">
              <span
                className={cn(
                  "text-xs font-medium flex items-center",
                  stockData?.change && stockData.change >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
                )}
              >
                {isLoading ? '...' : (
                  <>
                    {stockData?.change && stockData.change >= 0 ? (
                      <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5L19 12L12 19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 19L5 12L12 5M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {formatPercentage(stockData?.changePercent || 0)}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="grid grid-cols-5 mb-3 rounded-lg overflow-hidden border border-border">
          {(['1D', '1W', '1M', '3M', '1Y'] as const).map((range) => (
            <button
              key={range}
              className={cn(
                "h-6 text-xs font-medium transition-colors",
                timeRange === range
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
              onClick={() => handleTimeRangeChange(range)}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="relative w-full" style={{ height: `${chartHeight}px` }}>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse bg-muted h-full w-full rounded-md"></div>
            </div>
          ) : (
            <div className="relative h-full">
              {/* Vertical dotted line for tooltip */}
              {tooltipVisible && (
                <div
                  className="absolute top-0 bottom-0 border-l border-dashed border-border z-10 pointer-events-none"
                  style={{
                    left: tooltipData.position.x,
                    height: '100%'
                  }}
                />
              )}

              <Line
                ref={chartRef}
                data={chartData}
                options={chartOptions}
                onMouseMove={handleChartHover}
                onMouseLeave={() => setTooltipVisible(false)}
                className="h-full"
              />

              {/* Custom tooltip */}
              {tooltipVisible && (
                <div
                  className="absolute pointer-events-none bg-popover text-popover-foreground font-medium rounded-md shadow-md px-3 py-1.5 text-sm z-20 border border-border"
                  style={{
                    left: tooltipData.position.x,
                    top: tooltipData.position.y - 40,
                    transform: 'translateX(-50%)'
                  }}
                >
                  {formatCurrency(tooltipData.price)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stock Info */}
        <div className="flex justify-between items-center mt-3 py-2 px-3 text-xs rounded-lg border border-border">
          <div className="flex gap-4">
            <div>
              <span className="text-muted-foreground">Open</span>{' '}
              <span className="text-foreground font-medium">{isLoading ? '...' : formatCurrency(stockData?.open || 0).replace('$', '')}</span>
            </div>
            <div>
              <span className="text-muted-foreground">High</span>{' '}
              <span className="text-foreground font-medium">{isLoading ? '...' : formatCurrency(stockData?.high || 0).replace('$', '')}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Low</span>{' '}
              <span className="text-foreground font-medium">{isLoading ? '...' : formatCurrency(stockData?.low || 0).replace('$', '')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
