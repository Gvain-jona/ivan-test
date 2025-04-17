'use client';

import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// Types
type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type LoadingVariant = 'default' | 'primary' | 'secondary' | 'destructive' | 'ghost';

// Size mappings for spinner
const spinnerSizeMap: Record<LoadingSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

// Color mappings for spinner
const spinnerColorMap: Record<LoadingVariant, string> = {
  default: 'text-muted-foreground',
  primary: 'text-primary',
  secondary: 'text-secondary',
  destructive: 'text-destructive',
  ghost: 'text-muted-foreground/50'
};

/**
 * LoadingSpinner - A simple spinner component for indicating loading states
 */
export function LoadingSpinner({
  size = 'md',
  variant = 'primary',
  className = '',
}: {
  size?: LoadingSize;
  variant?: LoadingVariant;
  className?: string;
}) {
  return (
    <Loader2
      className={cn(
        'animate-spin',
        spinnerSizeMap[size],
        spinnerColorMap[variant],
        className
      )}
    />
  );
}

/**
 * LoadingState - A centered loading state with optional message
 */
export function LoadingState({
  message = 'Loading...',
  size = 'md',
  variant = 'primary',
  className = '',
}: {
  message?: string;
  size?: LoadingSize;
  variant?: LoadingVariant;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-4', className)}>
      <LoadingSpinner size={size} variant={variant} className="mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/**
 * LoadingButton - A button that shows a loading state
 */
export function LoadingButton({
  children,
  isLoading,
  loadingText = 'Loading...',
  spinnerSize = 'sm',
  disabled,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Button> & {
  isLoading: boolean;
  loadingText?: string;
  spinnerSize?: LoadingSize;
}) {
  return (
    <Button
      disabled={isLoading || disabled}
      className={cn(isLoading && 'opacity-80', className)}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size={spinnerSize} className="mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/**
 * TableSkeleton - A skeleton loader for tables
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  hasHeader = true,
  hasActions = true,
  className = '',
}: {
  rows?: number;
  columns?: number;
  hasHeader?: boolean;
  hasActions?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Table header */}
      {hasHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          {hasActions && (
            <div className="flex space-x-2">
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="border rounded-md overflow-hidden">
        {/* Table header row */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-muted/5 border-b">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={`header-${i}`}
              className={cn(
                'h-5',
                i === 0 ? 'col-span-4' : 'col-span-2',
                i === columns - 1 && hasActions ? 'col-span-2' : ''
              )}
            />
          ))}
        </div>

        {/* Table rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid grid-cols-12 gap-4 p-4 border-b last:border-0"
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                className={cn(
                  'h-5',
                  colIndex === 0 ? 'col-span-4' : 'col-span-2',
                  colIndex === columns - 1 && hasActions ? 'col-span-2' : ''
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * CardSkeleton - A skeleton loader for cards
 */
export function CardSkeleton({
  hasHeader = true,
  hasFooter = false,
  contentRows = 3,
  className = '',
}: {
  hasHeader?: boolean;
  hasFooter?: boolean;
  contentRows?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        className
      )}
    >
      {/* Card header */}
      {hasHeader && (
        <div className="p-6 flex flex-col space-y-1.5 border-b">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}

      {/* Card content */}
      <div className="p-6 space-y-4">
        {Array.from({ length: contentRows }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>

      {/* Card footer */}
      {hasFooter && (
        <div className="p-6 flex justify-end border-t">
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      )}
    </div>
  );
}

/**
 * FormSkeleton - A skeleton loader for forms
 */
export function FormSkeleton({
  fields = 4,
  hasButtons = true,
  className = '',
}: {
  fields?: number;
  hasButtons?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}

      {hasButtons && (
        <div className="flex justify-end space-x-2 pt-4">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      )}
    </div>
  );
}

/**
 * MetricCardSkeleton - A skeleton loader for metric cards
 */
export function MetricCardSkeleton({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4',
        className
      )}
    >
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

/**
 * MetricCardsGrid - A grid of metric card skeletons
 */
export function MetricCardsGrid({
  count = 4,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * LoadingError - A component for displaying loading errors with a retry button
 */
export function LoadingError({
  title = 'Error loading data',
  description = 'There was a problem loading the data. Please try again.',
  onRetry,
  isRetrying = false,
  className = '',
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}) {
  return (
    <Alert variant="destructive" className={cn('shadow-sm', className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span>{description}</span>
        {onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
            className="shrink-0 bg-background text-xs h-8 px-2 mt-2 sm:mt-0"
          >
            {isRetrying ? (
              <>
                <LoadingSpinner size="xs" className="mr-1" />
                Retrying...
              </>
            ) : (
              'Retry'
            )}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * InlineLoading - A simple inline loading indicator
 */
export function InlineLoading({
  text = 'Loading...',
  size = 'sm',
  className = '',
}: {
  text?: string;
  size?: LoadingSize;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center text-muted-foreground', className)}>
      <LoadingSpinner size={size} className="mr-2" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

/**
 * PageSkeleton - A skeleton loader for a full page
 */
export function PageSkeleton({
  hasHeader = true,
  hasMetrics = true,
  hasTable = true,
  className = '',
}: {
  hasHeader?: boolean;
  hasMetrics?: boolean;
  hasTable?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('space-y-8 animate-in fade-in duration-300', className)}>
      {/* Page header */}
      {hasHeader && (
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>
      )}

      {/* Metrics */}
      {hasMetrics && <MetricCardsGrid />}

      {/* Table */}
      {hasTable && <TableSkeleton />}
    </div>
  );
}
