'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EmptyStateMessageProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyStateMessage({ message, actionLabel, onAction }: EmptyStateMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 border border-dashed border-border rounded-lg bg-muted/30">
      <p className="text-sm text-muted-foreground mb-3">{message}</p>
      {actionLabel && onAction && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onAction}
          className="h-8 px-3 text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
