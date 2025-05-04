'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Line, Bar } from 'react-chartjs-2';
import { ChartData, ChartOptions } from 'chart.js';
import { formatCurrency } from '@/lib/chart-config';

interface KPICardWithChartProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  valueClassName?: string;
  iconClassName?: string;
  changePrefix?: string;
  changeSuffix?: string;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
  chartData?: ChartData<'line' | 'bar'>;
  chartType?: 'line' | 'bar';
  chartHeight?: number;
  chartColor?: string;
}

export function KPICardWithChart({
  title,
  value,
  change,
  changeLabel,
  icon,
  className,
  isLoading = false,
  valueClassName,
  iconClassName,
  changePrefix = '',
  changeSuffix = '%',
  trend,
  onClick,
  chartData,
  chartType = 'line',
  chartHeight = 60,
  chartColor = 'hsl(var(--primary))',
}: KPICardWithChartProps) {
  // Determine trend direction if not explicitly provided
  const trendDirection = trend || (change ? (change > 0 ? 'up' : change < 0 ? 'down' : 'neutral') : undefined);

  // Format change value
  const formattedChange = change !== undefined ? `${changePrefix}${Math.abs(change).toFixed(1)}${changeSuffix}` : undefined;

  // Determine color based on trend
  const getTrendColor = () => {
    if (trendDirection === 'up') return 'text-green-500';
    if (trendDirection === 'down') return 'text-red-500';
    return 'text-muted-foreground';
  };

  // Determine icon based on trend
  const getTrendIcon = () => {
    if (trendDirection === 'up') return <ArrowUpIcon className="h-3 w-3" />;
    if (trendDirection === 'down') return <ArrowDownIcon className="h-3 w-3" />;
    return <MinusIcon className="h-3 w-3" />;
  };

  // Get theme mode
  const isDarkTheme = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false;

  // Enhanced chart options with better theme handling
  const chartOptions: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        display: false, // Hide x-axis labels
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          display: false,
        }
      },
      y: {
        display: false,
        grid: {
          display: false,
        },
        beginAtZero: true,
        suggestedMax: chartType === 'bar' ? undefined : Math.max(...(chartData?.datasets[0]?.data as number[] || [0])) * 1.2,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'hsl(var(--card))',
        titleColor: 'hsl(var(--card-foreground))',
        bodyColor: 'hsl(var(--card-foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        padding: 8,
        cornerRadius: 4,
        displayColors: false,
        callbacks: {
          title: () => '',
          label: (context) => {
            // Format the tooltip value based on the data type
            const value = context.parsed.y;
            if (typeof value === 'number') {
              // Check if the value looks like currency
              if (String(value).includes('$') || value > 1000) {
                return formatCurrency(value).replace('UGX', 'USh');
              }
              return value.toLocaleString();
            }
            return `${value}`;
          },
        },
      },
    },
    elements: {
      line: {
        tension: 0.4, // Smooth curve
        borderWidth: 2.5,
        borderColor: chartType === 'line'
          ? (chartColor || 'hsl(var(--primary))')
          : chartColor, // Use provided color or theme primary
        fill: 'start',
        cubicInterpolationMode: 'monotone', // Ensures smoother curves
      },
      point: {
        radius: 0,
        hitRadius: 10,
        hoverRadius: 5,
        hoverBackgroundColor: 'hsl(var(--card))',
        hoverBorderWidth: 2,
        hoverBorderColor: chartColor || 'hsl(var(--primary))',
      },
      bar: {
        backgroundColor: chartColor || 'hsl(var(--primary))',
        borderRadius: 4,
        borderWidth: 0,
        // Add a subtle hover effect for bar charts
        hoverBackgroundColor: chartColor
          ? chartColor.includes('rgba')
            ? chartColor.replace(/[\d.]+\)$/, '1)') // Make fully opaque on hover
            : chartColor
          : 'hsl(var(--primary))',
      },
    },
    // Ensure chart text colors respect the theme
    color: 'hsl(var(--card-foreground))',
  };

  // Create gradient for line chart with improved theme handling
  const createGradient = (ctx: CanvasRenderingContext2D | null, color: string) => {
    if (!ctx) return color;

    const gradient = ctx.createLinearGradient(0, 0, 0, 150);
    // Parse the color to get RGB values
    let colorRgb = color;

    try {
      // Handle different color formats
      if (color.includes('var(--')) {
        // Handle HSL variables from theme
        if (color.includes('primary')) {
          // Use primary color from theme
          colorRgb = 'hsl(var(--primary))'; // Use HSL directly
        } else if (color.includes('chart-1')) {
          colorRgb = 'hsl(var(--chart-1))';
        } else if (color.includes('chart-2')) {
          colorRgb = 'hsl(var(--chart-2))';
        } else if (color.includes('destructive')) {
          colorRgb = 'hsl(var(--destructive))';
        } else {
          // Default to primary if no specific color is matched
          colorRgb = 'hsl(var(--primary))';
        }
      }

      // Convert HSL to RGB if needed
      if (colorRgb.startsWith('hsl')) {
        try {
          // For HSL values, we'll use the computed style
          const tempElement = document.createElement('div');
          tempElement.style.color = colorRgb;
          document.body.appendChild(tempElement);
          const computedColor = getComputedStyle(tempElement).color;
          document.body.removeChild(tempElement);

          // Make sure we got a valid color
          if (computedColor && computedColor !== '' && !computedColor.includes('invalid')) {
            colorRgb = computedColor;
          } else {
            // Fallback to theme-appropriate colors if conversion fails
            colorRgb = isDarkTheme
              ? 'rgba(59, 130, 246, 1)' // Blue for dark theme
              : 'rgba(16, 185, 129, 1)'; // Green for light theme
          }
        } catch (e) {
          // Fallback if DOM manipulation fails
          colorRgb = isDarkTheme
            ? 'rgba(59, 130, 246, 1)' // Blue for dark theme
            : 'rgba(16, 185, 129, 1)'; // Green for light theme
        }
      }
    } catch (e) {
      // Fallback to default colors if there's an error
      colorRgb = isDarkTheme
        ? 'rgba(59, 130, 246, 1)' // Blue for dark theme
        : 'rgba(16, 185, 129, 1)'; // Green for light theme
    }

    // Extract the RGB part
    const rgbPart = colorRgb.replace(/rgba?\(|\)/g, '').split(',');
    const r = rgbPart[0]?.trim() || '59';
    const g = rgbPart[1]?.trim() || '130';
    const b = rgbPart[2]?.trim() || '246';

    // Create a better gradient with smoother fade - adjusted for theme
    if (isDarkTheme) {
      // Dark theme needs higher opacity to be visible against dark backgrounds
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1.0)`);   // Fully opaque at top
      gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.9)`); // Still very visible
      gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.8)`); // Medium fade but still visible
      gradient.addColorStop(0.9, `rgba(${r}, ${g}, ${b}, 0.6)`); // More visible in dark mode
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.3)`);   // Still visible at bottom
    } else {
      // Light theme can use more transparency
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1.0)`);   // Fully opaque at top
      gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.8)`); // Still very visible
      gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.6)`); // Medium fade
      gradient.addColorStop(0.9, `rgba(${r}, ${g}, ${b}, 0.3)`); // More transparent
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.1)`);   // Almost transparent at bottom
    }

    return gradient;
  };

  // Default chart data if none provided
  const defaultChartData: ChartData<'line' | 'bar'> = {
    labels: ['', '', '', '', '', '', ''],
    datasets: [
      {
        data: [5, 10, 8, 15, 12, 18, 15],
        borderColor: chartColor || 'hsl(var(--primary))',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          if (chartType === 'line') {
            // For line charts, use gradient
            return createGradient(ctx, chartColor || 'hsl(var(--primary))');
          } else {
            // For bar charts, use solid color
            return chartColor || 'hsl(var(--primary))';
          }
        },
        fill: chartType === 'line',
      },
    ],
  };

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <Skeleton className="h-5 w-1/3" />
            {icon && <Skeleton className="h-8 w-8 rounded-md" />}
          </div>

          {chartType === 'line' ? (
            <div className="flex mt-4 items-center">
              <div className="flex-1">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-4 w-1/4 mt-2" />
              </div>
              <Skeleton className="h-[80px] w-[180px] rounded-md" />
            </div>
          ) : (
            <>
              <Skeleton className="h-8 w-1/2 mt-4" />
              <Skeleton className="h-4 w-1/4 mt-2" />
              <Skeleton className="h-[60px] w-full mt-4 rounded-md" />
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200",
        onClick ? "cursor-pointer hover:shadow-md" : "",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          {icon && (
            <div className={cn("w-8 h-8 rounded-md flex items-center justify-center", iconClassName)}>
              {icon}
            </div>
          )}
        </div>

        {/* For line charts, use a side-by-side layout */}
        {chartType === 'line' ? (
          <div className="flex mt-4 items-center">
            <div className="flex-1">
              <div className={cn("text-3xl font-bold", valueClassName)}>
                {value}
              </div>
              {(formattedChange || changeLabel) && (
                <div className="flex items-center mt-2 text-xs">
                  {formattedChange && (
                    <div className={cn("flex items-center", getTrendColor())}>
                      {getTrendIcon()}
                      <span className="ml-1 font-medium">{formattedChange}</span>
                    </div>
                  )}
                  {changeLabel && (
                    <span className="text-muted-foreground ml-1">
                      {changeLabel}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Chart on the right side with proper height and improved styling */}
            <div className="w-[180px] h-[80px] relative">
              <div className="absolute inset-0 flex items-end">
                <Line
                  data={chartData || defaultChartData}
                  options={chartOptions}
                />
              </div>
            </div>
          </div>
        ) : (
          /* For bar charts, keep the stacked layout */
          <>
            <div className={cn("text-2xl font-bold mt-4", valueClassName)}>
              {value}
            </div>
            {(formattedChange || changeLabel) && (
              <div className="flex items-center mt-2 text-xs">
                {formattedChange && (
                  <div className={cn("flex items-center", getTrendColor())}>
                    {getTrendIcon()}
                    <span className="ml-1">{formattedChange}</span>
                  </div>
                )}
                {changeLabel && (
                  <span className="text-muted-foreground ml-1">
                    {changeLabel}
                  </span>
                )}
              </div>
            )}

            {/* Bar chart below with improved styling */}
            <div className="mt-4 relative" style={{ height: chartHeight }}>
              <div className="absolute inset-0">
                <Bar
                  data={chartData || defaultChartData}
                  options={chartOptions}
                  height={chartHeight}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
