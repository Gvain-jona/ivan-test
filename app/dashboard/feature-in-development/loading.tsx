import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function FeatureInDevelopmentLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Skeleton className="h-8 w-64 bg-muted/60" />
          <Skeleton className="h-4 w-72 mt-2 bg-muted/40" />
        </div>
      </div>

      {/* Construction Banner Skeleton */}
      <Card className="border-muted/40 text-foreground rounded-xl">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full bg-muted/60" />
            <div className="text-center md:text-left w-full">
              <Skeleton className="h-6 w-48 mb-2 bg-muted/60" />
              <Skeleton className="h-4 w-full bg-muted/40" />
              <Skeleton className="h-4 w-full mt-1 bg-muted/40" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="border-muted/40 rounded-xl h-full">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Skeleton className="h-8 w-8 rounded-lg bg-muted/60" />
                <Skeleton className="h-5 w-24 rounded-full bg-muted/40" />
              </div>
              <Skeleton className="h-6 w-48 mt-4 bg-muted/60" />
            </CardHeader>
            <CardContent className="pb-6">
              <Skeleton className="h-4 w-full bg-muted/40" />
              <Skeleton className="h-4 w-full mt-1 bg-muted/40" />
              <Skeleton className="h-4 w-2/3 mt-1 bg-muted/40" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Timeline Skeleton */}
      <Card className="border-muted/40 rounded-xl mt-8">
        <CardHeader>
          <Skeleton className="h-6 w-48 bg-muted/60" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-6">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="mt-1 h-4 w-4 rounded-full bg-muted/60 flex-shrink-0" />
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start w-full gap-2">
                  <div>
                    <Skeleton className="h-5 w-40 bg-muted/60" />
                    <Skeleton className="h-4 w-56 mt-1 bg-muted/40" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full bg-muted/40" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CTA Skeleton */}
      <div className="my-8 flex justify-center">
        <Skeleton className="h-10 w-40 rounded-full bg-muted/60" />
      </div>

      {/* Feedback Section Skeleton */}
      <Card className="border-muted/40 rounded-xl">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full bg-muted/60" />
            <Skeleton className="h-6 w-48 bg-muted/60" />
            <Skeleton className="h-4 w-full max-w-2xl bg-muted/40" />
            <Skeleton className="h-4 w-full max-w-2xl bg-muted/40" />
            <Skeleton className="h-9 w-32 mt-2 rounded-md bg-muted/60" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 