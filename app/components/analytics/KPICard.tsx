'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
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
}

export function KPICard({
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
}: KPICardProps) {
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

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <Skeleton className="h-5 w-1/3" />
            {icon && <Skeleton className="h-8 w-8 rounded-md" />}
          </div>
          <Skeleton className="h-8 w-1/2 mt-4" />
          <Skeleton className="h-4 w-1/4 mt-2" />
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
      </CardContent>
    </Card>
  );
}
