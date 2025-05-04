'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InfoIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  badge?: string;
  badgeClassName?: string;
  change?: {
    value: number;
    label?: string;
    timeframe?: string;
  };
  infoTooltip?: string;
  className?: string;
  titleClassName?: string;
  valueClassName?: string;
  detailsHref?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onDetailsClick?: () => void;
}

export function StatCard({
  title,
  value,
  badge,
  badgeClassName,
  change,
  infoTooltip,
  className,
  titleClassName,
  valueClassName,
  detailsHref,
  children,
  footer,
  onDetailsClick,
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden bg-card", className)}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1">
            <CardTitle className={cn("text-base font-medium text-muted-foreground", titleClassName)}>{title}</CardTitle>
            {infoTooltip && (
              <InfoIcon className="h-4 w-4 text-muted-foreground/50" />
            )}
          </div>
          {(detailsHref || onDetailsClick) && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs rounded-md"
              onClick={onDetailsClick}
              asChild={!!detailsHref}
            >
              {detailsHref ? (
                <a href={detailsHref}>Details</a>
              ) : (
                <span>Details</span>
              )}
            </Button>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div className={cn("text-4xl font-bold", valueClassName)}>{value}</div>
            {badge && (
              <div className={cn("px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-md", badgeClassName)}>
                {badge}
              </div>
            )}
          </div>
          {change && (
            <div className={cn(
              "text-sm font-medium mt-1",
              change.value > 0 && !change.label ? "text-green-500" :
              change.value < 0 && !change.label ? "text-red-500" :
              "text-muted-foreground"
            )}>
              {!change.label && (change.value > 0 ? '+' : '')}{change.value}
              {!change.label && '%'}
              {change.label && <span className="text-muted-foreground"> {change.label}</span>}
              {change.timeframe && <span className="text-muted-foreground"> {change.timeframe}</span>}
            </div>
          )}
        </div>

        {children && (
          <div className="mt-2">
            {children}
          </div>
        )}

        {footer && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
}

export function ProgressBar({ value, max = 100, className, barClassName }: ProgressBarProps) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);
  const segments = 30; // Total number of segments
  const activeSegments = Math.round((percentage / 100) * segments);

  return (
    <div className={cn("w-full h-6 flex gap-[2px]", className)}>
      {Array.from({ length: segments }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "flex-1 h-full",
            index < activeSegments
              ? "bg-orange-500"
              : "bg-muted",
            barClassName
          )}
        />
      ))}
    </div>
  );
}

interface CategoryNavigationProps {
  category: string;
  count?: number | string;
  countLabel?: string;
  change?: number;
  changeSuffix?: string;
  changeLabel?: string;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function CategoryNavigation({
  category,
  count,
  countLabel = "products",
  change,
  changeSuffix = '%',
  changeLabel,
  onPrevious,
  onNext
}: CategoryNavigationProps) {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-1">
        <button
          onClick={onPrevious}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronLeftIcon className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          onClick={onNext}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-medium ml-1">{category}</span>
      </div>

      <div className="flex flex-col items-end">
        {count !== undefined && (
          <span className="text-sm font-medium">
            {count} {countLabel && <span className="text-muted-foreground text-xs ml-1">{countLabel}</span>}
          </span>
        )}
        {change !== undefined && (
          <div className={cn(
            "text-xs",
            change > 0 ? "text-green-500" : change < 0 ? "text-red-500" : "text-muted-foreground"
          )}>
            {change > 0 && changeSuffix === '%' ? '+' : ''}{change}{changeSuffix}
            {changeLabel && <span className="text-muted-foreground ml-1">{changeLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

interface DonutChartProps {
  segments: {
    label: string;
    value: number;
    color: string;
    percentage: number;
  }[];
  className?: string;
}

export function DonutChart({ segments, className }: DonutChartProps) {
  return (
    <div className={cn("relative", className)}>
      <svg viewBox="0 0 100 100" className="w-full h-auto">
        {segments.map((segment, index) => {
          // Calculate the segment's position in the donut
          const total = segments.reduce((sum, seg) => sum + seg.percentage, 0);
          const startAngle = segments
            .slice(0, index)
            .reduce((sum, seg) => sum + (seg.percentage / total) * 360, 0);
          const endAngle = startAngle + (segment.percentage / total) * 360;

          // Convert angles to radians and calculate coordinates
          const startRad = (startAngle - 90) * (Math.PI / 180);
          const endRad = (endAngle - 90) * (Math.PI / 180);

          // Calculate outer arc coordinates
          const outerRadius = 40;
          const x1Outer = 50 + outerRadius * Math.cos(startRad);
          const y1Outer = 50 + outerRadius * Math.sin(startRad);
          const x2Outer = 50 + outerRadius * Math.cos(endRad);
          const y2Outer = 50 + outerRadius * Math.sin(endRad);

          // Calculate inner arc coordinates
          const innerRadius = 25;
          const x1Inner = 50 + innerRadius * Math.cos(endRad);
          const y1Inner = 50 + innerRadius * Math.sin(endRad);
          const x2Inner = 50 + innerRadius * Math.cos(startRad);
          const y2Inner = 50 + innerRadius * Math.sin(startRad);

          // Determine if the arc should be drawn as a large arc
          const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

          // Create the SVG path for the segment (donut shape)
          const path = `
            M ${x1Outer} ${y1Outer}
            A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2Outer} ${y2Outer}
            L ${x1Inner} ${y1Inner}
            A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x2Inner} ${y2Inner}
            Z
          `;

          return (
            <path
              key={index}
              d={path}
              fill={segment.color}
              stroke="var(--card)"
              strokeWidth="0.5"
            />
          );
        })}
      </svg>
    </div>
  );
}

interface SegmentLegendProps {
  segments: {
    label: string;
    value: number;
    color: string;
    percentage: number;
  }[];
}

export function SegmentLegend({ segments }: SegmentLegendProps) {
  return (
    <div className="space-y-3">
      {segments.map((segment, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-sm font-medium">{segment.label}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">${segment.value.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground w-10 text-right">{segment.percentage}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}
