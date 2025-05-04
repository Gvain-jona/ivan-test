import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  category: 'fixed' | 'variable' | string;
  className?: string;
}

/**
 * A reusable badge component for displaying expense categories
 */
export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  // Get badge color based on category
  const getBadgeColor = () => {
    switch (category) {
      case 'fixed':
        return 'bg-blue-500/15 text-blue-500 border-blue-500/20 hover:bg-blue-500/25 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30';
      case 'variable':
        return 'bg-purple-500/15 text-purple-500 border-purple-500/20 hover:bg-purple-500/25 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800/30';
      default:
        return 'bg-gray-500/15 text-gray-500 border-gray-500/20 hover:bg-gray-500/25 dark:bg-gray-800/20 dark:text-gray-300 dark:border-gray-700/30';
    }
  };

  // Format the category text
  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        getBadgeColor(),
        'capitalize font-medium px-2.5 py-0.5 rounded-md text-xs',
        className
      )}
    >
      {formatCategory(category)}
    </Badge>
  );
}
