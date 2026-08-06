import React from 'react';
import { cn } from '@/lib/utils';
import { OPTION_COLORS } from '@/lib/fields/colors';
import { CheckCircle, Clock, PauseCircle, Truck, AlertCircle, ArrowRightCircle, ChevronDown, Loader2 } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: (e: React.MouseEvent) => void;
  showDropdownIndicator?: boolean;
  className?: string;
  isLoading?: boolean;
  loadingStatus?: string | null;
}

function StatusBadge({ status, size = 'md', onClick, showDropdownIndicator = false, className: propClassName, isLoading = false, loadingStatus = null }: StatusBadgeProps) {
  /**
   * Chips come from the shared option palette, which carries a verified
   * bg/text pair per theme. The hand-rolled `*-500/15 text-*-400` + `dark:`
   * overrides they replaced set a light-theme value that was really a second
   * dark value — both variants assumed a dark canvas.
   */
  const getStatusConfig = () => {
    switch (status) {
      case 'in_progress':
        return {
          icon: <ArrowRightCircle className="h-4 w-4 mr-1.5" />,
          label: 'In Progress',
          className: OPTION_COLORS.blue.chip,
        };
      case 'paused':
        return {
          icon: <PauseCircle className="h-4 w-4 mr-1.5" />,
          label: 'Paused',
          className: OPTION_COLORS.slate.chip,
        };
      case 'pending':
        return {
          icon: <Clock className="h-4 w-4 mr-1.5" />,
          label: 'Pending',
          className: OPTION_COLORS.amber.chip,
        };
      case 'completed':
        return {
          icon: <CheckCircle className="h-4 w-4 mr-1.5" />,
          label: 'Completed',
          className: OPTION_COLORS.green.chip,
        };
      case 'delivered':
        return {
          icon: <Truck className="h-4 w-4 mr-1.5" />,
          label: 'Delivered',
          className: OPTION_COLORS.violet.chip,
        };
      case 'cancelled':
        return {
          icon: <AlertCircle className="h-4 w-4 mr-1.5" />,
          label: 'Cancelled',
          className: OPTION_COLORS.red.chip,
        };
      default:
        return {
          icon: <Clock className="h-4 w-4 mr-1.5" />,
          label: (status as string).split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          className: OPTION_COLORS.slate.chip,
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
        'inline-flex items-center justify-center rounded-md font-medium shadow-sm border border-transparent cursor-pointer interactive-element',
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