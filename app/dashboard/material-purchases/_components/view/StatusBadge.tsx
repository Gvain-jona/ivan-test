'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, Clock, AlertCircle, Info, HelpCircle } from 'lucide-react';

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'default';
type StatusBadgeType = 'payment' | 'status' | 'default';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  type?: StatusBadgeType;
  className?: string;
  showIcon?: boolean;
}

/**
 * A reusable badge component for displaying status
 * Matches the styling used in expense and order views
 */
export function StatusBadge({
  status,
  label,
  type = 'default',
  className,
  showIcon = true
}: StatusBadgeProps) {
  // Get badge color and icon based on status and type
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: <CheckCircle className="h-3.5 w-3.5 mr-1" />,
          label: label || 'Success',
          bgClass: 'bg-green-500/15',
          textClass: 'text-green-400',
          borderClass: 'border-green-500/30',
          hoverClass: 'hover:bg-green-500/20'
        };
      case 'warning':
        return {
          icon: <Clock className="h-3.5 w-3.5 mr-1" />,
          label: label || 'Warning',
          bgClass: 'bg-amber-500/15',
          textClass: 'text-amber-400',
          borderClass: 'border-amber-500/30',
          hoverClass: 'hover:bg-amber-500/20'
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-3.5 w-3.5 mr-1" />,
          label: label || 'Error',
          bgClass: 'bg-red-500/15',
          textClass: 'text-red-400',
          borderClass: 'border-red-500/30',
          hoverClass: 'hover:bg-red-500/20'
        };
      case 'info':
        return {
          icon: <Info className="h-3.5 w-3.5 mr-1" />,
          label: label || 'Info',
          bgClass: 'bg-blue-500/15',
          textClass: 'text-blue-400',
          borderClass: 'border-blue-500/30',
          hoverClass: 'hover:bg-blue-500/20'
        };
      default:
        return {
          icon: <HelpCircle className="h-3.5 w-3.5 mr-1" />,
          label: label || 'Unknown',
          bgClass: 'bg-gray-500/15',
          textClass: 'text-gray-400',
          borderClass: 'border-gray-500/30',
          hoverClass: 'hover:bg-gray-500/20'
        };
    }
  };

  const { icon, label: defaultLabel, bgClass, textClass, borderClass, hoverClass } = getStatusConfig();
  const displayLabel = label || defaultLabel;

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 text-xs rounded-full border',
      bgClass,
      textClass,
      borderClass,
      hoverClass,
      className
    )}>
      {showIcon && icon}
      <span>{displayLabel}</span>
    </span>
  );
}
