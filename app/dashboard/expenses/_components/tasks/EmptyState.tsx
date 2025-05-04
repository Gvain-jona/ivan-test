'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { FilterType } from './types';

interface EmptyStateProps {
  renderFilters: () => React.ReactNode;
  isDarkMode: boolean;
  searchQuery: string;
  filter: FilterType;
}

export function EmptyState({ renderFilters, isDarkMode, searchQuery, filter }: EmptyStateProps) {
  return (
    <div className="space-y-4">
      {renderFilters()}
      <Card className={cn(
        "border",
        isDarkMode ? "border-white/10 bg-white/5" : "border-background/10 bg-background/5"
      )}>
        <CardContent className="pt-6 pb-6 text-center">
          <div className="flex flex-col items-center justify-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-1">No recurring expenses found.</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Try a different search term or' : filter !== 'all' ? 'Try changing your filter or' : 'Create a new recurring expense to'} get started.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
