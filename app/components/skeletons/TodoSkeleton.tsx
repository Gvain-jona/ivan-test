'use client';

import { 
  Skeleton, 
  SkeletonText, 
  SkeletonButton,
  SkeletonCircle
} from "@/components/ui/skeleton";

export function TodoSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <SkeletonText className="h-8 w-48" />
          <SkeletonText className="h-4 w-64" />
        </div>
        <div className="flex space-x-2">
          <SkeletonButton className="w-24" />
          <SkeletonButton className="w-24" />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-8">
          <SkeletonText className="h-10 w-20 border-b-2 border-primary" />
          <SkeletonText className="h-10 w-20" />
          <SkeletonText className="h-10 w-20" />
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {Array(8).fill(0).map((_, i) => (
          <div 
            key={i} 
            className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start space-x-4">
              <SkeletonCircle className="h-6 w-6 mt-1" />
              <div className="flex-1 space-y-2">
                <SkeletonText className="h-5 w-3/4" />
                <SkeletonText className="h-4 w-1/2" />
                <div className="flex items-center space-x-2 mt-3">
                  <SkeletonButton className="h-6 w-16" />
                  <SkeletonButton className="h-6 w-20" />
                </div>
              </div>
              <div className="flex space-x-2">
                <SkeletonButton className="h-8 w-8" />
                <SkeletonButton className="h-8 w-8" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add task form */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <SkeletonCircle className="h-6 w-6" />
          <Skeleton className="h-10 flex-1" />
          <SkeletonButton className="h-10 w-20" />
        </div>
      </div>
    </div>
  );
}
