import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { OPTION_COLORS } from '@/lib/fields/colors';
import { CreditCard, DollarSign, Ban, AlertCircle, CheckCircle } from 'lucide-react';

type PaymentStatus =
  | 'paid'
  | 'partial'
  | 'unpaid'
  | 'overdue'
  | 'refunded'
  | string
  | undefined;

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  percentage?: number;
  className?: string;
  showIcon?: boolean;
  showPercentage?: boolean;
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  percentage = 0,
  className,
  showIcon = true,
  showPercentage = true
}) => {
  const getStatusConfig = (status: PaymentStatus, percentage: number) => {
    switch (status) {
      case 'paid':
        return {
          icon: <CheckCircle className="h-3 w-3 mr-1" />,
          label: 'Paid',
          className: OPTION_COLORS.green.chip,
        };
      case 'partial': {
        // Warmer as the outstanding balance grows: green -> blue -> amber -> red.
        const partial =
          percentage >= 75 ? OPTION_COLORS.green
          : percentage >= 50 ? OPTION_COLORS.blue
          : percentage >= 25 ? OPTION_COLORS.amber
          : OPTION_COLORS.red;
        return {
          icon: <DollarSign className="h-3 w-3 mr-1" />,
          label: showPercentage ? `Paid ${percentage}%` : 'Partially Paid',
          className: partial.chip,
        };
      }
      case 'unpaid':
        return {
          icon: <Ban className="h-3 w-3 mr-1" />,
          label: 'Not Paid',
          className: OPTION_COLORS.red.chip,
        };
      case 'overdue':
        return {
          icon: <AlertCircle className="h-3 w-3 mr-1" />,
          label: 'Overdue',
          className: OPTION_COLORS.red.chip,
        };
      case 'refunded':
        return {
          icon: <Ban className="h-3 w-3 mr-1" />,
          label: 'Refunded',
          className: OPTION_COLORS.slate.chip,
        };
      default:
        return {
          icon: <CreditCard className="h-3 w-3 mr-1" />,
          label: status ? status.replace(/_/g, ' ') : 'Unknown',
          className: OPTION_COLORS.slate.chip,
        };
    }
  };

  const { icon, label, className: statusClassName } = getStatusConfig(status, percentage);

  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center font-normal px-2 py-1 border-none',
        statusClassName,
        className
      )}
    >
      {showIcon && icon}
      <span>{label}</span>
    </Badge>
  );
};

export default PaymentStatusBadge;