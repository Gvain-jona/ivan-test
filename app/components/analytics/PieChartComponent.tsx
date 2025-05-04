'use client';

import React from 'react';
import { Pie, Doughnut } from 'react-chartjs-2';
import { ChartData, ChartOptions } from 'chart.js';
import { pieChartOptions } from '@/lib/chart-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PieChartProps {
  title?: string;
  description?: string;
  data: ChartData<'pie' | 'doughnut'>;
  options?: Partial<ChartOptions<'pie' | 'doughnut'>>;
  height?: number;
  className?: string;
  isLoading?: boolean;
  showLegend?: boolean;
  type?: 'pie' | 'doughnut';
  centerText?: string;
}

export function PieChartComponent({
  title,
  description,
  data,
  options = {},
  height = 300,
  className,
  isLoading = false,
  showLegend = true,
  type = 'pie',
  centerText,
}: PieChartProps) {
  const mergedOptions: ChartOptions<'pie' | 'doughnut'> = {
    ...pieChartOptions as ChartOptions<'pie' | 'doughnut'>,
    ...options,
    plugins: {
      ...pieChartOptions.plugins,
      ...options.plugins,
      legend: {
        ...pieChartOptions.plugins?.legend,
        ...options.plugins?.legend,
        display: showLegend,
      },
      tooltip: {
        ...pieChartOptions.plugins?.tooltip,
        ...options.plugins?.tooltip,
      },
    },
    maintainAspectRatio: false,
  };

  // Add center text plugin if centerText is provided
  if (centerText && type === 'doughnut') {
    mergedOptions.plugins = {
      ...mergedOptions.plugins,
      doughnutLabel: {
        labels: [
          {
            text: centerText,
            font: {
              size: '16',
              weight: 'bold',
            },
            color: 'rgb(var(--foreground))',
          },
        ],
      },
    };
  }

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        {title && (
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-1/3" />
            {description && <Skeleton className="h-4 w-1/2 mt-1" />}
          </CardHeader>
        )}
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <div style={{ height: height, position: 'relative' }}>
          {type === 'pie' ? (
            <Pie
              data={data}
              options={mergedOptions}
              height={height}
            />
          ) : (
            <Doughnut
              data={data}
              options={mergedOptions}
              height={height}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
