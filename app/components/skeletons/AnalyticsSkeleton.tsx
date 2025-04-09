'use client';

import { 
  Skeleton, 
  SkeletonText, 
  SkeletonButton,
  SkeletonCircle
} from "@/components/ui/skeleton";

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <SkeletonText className="h-8 w-48" />
          <SkeletonText className="h-4 w-64" />
        </div>
        <div className="flex space-x-2">
          <SkeletonButton className="w-32" />
          <SkeletonButton className="w-24" />
        </div>
      </div>

      {/* Date range selector */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 items-center">
          <SkeletonButton className="w-24 h-9" />
          <SkeletonButton className="w-24 h-9" />
          <SkeletonButton className="w-24 h-9" />
          <SkeletonButton className="w-24 h-9" />
          <div className="ml-auto flex space-x-2">
            <Skeleton className="w-32 h-9" />
            <SkeletonButton className="w-9 h-9" />
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <div 
            key={i} 
            className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <SkeletonText className="h-4 w-20" />
                <SkeletonText className="h-8 w-24" />
              </div>
              <SkeletonCircle className="h-10 w-10" />
            </div>
            <div className="mt-4">
              <SkeletonText className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Main chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <SkeletonText className="h-6 w-48" />
          <div className="flex space-x-2">
            <SkeletonButton className="w-24 h-8" />
            <SkeletonButton className="w-24 h-8" />
          </div>
        </div>
        <Skeleton className="h-80 w-full" />
      </div>

      {/* Secondary charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <SkeletonText className="h-6 w-40 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>

        {/* Chart 2 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <SkeletonText className="h-6 w-40 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>

      {/* Data table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <SkeletonText className="h-6 w-40 mb-4" />
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-4">
            <SkeletonText className="h-5" />
            <SkeletonText className="h-5" />
            <SkeletonText className="h-5" />
            <SkeletonText className="h-5" />
            <SkeletonText className="h-5" />
          </div>
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <SkeletonText className="h-5 w-3/4" />
              <SkeletonText className="h-5 w-1/2" />
              <SkeletonText className="h-5 w-3/4" />
              <SkeletonText className="h-5 w-1/2" />
              <SkeletonText className="h-5 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
