import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: 'paid' | 'partially_paid' | 'unpaid';
  className?: string;
  showIcon?: boolean;
}

/**
 * Status badge component for material purchases
 */
export function StatusBadge({
  status,
  className,
  showIcon = true
}: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'paid':
        return {
          icon: <CheckCircle className="h-3.5 w-3.5 mr-1" />,
          label: 'Paid',
          className: 'bg-green-500/15 text-green-500 border-green-500/30 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/30',
        };
      case 'partially_paid':
        return {
          icon: <Clock className="h-3.5 w-3.5 mr-1" />,
          label: 'Partially Paid',
          className: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800/30',
        };
      case 'unpaid':
        return {
          icon: <AlertCircle className="h-3.5 w-3.5 mr-1" />,
          label: 'Unpaid',
          className: 'bg-red-500/15 text-red-500 border-red-500/30 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30',
        };
      default:
        return {
          icon: <Clock className="h-3.5 w-3.5 mr-1" />,
          label: 'Unknown',
          className: 'bg-gray-500/15 text-gray-500 border-gray-500/30 dark:bg-gray-800/20 dark:text-gray-300 dark:border-gray-700/30',
        };
    }
  };

  const { icon, label, className: statusClassName } = getStatusConfig();

  return (
    <Badge
      variant="outline"
      className={cn(
        'px-2.5 py-1 text-xs font-medium rounded-full border shadow-sm',
        statusClassName,
        className
      )}
    >
      {showIcon && icon}
      <span>{label}</span>
    </Badge>
  );
}
