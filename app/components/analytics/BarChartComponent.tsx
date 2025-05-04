'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { ChartData, ChartOptions } from 'chart.js';
import { barChartOptions } from '@/lib/chart-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface BarChartProps {
  title?: string;
  description?: string;
  data: ChartData<'bar'>;
  options?: Partial<ChartOptions<'bar'>>;
  height?: number;
  className?: string;
  isLoading?: boolean;
  showLegend?: boolean;
  horizontal?: boolean;
}

export function BarChartComponent({
  title,
  description,
  data,
  options = {},
  height = 300,
  className,
  isLoading = false,
  showLegend = true,
  horizontal = false,
}: BarChartProps) {
  const mergedOptions: ChartOptions<'bar'> = {
    ...barChartOptions as ChartOptions<'bar'>,
    ...options,
    indexAxis: horizontal ? 'y' : 'x',
    plugins: {
      ...barChartOptions.plugins,
      ...options.plugins,
      legend: {
        ...barChartOptions.plugins?.legend,
        ...options.plugins?.legend,
        display: showLegend,
      },
    },
    maintainAspectRatio: false,
  };

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
        <div style={{ height: height }}>
          <Bar
            data={data}
            options={mergedOptions}
            height={height}
          />
        </div>
      </CardContent>
    </Card>
  );
}
