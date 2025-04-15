import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Clock,
  ClipboardCheck,
  CheckCircle,
  TruckIcon,
  Ban,
  AlertTriangle
} from 'lucide-react';
import { TaskStatus } from '@/types/tasks';
import { OrderStatus } from '@/types/orders';

type Status = TaskStatus | OrderStatus;

interface StatusBadgeProps {
  status: Status;
  type?: 'task' | 'order';
  className?: string;
  showIcon?: boolean;
}

/**
 * A reusable status badge component for displaying task and order statuses
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'task',
  className,
  showIcon = true
}) => {
  const getStatusConfig = (status: Status, type: 'task' | 'order') => {
    // Common statuses for both tasks and orders
    if (status === 'pending') {
      return {
        icon: <Clock className="h-3.5 w-3.5 mr-1" />,
        label: 'Pending',
        className: 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/30',
      };
    } else if (status === 'in_progress') {
      return {
        icon: <ClipboardCheck className="h-3.5 w-3.5 mr-1" />,
        label: 'In progress',
        className: 'bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30',
      };
    } else if (status === 'completed') {
      return {
        icon: <CheckCircle className="h-3.5 w-3.5 mr-1" />,
        label: 'Completed',
        className: 'bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/25 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/30',
      };
    } else if (status === 'cancelled') {
      return {
        icon: <Ban className="h-3.5 w-3.5 mr-1" />,
        label: 'Cancelled',
        className: 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30',
      };
    }

    // Order-specific statuses
    if (type === 'order') {
      if (status === 'paused') {
        return {
          icon: <AlertTriangle className="h-3.5 w-3.5 mr-1" />,
          label: 'Paused',
          className: 'bg-gray-500/15 text-gray-400 border-gray-500/30 hover:bg-gray-500/25 dark:bg-gray-800/20 dark:text-gray-300 dark:border-gray-700/30',
        };
      } else if (status === 'delivered') {
        return {
          icon: <TruckIcon className="h-3.5 w-3.5 mr-1" />,
          label: 'Delivered',
          className: 'bg-purple-500/15 text-purple-400 border-purple-500/30 hover:bg-purple-500/25 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800/30',
        };
      }
    }

    // Default fallback
    return {
      icon: <Clock className="h-3.5 w-3.5 mr-1" />,
      label: status.replace(/_/g, ' ').replace(/\b\w/g, (l, i) => i === 0 ? l.toUpperCase() : l.toLowerCase()),
      className: 'bg-gray-500/15 text-gray-400 border-gray-500/30 hover:bg-gray-500/25 dark:bg-gray-800/20 dark:text-gray-300 dark:border-gray-700/30',
    };
  };

  const { icon, label, className: statusClassName } = getStatusConfig(status, type);

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
};

export default StatusBadge;
