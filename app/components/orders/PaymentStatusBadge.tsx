import React from 'react';
import { cn } from '@/lib/utils';
import { PaymentStatus } from '@/types/orders';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'md' | 'lg';
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'unpaid':
        return 'bg-red-500 text-white';
      case 'partially_paid':
        return 'bg-brand text-white';
      case 'paid':
        return 'bg-status-completed text-white';
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

export default PaymentStatusBadge; 