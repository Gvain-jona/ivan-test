'use client'

import React from 'react'
import { AlertTriangle, FileWarning, RefreshCw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

/**
 * Generic error state component for data fetching errors
 */
export function DataFetchError({ 
  title = "Failed to load data", 
  description = "There was an error loading the data. Please try again.",
  onRetry,
  className
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        {description}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  )
}

/**
 * Empty state component for when no data is found
 */
export function EmptyState({ 
  title = "No data found", 
  description = "There are no items matching your criteria.",
  onRetry,
  className
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="rounded-full bg-muted p-3 mb-4">
        <Search className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        {description}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      )}
    </div>
  )
}

/**
 * Error state component for when a feature is not implemented
 */
export function NotImplementedState({ 
  title = "Feature not implemented", 
  description = "This feature is currently under development.",
  className
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/20 p-3 mb-4">
        <FileWarning className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        {description}
      </p>
    </div>
  )
}

/**
 * Error state component specifically for orders
 */
export function OrdersEmptyState({ 
  onCreateNew,
  className
}: { 
  onCreateNew?: () => void,
  className?: string
}) {
  return (
    <EmptyState
      title="No orders found"
      description="There are no orders matching your current filters."
      className={className}
      onRetry={onCreateNew ? () => onCreateNew() : undefined}
    />
  )
}

/**
 * Error state component specifically for tasks
 */
export function TasksEmptyState({ 
  onCreateNew,
  className
}: { 
  onCreateNew?: () => void,
  className?: string
}) {
  return (
    <EmptyState
      title="No tasks found"
      description="There are no tasks matching your current filters."
      className={className}
      onRetry={onCreateNew ? () => onCreateNew() : undefined}
    />
  )
}
