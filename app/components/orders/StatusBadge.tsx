import React from 'react';
import { cn } from '@/lib/utils';
import { OrderStatus } from '@/types/orders';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'in_progress':
        return 'bg-status-in_progress text-white';
      case 'paused':
        return 'bg-status-paused text-white';
      case 'pending':
        return 'bg-status-pending text-black';
      case 'completed':
        return 'bg-status-completed text-white';
      case 'delivered':
        return 'bg-status-delivered text-white';
      case 'cancelled':
        return 'bg-status-cancelled text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-4 py-1.5 text-sm';
      case 'md':
      default:
        return 'px-3 py-1 text-xs';
    }
  };

  const getStatusText = () => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium',
      getSizeClass(),
      getStatusStyles()
    )}>
      {getStatusText()}
    </span>
  );
};

export default StatusBadge; 