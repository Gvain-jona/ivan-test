'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingCardProps {
  title?: string;
  className?: string;
  iconClassName?: string;
  contentClassName?: string;
}

/**
 * A standardized loading card component based on the design of the orders page metrics cards
 */
export function LoadingCard({
  title,
  className,
  iconClassName,
  contentClassName
}: LoadingCardProps) {
  return (
    <Card className={cn(
      "bg-transparent border-[hsl(var(--border))]/40 hover:bg-muted/10 transition-all duration-200 rounded-xl",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        {title ? (
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        ) : (
          <Skeleton className="h-5 w-24" />
        )}
        <div className={cn(
          "w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center",
          iconClassName
        )}>
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-2", contentClassName)}>
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  );
}

/**
 * A grid of loading cards for dashboard metrics
 */
export function LoadingMetricsGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}

/**
 * A loading table component
 */
export function LoadingTable({
  rows = 5,
  columns = 4,
  className
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-8 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-12 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * A loading content section with title and content
 */
export function LoadingSection({
  className,
  hasTitle = true,
  contentType = 'table'
}: {
  className?: string;
  hasTitle?: boolean;
  contentType?: 'table' | 'cards' | 'form';
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {hasTitle && (
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-24" />
        </div>
      )}

      {contentType === 'table' && <LoadingTable />}
      {contentType === 'cards' && <LoadingMetricsGrid />}
      {contentType === 'form' && (
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-[120px]" />
        </div>
      )}
    </div>
  );
}
