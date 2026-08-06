import React from 'react';
import { cn } from '@/lib/utils';
import { OPTION_COLORS } from '@/lib/fields/colors';

interface PaymentStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status, size = 'md' }) => {
  // Palette chips rather than saturated fills with pinned white text: the
  // old `bg-status-completed text-white` pair was never contrast-checked, and
  // `bg-brand text-white` breaks outright once the org brand is a light hue.
  const getStatusStyles = () => {
    switch (status) {
      case 'unpaid':
        return OPTION_COLORS.red.chip;
      case 'partial':
        return OPTION_COLORS.amber.chip;
      case 'paid':
        return OPTION_COLORS.green.chip;
      default:
        return OPTION_COLORS.slate.chip;
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