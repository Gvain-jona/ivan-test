'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="mb-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>
      </div>
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-5 w-1/4" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex items-center p-3 border border-border/30 rounded-md animate-pulse bg-background/5">
                  <Skeleton className="h-5 w-5 rounded-full mr-3" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-24 ml-2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
