'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface LoadingStateProps {
  message?: string
  className?: string
}

/**
 * @deprecated Use components from loading.tsx instead
 * Generic loading state component
 */
export function LoadingState({
  message = "Loading data...",
  className
}: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8", className)}>
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

/**
 * Skeleton loader for orders table
 */
export function OrdersTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full space-y-3 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        <Skeleton className="h-8 w-[100px]" />
      </div>

      <div className="border-t pt-4">
        <div className="grid grid-cols-7 gap-4 py-2 font-medium">
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[60px]" />
        </div>

        {Array(rows).fill(0).map((_, i) => (
          <div key={i} className="grid grid-cols-7 gap-4 py-4 border-t">
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-6 w-[100px] rounded-full" />
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton loader for tasks
 */
export function TasksCardSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array(cards).fill(0).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <div className="flex justify-between items-start">
            <Skeleton className="h-5 w-[200px]" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-6 w-[100px] rounded-full" />
            <Skeleton className="h-4 w-[80px]" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton loader for analytics cards
 */
export function AnalyticsCardSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {Array(cards).fill(0).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-5 w-[150px] mb-2" />
              <Skeleton className="h-8 w-[120px]" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <div className="pt-2">
            <Skeleton className="h-[100px] w-full rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}
