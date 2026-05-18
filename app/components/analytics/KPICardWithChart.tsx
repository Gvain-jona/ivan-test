'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

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
  sparklineData?: number[];
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
  sparklineData,
  chartType = 'line',
  chartHeight = 60,
  chartColor = 'hsl(var(--primary))',
}: KPICardWithChartProps) {
  const trendDirection = trend || (change ? (change > 0 ? 'up' : change < 0 ? 'down' : 'neutral') : undefined);
  const formattedChange = change !== undefined ? `${changePrefix}${Math.abs(change).toFixed(1)}${changeSuffix}` : undefined;

  const getTrendColor = () => {
    if (trendDirection === 'up') return 'text-green-500';
    if (trendDirection === 'down') return 'text-red-500';
    return 'text-muted-foreground';
  };

  const getTrendIcon = () => {
    if (trendDirection === 'up') return <ArrowUpIcon className="h-3 w-3" />;
    if (trendDirection === 'down') return <ArrowDownIcon className="h-3 w-3" />;
    return <MinusIcon className="h-3 w-3" />;
  };

  const chartData = (sparklineData ?? [5, 10, 8, 15, 12, 18, 15]).map((v) => ({ v }));

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '4px',
      padding: '4px 8px',
    },
    itemStyle: { color: 'hsl(var(--card-foreground))', fontSize: 11 },
  };

  if (isLoading) {
    return (
      <Card className={cn('overflow-hidden', className)}>
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
        'overflow-hidden transition-all duration-200',
        onClick ? 'cursor-pointer hover:shadow-md' : '',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          {icon && (
            <div className={cn('w-8 h-8 rounded-md flex items-center justify-center', iconClassName)}>
              {icon}
            </div>
          )}
        </div>

        {chartType === 'line' ? (
          <div className="flex mt-4 items-center">
            <div className="flex-1">
              <div className={cn('text-3xl font-bold', valueClassName)}>{value}</div>
              {(formattedChange || changeLabel) && (
                <div className="flex items-center mt-2 text-xs">
                  {formattedChange && (
                    <div className={cn('flex items-center', getTrendColor())}>
                      {getTrendIcon()}
                      <span className="ml-1 font-medium">{formattedChange}</span>
                    </div>
                  )}
                  {changeLabel && <span className="text-muted-foreground ml-1">{changeLabel}</span>}
                </div>
              )}
            </div>
            <div className="w-[180px]" style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [v, '']} labelFormatter={() => ''} />
                  <Area type="monotone" dataKey="v" stroke={chartColor} fill="url(#sparkGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <>
            <div className={cn('text-2xl font-bold mt-4', valueClassName)}>{value}</div>
            {(formattedChange || changeLabel) && (
              <div className="flex items-center mt-2 text-xs">
                {formattedChange && (
                  <div className={cn('flex items-center', getTrendColor())}>
                    {getTrendIcon()}
                    <span className="ml-1">{formattedChange}</span>
                  </div>
                )}
                {changeLabel && <span className="text-muted-foreground ml-1">{changeLabel}</span>}
              </div>
            )}
            <div className="mt-4" style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [v, '']} labelFormatter={() => ''} />
                  <Bar dataKey="v" fill={chartColor} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
