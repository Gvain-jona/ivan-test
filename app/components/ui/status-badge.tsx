import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { OPTION_COLORS } from '@/lib/fields/colors';
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
  status: string;
  className?: string;
}

/**
 * Colours come from the shared option palette (app/lib/fields/colors.ts),
 * whose chip pairs are contrast-verified in both themes — the literal
 * *-900/*-300 pairs this replaced only ever worked on a dark canvas.
 *
 * The hues match the --status-* tokens for the same six stages, so the badge
 * and any status dot stay recognisably the same colour.
 */
const STATUS_CHIPS = {
  paused: OPTION_COLORS.slate.chip,
  in_progress: OPTION_COLORS.blue.chip,
  completed: OPTION_COLORS.green.chip,
  delivered: OPTION_COLORS.violet.chip,
  cancelled: OPTION_COLORS.red.chip,
  pending: OPTION_COLORS.amber.chip,
} as const;

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paused':
        return {
          icon: <Clock className="h-3 w-3 mr-1" />,
          label: 'Paused',
          className: STATUS_CHIPS.paused,
        };
      case 'in_progress':
        return {
          icon: <ClipboardCheck className="h-3 w-3 mr-1" />,
          label: 'In Progress',
          className: STATUS_CHIPS.in_progress,
        };
      case 'completed':
        return {
          icon: <CheckCircle className="h-3 w-3 mr-1" />,
          label: 'Completed',
          className: STATUS_CHIPS.completed,
        };
      case 'delivered':
        return {
          icon: <TruckIcon className="h-3 w-3 mr-1" />,
          label: 'Delivered',
          className: STATUS_CHIPS.delivered,
        };
      case 'cancelled':
        return {
          icon: <Ban className="h-3 w-3 mr-1" />,
          label: 'Cancelled',
          className: STATUS_CHIPS.cancelled,
        };
      case 'pending':
        return {
          icon: <Clock className="h-3 w-3 mr-1" />,
          label: 'Pending',
          className: STATUS_CHIPS.pending,
        };
      default:
        return {
          icon: <Clock className="h-3 w-3 mr-1" />,
          label: status ? status.replace(/_/g, ' ') : 'Unknown',
          className: OPTION_COLORS.slate.chip,
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