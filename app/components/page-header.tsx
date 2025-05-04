'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  description: string;
  action?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
}

/**
 * Reusable page header component with title, description, and optional action button
 */
export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>
      
      {action && (
        <Button
          onClick={action.onClick}
          className="h-10"
        >
          {action.icon && <span className="mr-2">{action.icon}</span>}
          {action.label}
        </Button>
      )}
    </div>
  );
}
