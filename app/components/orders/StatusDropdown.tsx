import React, { useState, useRef } from 'react';
import { Order, OrderStatus } from '@/types/orders';
import { cn } from '@/lib/utils';
import StatusBadge from './StatusBadge';
import { CheckCircle, Clock, PauseCircle, Truck, AlertCircle, ArrowRightCircle, Loader2 } from 'lucide-react';
import { CustomDropdown, CustomDropdownItem, CustomDropdownSeparator } from './CustomDropdown';

interface StatusDropdownProps {
  order: Order;
  onStatusChange: (order: Order, status: OrderStatus) => void;
  userRole: 'admin' | 'manager' | 'employee';
}

function StatusDropdown({ order, onStatusChange, userRole }: StatusDropdownProps) {
  const canChangeStatus = userRole === 'admin' || userRole === 'manager';

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'in_progress':
        return {
          icon: <ArrowRightCircle className="h-4 w-4 mr-2" />,
          label: 'In Progress',
          className: 'text-blue-400 hover:bg-blue-500/10 focus:bg-blue-500/10'
        };
      case 'paused':
        return {
          icon: <PauseCircle className="h-4 w-4 mr-2" />,
          label: 'Paused',
          className: 'text-slate-400 hover:bg-slate-500/10 focus:bg-slate-500/10'
        };
      case 'pending':
        return {
          icon: <Clock className="h-4 w-4 mr-2" />,
          label: 'Pending',
          className: 'text-amber-400 hover:bg-amber-500/10 focus:bg-amber-500/10'
        };
      case 'completed':
        return {
          icon: <CheckCircle className="h-4 w-4 mr-2" />,
          label: 'Completed',
          className: 'text-emerald-400 hover:bg-emerald-500/10 focus:bg-emerald-500/10'
        };
      case 'delivered':
        return {
          icon: <Truck className="h-4 w-4 mr-2" />,
          label: 'Delivered',
          className: 'text-purple-400 hover:bg-purple-500/10 focus:bg-purple-500/10'
        };
      case 'cancelled':
        return {
          icon: <AlertCircle className="h-4 w-4 mr-2" />,
          label: 'Cancelled',
          className: 'text-rose-400 hover:bg-rose-500/10 focus:bg-rose-500/10'
        };
      default:
        return {
          icon: <Clock className="h-4 w-4 mr-2" />,
          label: status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          className: 'text-slate-400 hover:bg-slate-500/10 focus:bg-slate-500/10'
        };
    }
  };

  if (!canChangeStatus) {
    return <StatusBadge status={order.status} size="md" />;
  }

  // Add state for loading and current status being changed
  const [isLoading, setIsLoading] = useState(false);
  const [changingStatus, setChangingStatus] = useState<OrderStatus | null>(null);

  // Use a ref to track the current order status for comparison
  const orderStatusRef = React.useRef(order.status);

  // Use state to track the displayed status (for optimistic UI updates)
  // Initialize it with the order status but don't re-initialize on every render
  const [displayStatus, setDisplayStatus] = useState<OrderStatus>(order.status);

  // Update displayed status only when order.status actually changes
  React.useEffect(() => {
    if (orderStatusRef.current !== order.status) {
      orderStatusRef.current = order.status;
      setDisplayStatus(order.status);
    }
  }, [order.status]);

  // Handle status change with debounce to prevent accidental double-clicks
  const isChangingRef = React.useRef(false);

  const handleStatusChange = async (status: OrderStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent any default behavior

    // Prevent multiple rapid status changes or changing to current status
    if (isChangingRef.current || isLoading || status === displayStatus) return;

    // Store the current status for potential reversion
    const previousStatus = displayStatus;

    // Set changing flag to prevent multiple triggers
    isChangingRef.current = true;
    setIsLoading(true);
    setChangingStatus(status);

    // Update display status immediately for optimistic UI update
    setDisplayStatus(status);

    // Close the dropdown immediately
    setDropdownOpen(false);

    try {
      // Apply the status change
      await onStatusChange(order, status);
      // Update the ref to match the new status
      orderStatusRef.current = status;
    } catch (error) {
      console.error('Error changing status:', error);
      // Revert to original status on error
      setDisplayStatus(previousStatus);
    } finally {
      // Reset changing flag and loading state
      setTimeout(() => {
        isChangingRef.current = false;
        setIsLoading(false);
        setChangingStatus(null);
      }, 300);
    }
  };

  // State to control the dropdown programmatically
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <CustomDropdown
      isOpen={dropdownOpen}
      onOpenChange={setDropdownOpen}
      trigger={
        <div className="interactive-element">
          <StatusBadge
            status={displayStatus}
            size="md"
            showDropdownIndicator={!isLoading}
            className="cursor-pointer"
            isLoading={isLoading}
            loadingStatus={changingStatus}
          />
        </div>
      }
      align="start"
      contentClassName="w-48 bg-background border-table-border z-50"
      sideOffset={5}
    >
      <CustomDropdownItem
        className={cn(
          "focus:text-white",
          displayStatus === 'pending' ? 'bg-amber-500/10 text-amber-400' : 'text-white',
          isLoading && changingStatus === 'pending' ? 'opacity-70 pointer-events-none' : ''
        )}
        onClick={(e) => handleStatusChange('pending', e)}
        disabled={isLoading}
      >
        {isLoading && changingStatus === 'pending' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Clock className="mr-2 h-4 w-4" />
        )}
        Pending
      </CustomDropdownItem>
      <CustomDropdownItem
        className={cn(
          "focus:text-white",
          displayStatus === 'paused' ? 'bg-slate-500/10 text-slate-400' : 'text-white',
          isLoading && changingStatus === 'paused' ? 'opacity-70 pointer-events-none' : ''
        )}
        onClick={(e) => handleStatusChange('paused', e)}
        disabled={isLoading}
      >
        {isLoading && changingStatus === 'paused' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <PauseCircle className="mr-2 h-4 w-4" />
        )}
        Paused
      </CustomDropdownItem>
      <CustomDropdownItem
        className={cn(
          "focus:text-white",
          displayStatus === 'in_progress' ? 'bg-blue-500/10 text-blue-400' : 'text-white',
          isLoading && changingStatus === 'in_progress' ? 'opacity-70 pointer-events-none' : ''
        )}
        onClick={(e) => handleStatusChange('in_progress', e)}
        disabled={isLoading}
      >
        {isLoading && changingStatus === 'in_progress' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ArrowRightCircle className="mr-2 h-4 w-4" />
        )}
        In Progress
      </CustomDropdownItem>
      <CustomDropdownItem
        className={cn(
          "focus:text-white",
          displayStatus === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'text-white',
          isLoading && changingStatus === 'completed' ? 'opacity-70 pointer-events-none' : ''
        )}
        onClick={(e) => handleStatusChange('completed', e)}
        disabled={isLoading}
      >
        {isLoading && changingStatus === 'completed' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="mr-2 h-4 w-4" />
        )}
        Completed
      </CustomDropdownItem>
      <CustomDropdownItem
        className={cn(
          "focus:text-white",
          displayStatus === 'delivered' ? 'bg-purple-500/10 text-purple-400' : 'text-white',
          isLoading && changingStatus === 'delivered' ? 'opacity-70 pointer-events-none' : ''
        )}
        onClick={(e) => handleStatusChange('delivered', e)}
        disabled={isLoading}
      >
        {isLoading && changingStatus === 'delivered' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Truck className="mr-2 h-4 w-4" />
        )}
        Delivered
      </CustomDropdownItem>
      <CustomDropdownItem
        className={cn(
          "focus:text-white",
          displayStatus === 'cancelled' ? 'bg-rose-500/10 text-rose-400' : 'text-white',
          isLoading && changingStatus === 'cancelled' ? 'opacity-70 pointer-events-none' : ''
        )}
        onClick={(e) => handleStatusChange('cancelled', e)}
        disabled={isLoading}
      >
        {isLoading && changingStatus === 'cancelled' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <AlertCircle className="mr-2 h-4 w-4" />
        )}
        Cancelled
      </CustomDropdownItem>
    </CustomDropdown>
  );
}

export default StatusDropdown;
