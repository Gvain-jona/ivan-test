import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CreditCard, DollarSign, Clock, Ban, AlertCircle } from 'lucide-react';

type PaymentStatus = 
  | 'paid'
  | 'partially_paid'
  | 'unpaid'
  | 'overdue'
  | 'refunded';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status, className }) => {
  const getStatusConfig = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return {
          icon: <DollarSign className="h-3 w-3 mr-1" />,
          label: 'Paid',
          className: 'bg-green-900 text-green-300 hover:bg-green-900/80',
        };
      case 'partially_paid':
        return {
          icon: <CreditCard className="h-3 w-3 mr-1" />,
          label: 'Partially Paid',
          className: 'bg-blue-900 text-blue-300 hover:bg-blue-900/80',
        };
      case 'unpaid':
        return {
          icon: <Clock className="h-3 w-3 mr-1" />,
          label: 'Unpaid',
          className: 'bg-yellow-900 text-yellow-300 hover:bg-yellow-900/80',
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
          label: status.replace(/_/g, ' '),
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

export default PaymentStatusBadge; 