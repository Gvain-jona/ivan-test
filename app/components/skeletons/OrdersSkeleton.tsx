'use client';

import { Skeleton } from "@/components/ui/skeleton";
import {
  LoadingMetricsGrid,
  LoadingTable,
  LoadingSection
} from "@/components/ui/loading-card";

export function OrdersSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="w-24 h-9 rounded-md" />
          <Skeleton className="w-24 h-9 rounded-md" />
        </div>
      </div>

      {/* Metrics Cards */}
      <LoadingMetricsGrid />

      {/* Filters section */}
      <div className="flex flex-wrap gap-2 items-center">
        <Skeleton className="w-24 h-9 rounded-md" />
        <Skeleton className="w-32 h-9 rounded-md" />
        <Skeleton className="w-28 h-9 rounded-md" />
        <div className="ml-auto">
          <Skeleton className="w-32 h-9 rounded-md" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/40 overflow-hidden">
        <div className="bg-muted/5 p-4">
          <div className="grid grid-cols-12 gap-4">
            <Skeleton className="col-span-1 h-5" />
            <Skeleton className="col-span-3 h-5" />
            <Skeleton className="col-span-2 h-5" />
            <Skeleton className="col-span-2 h-5" />
            <Skeleton className="col-span-2 h-5" />
            <Skeleton className="col-span-2 h-5" />
          </div>
        </div>

        <div className="divide-y divide-border/10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-1">
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <div className="col-span-3 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="col-span-2 h-5 w-3/4" />
                <Skeleton className="col-span-2 h-5 w-1/2" />
                <Skeleton className="col-span-2 h-5 w-3/4" />
                <div className="col-span-2 flex justify-end space-x-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <Skeleton className="h-5 w-40" />
        <div className="flex space-x-1">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}
