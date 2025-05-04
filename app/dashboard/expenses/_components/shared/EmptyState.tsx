import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * A reusable empty state component
 */
export function EmptyState({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 border rounded-md bg-muted/10">
      <div className="text-muted-foreground mb-2">
        {icon}
      </div>
      <p className="text-muted-foreground mb-2">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
