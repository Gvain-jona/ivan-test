'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ShoppingBag, Zap, CircleDollarSign, ChevronDown, InfoIcon, Loader2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { GaugeChartComponent } from './GaugeChartComponent';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SpendingCategory {
  name: string;
  amount: number;
  icon: string | React.ReactNode;
  color: string;
}

interface SpendingSummaryCardProps {
  totalSpend: number;
  spendingLimit?: number;
  categories: SpendingCategory[];
  className?: string;
  timeRanges?: string[];
  defaultTimeRange?: string;
  onTimeRangeChange?: (timeRange: string) => void;
  isLoading?: boolean;
}

export function SpendingSummaryCard({
  totalSpend,
  spendingLimit = 2000000,
  categories,
  className,
  timeRanges = ['Last Week', 'Last Month', 'Last Quarter', 'Last Year'],
  defaultTimeRange = 'Last Week',
  onTimeRangeChange,
  isLoading = false,
}: SpendingSummaryCardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState(defaultTimeRange);

  // Function to render the appropriate icon based on icon name or React node
  const renderIcon = (icon: string | React.ReactNode) => {
    if (typeof icon === 'string') {
      // If icon is a string, render the appropriate icon component
      switch (icon) {
        case 'ShoppingBag':
          return <ShoppingBag className="h-5 w-5 text-white" />;
        case 'Zap':
          return <Zap className="h-5 w-5 text-white" />;
        case 'CircleDollarSign':
          return <CircleDollarSign className="h-5 w-5 text-white" />;
        default:
          return <CircleDollarSign className="h-5 w-5 text-white" />;
      }
    }
    // If icon is already a React node, return it as is
    return icon;
  };

  // Handle time range change
  const handleTimeRangeChange = (timeRange: string) => {
    setSelectedTimeRange(timeRange);
    if (onTimeRangeChange) {
      onTimeRangeChange(timeRange);
    }
  };

  return (
    <Card className={cn("overflow-hidden bg-card dark:bg-gray-900", className)}>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-base font-medium text-foreground">Spending Summary</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs rounded-md"
              >
                {selectedTimeRange}
                <ChevronDown className="ml-2 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {timeRanges.map((timeRange) => (
                <DropdownMenuItem
                  key={timeRange}
                  className={cn(
                    selectedTimeRange === timeRange && "bg-accent"
                  )}
                  onClick={() => handleTimeRangeChange(timeRange)}
                >
                  {timeRange}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Divider */}
        <div className="h-px bg-border dark:bg-gray-800 my-4"></div>

        {/* Gauge Chart */}
        <div className="flex justify-center items-center py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[180px]">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
              <span className="text-sm text-muted-foreground">Loading spending data...</span>
            </div>
          ) : (
            <GaugeChartComponent
              value={totalSpend}
              max={spendingLimit}
              height={180}
              valuePrefix="USh "
              valueLabel="SPEND"
              className="w-full max-w-[240px]"
            />
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-border dark:bg-gray-800 my-4"></div>

        {/* Categories */}
        <div className="grid grid-cols-3 gap-4">
          {isLoading ? (
            // Loading skeleton for categories
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-muted animate-pulse mb-2"></div>
                  <div className="h-4 w-16 bg-muted animate-pulse mb-1 rounded"></div>
                  <div className="h-6 w-20 bg-muted animate-pulse rounded"></div>
                </div>
              ))}
            </>
          ) : (
            // Actual categories
            categories.map((category) => (
              <div key={category.name} className="flex flex-col items-center text-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center mb-2",
                    category.color
                  )}
                >
                  {renderIcon(category.icon)}
                </div>
                <span className="text-sm text-muted-foreground">{category.name}</span>
                <span className="text-lg font-semibold">{formatCurrency(category.amount)}</span>
              </div>
            ))
          )}
        </div>

        {/* Spending Limit */}
        {spendingLimit && (
          <div className="mt-4 pt-4 border-t border-border dark:border-gray-800">
            <div className="flex items-center justify-center">
              <CircleDollarSign className="h-4 w-4 text-muted-foreground mr-2" />
              {isLoading ? (
                <div className="h-4 w-48 bg-muted animate-pulse rounded"></div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Your {selectedTimeRange.toLowerCase()} spending limit is {formatCurrency(spendingLimit)}.
                </p>
              )}
              <div className="ml-1 h-4 w-4 rounded-full bg-muted flex items-center justify-center">
                <InfoIcon className="h-2.5 w-2.5 text-muted-foreground" />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
