'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FilterType } from './types';

interface FilterButtonProps {
  filter: FilterType;
  currentFilter: FilterType;
  setFilter: (filter: FilterType) => void;
  count: number;
  isDarkMode: boolean;
  icon?: React.ReactNode;
  label?: string;
}

export function FilterButton({
  filter: filterValue,
  currentFilter,
  setFilter,
  count,
  isDarkMode,
  icon,
  label
}: FilterButtonProps) {
  // Get styling for active and inactive states
  const getButtonStyles = () => {
    if (currentFilter === filterValue) {
      if (isDarkMode) {
        return {
          bg: "bg-white",
          text: "text-black",
          border: "border-white",
          hover: "hover:bg-white/90 hover:text-black"
        };
      } else {
        return {
          bg: "bg-black",
          text: "text-white",
          border: "border-black",
          hover: "hover:bg-black/90 hover:text-white"
        };
      }
    } else {
      return isDarkMode
        ? {
            bg: "bg-transparent",
            text: "text-gray-300",
            border: "border-gray-700",
            hover: "hover:bg-gray-800/50"
          }
        : {
            bg: "bg-transparent",
            text: "text-gray-700",
            border: "border-gray-200",
            hover: "hover:bg-gray-100/50"
          };
    }
  };

  const styles = getButtonStyles();

  // Get badge styles
  const getBadgeStyles = () => {
    if (currentFilter === filterValue) {
      if (isDarkMode) {
        return "bg-black text-white border-black";
      } else {
        return "bg-white text-black border-white";
      }
    } else {
      return isDarkMode
        ? "bg-gray-800 text-gray-400 border-gray-700"
        : "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setFilter(filterValue)}
      className={cn(
        "rounded-md border transition-all duration-200 h-9 px-3",
        styles.bg, styles.text, styles.border, styles.hover,
        currentFilter === filterValue && "font-medium"
      )}
    >
      {icon}
      {label || filterValue.charAt(0).toUpperCase() + filterValue.slice(1)}
      {count > 0 && (
        <Badge
          className={cn(
            "ml-1.5 px-1.5 py-0.5 text-xs font-medium",
            getBadgeStyles()
          )}
        >
          {count}
        </Badge>
      )}
    </Button>
  );
}
