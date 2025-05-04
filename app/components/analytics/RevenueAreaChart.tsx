'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Line } from 'react-chartjs-2';
import { ChartData, ChartOptions } from 'chart.js';
import { formatCurrency } from '@/lib/chart-config';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RevenueAreaChartProps {
  title?: string;
  subtitle?: string;
  data: number[];
  labels: string[];
  className?: string;
  isLoading?: boolean;
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  timeRangeOptions?: string[];
  chartHeight?: number;
}

export function RevenueAreaChart({
  title = 'Total revenue of this year',
  subtitle = 'Online and offline Revenue Of Sales Performance',
  data,
  labels,
  className,
  isLoading = false,
  timeRange = 'Last 30 days',
  onTimeRangeChange,
  timeRangeOptions = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'This year', 'Last year'],
  chartHeight = 400,
}: RevenueAreaChartProps) {
  const chartRef = useRef<any>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipData, setTooltipData] = useState({
    position: { x: 0, y: 0 },
    value: 0,
    label: '',
    index: 0,
  });

  // Create gradient for chart
  const createGradient = (ctx: CanvasRenderingContext2D | null) => {
    if (!ctx) return 'rgba(16, 185, 129, 0.2)'; // Fallback color

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    // Create a more solid gradient that doesn't fade as much at the edges
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.8)');   // More opaque at top
    gradient.addColorStop(0.4, 'rgba(16, 185, 129, 0.6)');  // Still quite visible
    gradient.addColorStop(0.7, 'rgba(16, 185, 129, 0.3)');  // Starting to fade
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.05)');   // Almost transparent at bottom
    return gradient;
  };

  // Chart data
  const chartData: ChartData<'line'> = {
    labels: labels,
    datasets: [
      {
        label: 'Revenue',
        data: data,
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: 'white',
        pointHoverBorderColor: 'rgb(16, 185, 129)',
        pointHoverBorderWidth: 3,
        tension: 0.4,
        fill: true,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          return createGradient(ctx);
        },
        // Make the line smoother
        cubicInterpolationMode: 'monotone',
      },
    ],
  };

  // Chart options
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 20,
        right: 20,
        bottom: 10,
        left: 10
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 13,
            family: 'Inter, sans-serif',
          },
          color: 'rgb(156, 163, 175)',
          padding: 10,
          maxRotation: 0,
          // Customize tick display based on time range
          maxTicksLimit: (() => {
            switch (timeRange) {
              case 'Last 7 days':
                return 7; // Show all 7 days
              case 'Last 30 days':
                return 10; // Show about 10 ticks for 30 days
              case 'Last 90 days':
                return data.length; // Show all weeks
              case 'This year':
              case 'Last year':
                return 12; // Show all 12 months
              default:
                return data.length > 30 ? 10 : (data.length > 14 ? 7 : undefined);
            }
          })(),
          // Auto-skip based on data density
          autoSkip: timeRange !== 'This year' && timeRange !== 'Last year' && timeRange !== 'Last 7 days',
          autoSkipPadding: 10,
          // Only show non-empty labels
          callback: (value, index) => {
            return labels[index] !== '' ? labels[index] : null;
          },
        },
        border: {
          display: false,
        }
      },
      y: {
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
          drawBorder: false,
          lineWidth: 1,
        },
        border: {
          display: false,
        },
        ticks: {
          font: {
            size: 13,
            family: 'Inter, sans-serif',
          },
          color: 'rgb(156, 163, 175)',
          padding: 10,
          callback: (value) => formatCurrency(value as number, true), // Format as currency with compact notation
          // Add more space between ticks
          count: 5,
        },
        // Don't force minimum to allow natural scaling
        min: undefined,
        // Add some padding to the scale
        afterFit: (scaleInstance) => {
          scaleInstance.paddingLeft = 20;
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false, // Disable default tooltip
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

    const canvasPosition = chart.canvas.getBoundingClientRect();
    const mouseX = event.clientX - canvasPosition.left;
    const mouseY = event.clientY - canvasPosition.top;

    // Find the closest point
    const activeElements = chart.getElementsAtEventForMode(
      event,
      'nearest',
      { intersect: false },
      true
    );

    if (activeElements.length > 0) {
      const { datasetIndex, index } = activeElements[0];
      const value = chart.data.datasets[datasetIndex].data[index];
      const label = chart.data.labels[index];

      setTooltipData({
        position: { x: mouseX, y: mouseY - 90 }, // Position well above the point
        value: value as number,
        label: label as string,
        index: index,
      });
      setTooltipVisible(true);
    } else {
      setTooltipVisible(false);
    }
  };

  // Format date based on the selected time range
  const formatDateByTimeRange = (index: number) => {
    if (index < 0 || index >= data.length) return `Point ${index + 1}`;

    // Get the date from the index based on the time range
    const today = new Date();
    let date = new Date(today);

    switch (timeRange) {
      case 'Last 7 days':
        // For last 7 days, show full date with day of week
        date = new Date(today);
        date.setDate(today.getDate() - (6 - index));
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });

      case 'Last 30 days':
        // For last 30 days, show month and day
        date = new Date(today);
        date.setDate(today.getDate() - (29 - index));
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });

      case 'Last 90 days':
        // For last 90 days, show week starting date
        // Calculate the week number
        const weekIndex = Math.floor(index / 7);
        date = new Date(today);
        date.setDate(today.getDate() - 89 + (weekIndex * 7));
        return `Week of ${date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })}`;

      case 'This year':
        // For this year, show month name
        if (index < 12) {
          date = new Date(today.getFullYear(), index, 1);
          return date.toLocaleDateString('en-US', { month: 'long' });
        }
        return `Month ${index + 1}`;

      case 'Last year':
        // For last year, show month name
        if (index < 12) {
          date = new Date(today.getFullYear() - 1, index, 1);
          return date.toLocaleDateString('en-US', { month: 'long' });
        }
        return `Month ${index + 1}`;

      default:
        // Default case - show the point number
        return `Point ${index + 1}`;
    }
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setTooltipVisible(false);
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-4 pt-6 px-6">
        <div>
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center text-sm font-medium bg-muted/50 hover:bg-muted px-3 py-2 rounded-md transition-colors">
              {timeRange}
              <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px]">
            {timeRangeOptions.map((option) => (
              <DropdownMenuItem
                key={option}
                className={cn(
                  "text-sm py-2",
                  timeRange === option && "bg-accent text-accent-foreground font-medium"
                )}
                onClick={() => onTimeRangeChange && onTimeRangeChange(option)}
              >
                {option}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative w-full px-4 pb-4" style={{ height: `${chartHeight}px` }}>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse bg-muted h-full w-full"></div>
            </div>
          ) : (
            <div className="relative h-full">
              {/* Custom tooltip */}
              {tooltipVisible && (
                <div
                  className="absolute z-10 pointer-events-none bg-emerald-500 text-white rounded-lg shadow-lg px-5 py-3 text-sm"
                  style={{
                    left: tooltipData.position.x,
                    top: tooltipData.position.y - 10, // Position it a bit higher
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="font-semibold text-base">{formatCurrency(tooltipData.value)}</div>
                  <div className="text-xs opacity-90 mt-1 font-medium">
                    {tooltipData.label ? tooltipData.label : formatDateByTimeRange(tooltipData.index)}
                  </div>
                  <div className="absolute bottom-[-8px] left-1/2 transform -translate-x-1/2 w-4 h-4 bg-emerald-500 rotate-45"></div>
                </div>
              )}

              <Line
                ref={chartRef}
                data={chartData}
                options={chartOptions}
                onMouseMove={handleChartHover}
                onMouseLeave={handleMouseLeave}
                className="h-full"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
