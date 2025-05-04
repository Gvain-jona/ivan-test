'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  count?: number;
  badgeColor?: 'white' | 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'orange';
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * Section header component for consistent styling
 * Used across different sections in the material purchase view
 * Matches the styling used in expense and order views
 */
export function SectionHeader({
  title,
  count,
  badgeColor = "white",
  icon,
  actions
}: SectionHeaderProps) {
  // Get badge color classes based on the color prop
  const getBadgeColorClasses = () => {
    switch (badgeColor) {
      case 'green':
        return 'bg-green-500/15 text-green-400 border-green-500/30';
      case 'blue':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'amber':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'red':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'purple':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'orange':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'white':
      default:
        return 'bg-white/15 text-white border-white/30';
    }
  };

  return (
    <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-2">
      <div className="flex items-center gap-2">
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <h3 className="text-lg font-semibold">{title}</h3>
        {count !== undefined && count > 0 && (
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full border",
            getBadgeColorClasses()
          )}>
            {count}
          </span>
        )}
      </div>
      {actions && (
        <div>
          {actions}
        </div>
      )}
    </div>
  );
}
