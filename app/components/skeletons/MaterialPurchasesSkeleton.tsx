'use client';

import { 
  Skeleton, 
  SkeletonText, 
  SkeletonButton,
  SkeletonCircle
} from "@/components/ui/skeleton";

export function MaterialPurchasesSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <SkeletonText className="h-8 w-64" />
          <SkeletonText className="h-4 w-80" />
        </div>
        <div className="flex space-x-2">
          <SkeletonButton className="w-24" />
          <SkeletonButton className="w-32" />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array(3).fill(0).map((_, i) => (
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

      {/* Filters section */}
      <div className="flex flex-wrap gap-2 items-center">
        <SkeletonButton className="w-24 h-9" />
        <SkeletonButton className="w-32 h-9" />
        <SkeletonButton className="w-28 h-9" />
        <div className="ml-auto">
          <SkeletonButton className="w-32 h-9" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Table header */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4">
          <div className="grid grid-cols-12 gap-4">
            <SkeletonText className="col-span-1 h-5" />
            <SkeletonText className="col-span-3 h-5" />
            <SkeletonText className="col-span-2 h-5" />
            <SkeletonText className="col-span-2 h-5" />
            <SkeletonText className="col-span-2 h-5" />
            <SkeletonText className="col-span-2 h-5" />
          </div>
        </div>

        {/* Table rows */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="p-4">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-1">
                  <SkeletonCircle className="h-8 w-8" />
                </div>
                <div className="col-span-3 space-y-2">
                  <SkeletonText className="h-5 w-3/4" />
                  <SkeletonText className="h-4 w-1/2" />
                </div>
                <SkeletonText className="col-span-2 h-5 w-3/4" />
                <SkeletonText className="col-span-2 h-5 w-1/2" />
                <SkeletonText className="col-span-2 h-5 w-3/4" />
                <div className="col-span-2 flex justify-end space-x-2">
                  <SkeletonButton className="h-8 w-8" />
                  <SkeletonButton className="h-8 w-8" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <SkeletonText className="h-5 w-40" />
        <div className="flex space-x-1">
          <SkeletonButton className="h-8 w-8" />
          <SkeletonButton className="h-8 w-8" />
          <SkeletonButton className="h-8 w-8" />
          <SkeletonButton className="h-8 w-8" />
          <SkeletonButton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}
