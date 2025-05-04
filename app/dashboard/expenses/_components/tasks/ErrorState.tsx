'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorStateProps {
  renderFilters: () => React.ReactNode;
}

export function ErrorState({ renderFilters }: ErrorStateProps) {
  return (
    <div className="space-y-4">
      {renderFilters()}
      <Alert variant="error">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load recurring expenses. Please try again later.
        </AlertDescription>
      </Alert>
    </div>
  );
}
