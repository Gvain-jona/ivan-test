import React from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  count?: number;
  badgeColor?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * Section header component for consistent styling
 * Used across different sections in the expense view
 */
export function SectionHeader({ 
  title, 
  count, 
  badgeColor = "white", 
  icon, 
  actions 
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-2">
      <div className="flex items-center gap-2">
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <h3 className="text-lg font-semibold">{title}</h3>
        {count !== undefined && count > 0 && (
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            badgeColor === "white"
              ? "bg-white/15 text-white border border-white/30"
              : badgeColor === "green"
                ? "bg-green-500/15 text-green-400 border border-green-500/30"
                : badgeColor === "blue"
                  ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                  : "bg-gray-500/15 text-gray-400 border border-gray-500/30"
          )}>
            {count}
          </span>
        )}
      </div>
      {actions}
    </div>
  );
}
