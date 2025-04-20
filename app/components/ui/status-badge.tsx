import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ClipboardCheck, Clock, CheckCircle, TruckIcon, Ban } from 'lucide-react';

type OrderStatus =
  | 'paused'
  | 'in_progress'
  | 'completed'
  | 'delivered'
  | 'cancelled'
  | 'pending'
  | string
  | undefined;

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'paused':
        return {
          icon: <Clock className="h-3 w-3 mr-1" />,
          label: 'Paused',
          className: 'bg-yellow-900 text-yellow-300 hover:bg-yellow-900/80',
        };
      case 'in_progress':
        return {
          icon: <ClipboardCheck className="h-3 w-3 mr-1" />,
          label: 'In Progress',
          className: 'bg-blue-900 text-blue-300 hover:bg-blue-900/80',
        };
      case 'completed':
        return {
          icon: <CheckCircle className="h-3 w-3 mr-1" />,
          label: 'Completed',
          className: 'bg-green-900 text-green-300 hover:bg-green-900/80',
        };
      case 'delivered':
        return {
          icon: <TruckIcon className="h-3 w-3 mr-1" />,
          label: 'Delivered',
          className: 'bg-indigo-900 text-indigo-300 hover:bg-indigo-900/80',
        };
      case 'cancelled':
        return {
          icon: <Ban className="h-3 w-3 mr-1" />,
          label: 'Cancelled',
          className: 'bg-red-900 text-red-300 hover:bg-red-900/80',
        };
      case 'pending':
        return {
          icon: <Clock className="h-3 w-3 mr-1" />,
          label: 'Pending',
          className: 'bg-amber-900 text-amber-300 hover:bg-amber-900/80',
        };
      default:
        return {
          icon: <Clock className="h-3 w-3 mr-1" />,
          label: status ? status.replace(/_/g, ' ') : 'Unknown',
          className: 'bg-gray-800 text-gray-300 hover:bg-gray-800/80',
        };
    }
  };

  const { icon, label, className: statusClassName } = getStatusConfig(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center font-normal px-2 py-1 border-none',
        statusClassName,
        className
      )}
    >
      {icon}
      <span className="capitalize">{label}</span>
    </Badge>
  );
};

export default StatusBadge;