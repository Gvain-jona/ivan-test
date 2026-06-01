'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface BarSeries {
  key: string;
  label?: string;
  color: string;
}

interface BarChartProps {
  data: Array<Record<string, string | number>>;
  xDataKey: string;
  bars: BarSeries[];
  yTickFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number, name: string) => string;
  horizontal?: boolean;
  height?: number;
  title?: string;
  description?: string;
  className?: string;
  isLoading?: boolean;
  showLegend?: boolean;
}

export function BarChartComponent({
  data,
  xDataKey,
  bars,
  yTickFormatter,
  tooltipFormatter,
  horizontal = false,
  height = 300,
  title,
  description,
  className,
  isLoading = false,
  showLegend = true,
}: BarChartProps) {
  if (isLoading) {
    return (
      <Card className={cn('overflow-hidden', className)}>
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

  const tickStyle = { fontSize: 12, fill: 'hsl(var(--muted-foreground))' };
  const tooltipStyle = {
    contentStyle: {
      backgroundColor: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '6px',
    },
    labelStyle: { color: 'hsl(var(--card-foreground))' },
    itemStyle: { color: 'hsl(var(--card-foreground))' },
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            {horizontal ? (
              <>
                <XAxis type="number" tickFormatter={yTickFormatter} tick={tickStyle} tickLine={false} axisLine={false} />
                <YAxis dataKey={xDataKey} type="category" width={120} tick={tickStyle} tickLine={false} axisLine={false} />
              </>
            ) : (
              <>
                <XAxis dataKey={xDataKey} tick={tickStyle} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={yTickFormatter} tick={tickStyle} tickLine={false} axisLine={false} />
              </>
            )}
            <Tooltip
              {...tooltipStyle}
              formatter={tooltipFormatter ? (value: number, name: string) => [tooltipFormatter(value, name), name] : undefined}
            />
            {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {bars.map((bar) => (
              <Bar
                key={bar.key}
                dataKey={bar.key}
                name={bar.label ?? bar.key}
                fill={bar.color}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
