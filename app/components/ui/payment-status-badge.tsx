import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CreditCard, DollarSign, Clock, Ban, AlertCircle, CheckCircle } from 'lucide-react';

type PaymentStatus =
  | 'paid'
  | 'partially_paid'
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
          className: 'bg-green-500/15 text-green-400 border-green-500/30',
        };
      case 'partially_paid':
        // Different styling based on percentage
        if (percentage >= 75) {
          return {
            icon: <DollarSign className="h-3 w-3 mr-1" />,
            label: showPercentage ? `Paid ${percentage}%` : 'Partially Paid',
            className: 'bg-green-500/15 text-green-400 border-green-500/30',
          };
        } else if (percentage >= 50) {
          return {
            icon: <DollarSign className="h-3 w-3 mr-1" />,
            label: showPercentage ? `Paid ${percentage}%` : 'Partially Paid',
            className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
          };
        } else if (percentage >= 25) {
          return {
            icon: <DollarSign className="h-3 w-3 mr-1" />,
            label: showPercentage ? `Paid ${percentage}%` : 'Partially Paid',
            className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
          };
        } else {
          return {
            icon: <DollarSign className="h-3 w-3 mr-1" />,
            label: showPercentage ? `Paid ${percentage}%` : 'Partially Paid',
            className: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
          };
        }
      case 'unpaid':
        return {
          icon: <Ban className="h-3 w-3 mr-1" />,
          label: 'Not Paid',
          className: 'bg-red-500/15 text-red-400 border-red-500/30',
        };
      case 'overdue':
        return {
          icon: <AlertCircle className="h-3 w-3 mr-1" />,
          label: 'Overdue',
          className: 'bg-red-900 text-red-300 hover:bg-red-900/80',
        };
      case 'refunded':
        return {
          icon: <Ban className="h-3 w-3 mr-1" />,
          label: 'Refunded',
          className: 'bg-gray-800 text-gray-300 hover:bg-gray-800/80',
        };
      default:
        return {
          icon: <CreditCard className="h-3 w-3 mr-1" />,
          label: status ? status.replace(/_/g, ' ') : 'Unknown',
          className: 'bg-gray-800 text-gray-300 hover:bg-gray-800/80',
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