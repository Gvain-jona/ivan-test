'use client';

import { Skeleton } from "@/components/ui/skeleton";
import {
  LoadingCard,
  LoadingMetricsGrid,
  LoadingTable,
  LoadingSection
} from "@/components/ui/loading-card";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>

      {/* Metrics Cards - Using the standardized loading cards */}
      <LoadingMetricsGrid />

      {/* Quick Actions */}
      <LoadingSection hasTitle={true} contentType="cards" />

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-32 rounded-md" />
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingSection hasTitle={true} contentType="table" />
          <LoadingSection hasTitle={true} contentType="table" />
        </div>
      </div>
    </div>
  );
}
