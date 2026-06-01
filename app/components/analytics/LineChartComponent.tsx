'use client';

import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  Area,
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

export interface ChartSeries {
  key: string;
  label?: string;
  color: string;
  type?: 'line' | 'bar' | 'area';
  yAxisId?: 'left' | 'right';
  dashed?: boolean;
}

interface LineChartProps {
  data: Array<Record<string, string | number>>;
  xDataKey: string;
  series: ChartSeries[];
  leftAxisFormatter?: (value: number) => string;
  rightAxis?: { domain?: [number, number]; formatter?: (value: number) => string };
  tooltipFormatter?: (value: number, name: string) => string;
  height?: number;
  title?: string;
  description?: string;
  className?: string;
  isLoading?: boolean;
  showLegend?: boolean;
}

export function LineChartComponent({
  data,
  xDataKey,
  series,
  leftAxisFormatter,
  rightAxis,
  tooltipFormatter,
  height = 300,
  title,
  description,
  className,
  isLoading = false,
  showLegend = true,
}: LineChartProps) {
  const hasRightAxis = series.some((s) => s.yAxisId === 'right');
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
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey={xDataKey}
              tick={tickStyle}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              tickFormatter={leftAxisFormatter}
              tick={tickStyle}
              tickLine={false}
              axisLine={false}
            />
            {hasRightAxis && (
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={rightAxis?.domain}
                tickFormatter={rightAxis?.formatter}
                tick={tickStyle}
                tickLine={false}
                axisLine={false}
              />
            )}
            <Tooltip
              {...tooltipStyle}
              formatter={
                tooltipFormatter
                  ? (value: number, name: string) => [tooltipFormatter(value, name), name]
                  : undefined
              }
            />
            {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {series.map((s) => {
              const axisId = s.yAxisId ?? 'left';
              const dash = s.dashed ? '5 5' : undefined;
              if (s.type === 'bar') {
                return (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    name={s.label ?? s.key}
                    fill={s.color}
                    yAxisId={axisId}
                    radius={[4, 4, 0, 0]}
                  />
                );
              }
              if (s.type === 'area') {
                return (
                  <Area
                    key={s.key}
                    dataKey={s.key}
                    name={s.label ?? s.key}
                    stroke={s.color}
                    fill={`${s.color}20`}
                    yAxisId={axisId}
                    strokeDasharray={dash}
                    type="monotone"
                    dot={false}
                    strokeWidth={2}
                  />
                );
              }
              return (
                <Line
                  key={s.key}
                  dataKey={s.key}
                  name={s.label ?? s.key}
                  stroke={s.color}
                  yAxisId={axisId}
                  strokeDasharray={dash}
                  type="monotone"
                  dot={false}
                  strokeWidth={2}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
