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
        icon: <Clock className="h-3 w-3 mr-1" />,
        label: 'Pending',
        className: 'bg-yellow-900/20 text-yellow-400 border-yellow-800',
      };
    } else if (status === 'in_progress') {
      return {
        icon: <ClipboardCheck className="h-3 w-3 mr-1" />,
        label: 'In Progress',
        className: 'bg-blue-900/20 text-blue-400 border-blue-800',
      };
    } else if (status === 'completed') {
      return {
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
        label: 'Completed',
        className: 'bg-green-900/20 text-green-400 border-green-800',
      };
    } else if (status === 'cancelled') {
      return {
        icon: <Ban className="h-3 w-3 mr-1" />,
        label: 'Cancelled',
        className: 'bg-red-900/20 text-red-400 border-red-800',
      };
    }

    // Order-specific statuses
    if (type === 'order') {
      if (status === 'paused') {
        return {
          icon: <AlertTriangle className="h-3 w-3 mr-1" />,
          label: 'Paused',
          className: 'bg-gray-900/20 text-gray-400 border-gray-800',
        };
      } else if (status === 'delivered') {
        return {
          icon: <TruckIcon className="h-3 w-3 mr-1" />,
          label: 'Delivered',
          className: 'bg-purple-900/20 text-purple-400 border-purple-800',
        };
      }
    }

    // Default fallback
    return {
      icon: <Clock className="h-3 w-3 mr-1" />,
      label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      className: 'bg-gray-900/20 text-gray-400 border-gray-800',
    };
  };

  const { icon, label, className: statusClassName } = getStatusConfig(status, type);

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'px-2 py-1 text-xs font-medium rounded border', 
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
