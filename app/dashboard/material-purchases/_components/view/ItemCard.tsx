'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ItemCardProps {
  title: string;
  subtitle?: string;
  description?: string | React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  accentColor?: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'gray';
  badges?: React.ReactNode;
}

/**
 * A reusable card component for displaying items like payments and notes
 * with consistent styling and behavior
 * Matches the styling used in expense and order views
 */
export function ItemCard({
  title,
  subtitle,
  description,
  icon,
  actions,
  className,
  accentColor = 'green',
  badges
}: ItemCardProps) {
  // Map color names to tailwind classes
  const colorMap: Record<string, string> = {
    green: 'after:bg-green-500/20',
    blue: 'after:bg-blue-500/20',
    red: 'after:bg-red-500/20',
    yellow: 'after:bg-yellow-500/20',
    purple: 'after:bg-purple-500/20',
    gray: 'after:bg-gray-500/20'
  };

  const accentClass = colorMap[accentColor] || colorMap.gray;

  return (
    <div className={cn(
      "relative flex items-start justify-between p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 transition-colors",
      "after:content-[''] after:absolute after:left-0 after:top-0 after:bottom-0 after:w-1 after:rounded-l-lg",
      accentClass,
      className
    )}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-medium">{title}</h4>
            {badges && (
              <div className="flex gap-1 flex-wrap">
                {badges}
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          )}
          {description && (
            <div className="text-xs mt-1">{description}</div>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
