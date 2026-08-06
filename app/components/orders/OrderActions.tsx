import React, { useState } from 'react';
import { CustomDropdown, CustomDropdownItem, CustomDropdownSeparator } from './CustomDropdown';
import { Button } from '@/components/ui/button';
import {
  Eye, Trash2, MoreVertical
} from 'lucide-react';
import type { OrderSummary } from '@/hooks/orders/useOrders';
import { OrderDeleteConfirmation } from './OrderDeleteConfirmation';

// Edit / Duplicate / Invoice actions were removed in cleanup Phase 2
// (docs/v2-migration/ORDERS_CLEANUP.md): Edit duplicated View, Duplicate
// was a no-op stub, and Invoice opened nothing — they return when their
// real implementations exist (order editing, duplicate-from-detail,
// v2.issue_document()).
interface OrderActionsProps {
  order: OrderSummary;
  userRole: 'admin' | 'manager' | 'employee';
  onView: (order: OrderSummary) => void;
  onDelete: (order: OrderSummary) => Promise<boolean>;
}

function OrderActions(props: OrderActionsProps) {
  const {
  order,
  userRole,
  onView,
  onDelete,
  } = props;
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const canModify = isAdmin || isManager;

  // No longer need status color function as we've moved status change to a separate component

  // Use state to control the dropdown open state
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Use a ref to track if we're currently processing an action
  const isProcessingRef = React.useRef(false);

  // Handle safe actions (non-destructive) with debounce
  const handleSafeAction = (action: (order: OrderSummary) => void, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent any default behavior

    // Prevent multiple rapid actions
    if (isProcessingRef.current) return;

    // Set processing flag to prevent multiple triggers
    isProcessingRef.current = true;

    // Add visual feedback with a slight delay before action
    const element = e.currentTarget as HTMLElement;
    if (element) {
      element.classList.add('bg-accent');
    }

    // Execute the action after a small delay
    setTimeout(() => {
      // Close the dropdown
      setOpen(false);

      // Execute the action
      setTimeout(() => {
        action(order);

        // Reset processing flag after a delay
        setTimeout(() => {
          isProcessingRef.current = false;
          if (element) {
            element.classList.remove('bg-accent');
          }
        }, 300);
      }, 50);
    }, 50);
  };

  // Handle delete action specifically with debounce
  const handleDeleteAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent any default behavior

    // Prevent multiple rapid actions
    if (isProcessingRef.current) return;

    // Set processing flag to prevent multiple triggers
    isProcessingRef.current = true;

    // Add visual feedback with a slight delay before action
    const element = e.currentTarget as HTMLElement;
    if (element) {
      element.classList.add('bg-destructive/20');
    }

    // Close the dropdown first
    setTimeout(() => {
      setOpen(false);

      // Open the confirmation dialog after a short delay
      setTimeout(() => {
        // Reset loading state when opening the dialog
        setDeleteLoading(false);
        setDeleteDialogOpen(true);

        // Reset processing flag after a delay
        setTimeout(() => {
          isProcessingRef.current = false;
          if (element) {
            element.classList.remove('bg-destructive/20');
          }
        }, 300);
      }, 50);
    }, 50);
  };

  // State for loading during delete
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Handle confirmed delete
  const handleConfirmedDelete = async () => {
    setDeleteLoading(true);
    try {
      await onDelete(order);
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <CustomDropdown
        trigger={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-table-header hover:text-foreground hover:bg-table-hover interactive-element relative z-10"
          >
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        }
        align="end"
        contentClassName="w-48 bg-background border-table-border z-50"
        sideOffset={5}
      >
        <div className="px-2 py-1.5 text-sm font-semibold text-table-header">
          {order.order_number || `Order #${order.id.substring(0, 8)}`}
        </div>
        <CustomDropdownSeparator className="bg-table-border" />
        <div className="group">
          <CustomDropdownItem
            className="text-foreground focus:bg-accent focus:text-accent-foreground"
            onClick={(e) => handleSafeAction(onView, e)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </CustomDropdownItem>
        </div>

        {/* Status change section has been moved to a separate component */}

        {canModify && (
          <>
            <CustomDropdownSeparator className="bg-table-border" />
            <CustomDropdownItem
              className="text-status-cancelled focus:bg-status-cancelled/10 focus:text-status-cancelled"
              onClick={handleDeleteAction}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Order
            </CustomDropdownItem>
          </>
        )}
      </CustomDropdown>

      {/* Delete Confirmation Dialog */}
      <OrderDeleteConfirmation
        order={order}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmedDelete}
        loading={deleteLoading}
      />
    </>
  );
}

export default OrderActions;
