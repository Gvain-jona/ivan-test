'use client';

import React, { useRef, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { ChartData, ChartOptions } from 'chart.js';
import { lineChartOptions, getGradient, chartColors } from '@/lib/chart-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LineChartProps {
  title?: string;
  description?: string;
  data: ChartData<'line'>;
  options?: Partial<ChartOptions<'line'>>;
  height?: number;
  className?: string;
  isLoading?: boolean;
  showLegend?: boolean;
  fillArea?: boolean;
}

export function LineChartComponent({
  title,
  description,
  data,
  options = {},
  height = 300,
  className,
  isLoading = false,
  showLegend = true,
  fillArea = false,
}: LineChartProps) {
  const chartRef = useRef<any>(null);

  useEffect(() => {
    const chart = chartRef.current;
    
    if (chart && fillArea) {
      const datasets = [...data.datasets];
      
      datasets.forEach((dataset, index) => {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        const color = dataset.borderColor as string;
        
        if (chartArea && ctx) {
          dataset.backgroundColor = getGradient(ctx, chartArea, color);
          dataset.fill = true;
        }
      });
      
      chart.update();
    }
  }, [data, fillArea]);

  const mergedOptions: ChartOptions<'line'> = {
    ...lineChartOptions as ChartOptions<'line'>,
    ...options,
    plugins: {
      ...lineChartOptions.plugins,
      ...options.plugins,
      legend: {
        ...lineChartOptions.plugins?.legend,
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
          <Line
            ref={chartRef}
            data={data}
            options={mergedOptions}
            height={height}
          />
        </div>
      </CardContent>
    </Card>
  );
}
