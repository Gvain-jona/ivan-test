import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  BanIcon, 
  DollarSign, 
  CheckCircle 
} from 'lucide-react';
import { PaymentStatus } from '@/types/orders';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
  showIcon?: boolean;
}

/**
 * A reusable payment status badge component for displaying order payment statuses
 */
export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ 
  status, 
  className,
  showIcon = true
}) => {
  const getPaymentStatusConfig = (status: PaymentStatus) => {
    switch (status) {
      case 'unpaid':
        return {
          icon: <BanIcon className="h-3 w-3 mr-1" />,
          label: 'Unpaid',
          className: 'bg-red-900/20 text-red-400 border-red-800',
        };
      case 'partially_paid':
        return {
          icon: <DollarSign className="h-3 w-3 mr-1" />,
          label: 'Partially Paid',
          className: 'bg-yellow-900/20 text-yellow-400 border-yellow-800',
        };
      case 'paid':
        return {
          icon: <CheckCircle className="h-3 w-3 mr-1" />,
          label: 'Paid',
          className: 'bg-green-900/20 text-green-400 border-green-800',
        };
      default:
        return {
          icon: <DollarSign className="h-3 w-3 mr-1" />,
          label: 'Unknown',
          className: 'bg-gray-900/20 text-gray-400 border-gray-800',
        };
    }
  };

  const { icon, label, className: statusClassName } = getPaymentStatusConfig(status);

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

export default PaymentStatusBadge; 