import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EmptyStateMessageProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  isLoading?: boolean;
}

/**
 * A reusable component for displaying empty state messages
 * with consistent styling and behavior
 */
export function EmptyStateMessage({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  isLoading = false
}: EmptyStateMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/10 text-center">
      {icon && (
        <div className="text-muted-foreground mb-3">
          {icon}
        </div>
      )}
      <p className="text-muted-foreground mb-2">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
