import React from 'react';
import { cn } from '@/lib/utils';
import { OrderStatus } from '@/types/orders';
import { CheckCircle, Clock, PauseCircle, Truck, AlertCircle, ArrowRightCircle, ChevronDown, Loader2 } from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
  onClick?: (e: React.MouseEvent) => void;
  showDropdownIndicator?: boolean;
  className?: string;
  isLoading?: boolean;
  loadingStatus?: OrderStatus | null;
}

function StatusBadge({ status, size = 'md', onClick, showDropdownIndicator = false, className: propClassName, isLoading = false, loadingStatus = null }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'in_progress':
        return {
          icon: <ArrowRightCircle className="h-4 w-4 mr-1.5" />,
          label: 'In Progress',
          className: 'bg-blue-500/15 text-blue-400 border-blue-500/30 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30'
        };
      case 'paused':
        return {
          icon: <PauseCircle className="h-4 w-4 mr-1.5" />,
          label: 'Paused',
          className: 'bg-slate-500/15 text-slate-400 border-slate-500/30 dark:bg-slate-800/20 dark:text-slate-300 dark:border-slate-700/30'
        };
      case 'pending':
        return {
          icon: <Clock className="h-4 w-4 mr-1.5" />,
          label: 'Pending',
          className: 'bg-amber-500/15 text-amber-400 border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/30'
        };
      case 'completed':
        return {
          icon: <CheckCircle className="h-4 w-4 mr-1.5" />,
          label: 'Completed',
          className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/30'
        };
      case 'delivered':
        return {
          icon: <Truck className="h-4 w-4 mr-1.5" />,
          label: 'Delivered',
          className: 'bg-purple-500/15 text-purple-400 border-purple-500/30 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800/30'
        };
      case 'cancelled':
        return {
          icon: <AlertCircle className="h-4 w-4 mr-1.5" />,
          label: 'Cancelled',
          className: 'bg-rose-500/15 text-rose-400 border-rose-500/30 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800/30'
        };
      default:
        return {
          icon: <Clock className="h-4 w-4 mr-1.5" />,
          label: status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          className: 'bg-slate-500/15 text-slate-400 border-slate-500/30 dark:bg-slate-800/20 dark:text-slate-300 dark:border-slate-700/30'
        };
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'px-2.5 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-sm';
      case 'md':
      default:
        return 'px-3 py-1.5 text-xs font-medium';
    }
  };

  const { icon, label, className } = getStatusConfig();

  // Enhanced click handler to ensure proper event propagation
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation();
      e.preventDefault(); // Prevent any default behavior

      // Execute the click handler
      onClick(e);
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium shadow-sm border cursor-pointer interactive-element',
        getSizeClass(),
        className,
        propClassName,
        onClick && 'hover:bg-opacity-80 transition-colors'
      )}
      onClick={handleClick}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
      ) : (
        icon
      )}
      <span className="flex-1">{isLoading && loadingStatus ? `Updating to ${getStatusConfig().label}...` : label}</span>
      {showDropdownIndicator && !isLoading && (
        <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-70" />
      )}
    </span>
  );
}

export default StatusBadge;