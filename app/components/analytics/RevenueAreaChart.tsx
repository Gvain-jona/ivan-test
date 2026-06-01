'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
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

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-emerald-500 text-white rounded-lg shadow-lg px-5 py-3 text-sm">
      <div className="font-semibold text-base">{formatCurrency(payload[0].value)}</div>
      {label && <div className="text-xs opacity-90 mt-1 font-medium">{label}</div>}
    </div>
  );
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
  const chartData = data.map((value, i) => ({ label: labels[i] ?? '', value }));

  const tickStyle = { fontSize: 13, fill: 'rgb(156, 163, 175)' };

  return (
    <Card className={cn('overflow-hidden', className)}>
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
                  'text-sm py-2',
                  timeRange === option && 'bg-accent text-accent-foreground font-medium'
                )}
                onClick={() => onTimeRangeChange?.(option)}
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
            <div className="absolute inset-0 animate-pulse bg-muted" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 20, bottom: 10, left: 10 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity={0.8} />
                    <stop offset="40%" stopColor="rgb(16, 185, 129)" stopOpacity={0.6} />
                    <stop offset="70%" stopColor="rgb(16, 185, 129)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.1)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={tickStyle}
                  tickLine={false}
                  axisLine={false}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  tickFormatter={(v) => formatCurrency(v as number, true)}
                  tick={tickStyle}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="rgb(16, 185, 129)"
                  strokeWidth={3}
                  fill="url(#revenueGrad)"
                  dot={false}
                  activeDot={{ r: 8, fill: 'white', stroke: 'rgb(16, 185, 129)', strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
