import React, { useState } from 'react';
import { CustomDropdown, CustomDropdownItem, CustomDropdownSeparator } from './CustomDropdown';
import { Button } from '@/components/ui/button';
import {
  Edit, Eye, Trash2, Copy, FileText, MoreVertical
} from 'lucide-react';
import { Order, OrderStatus } from '@/types/orders';
import { cn } from '@/lib/utils';
import InvoiceButtonWrapper from '@/app/dashboard/orders/_components/InvoiceSystem';
import { OrderDeleteConfirmation } from './OrderDeleteConfirmation';

interface OrderActionsProps {
  order: Order;
  userRole: 'admin' | 'manager' | 'employee';
  onView: (order: Order) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => Promise<boolean>;
  onDuplicate: (order: Order) => void;
  onInvoice: (order: Order) => void;
  onStatusChange: (order: Order, status: OrderStatus) => void;
}

function OrderActions(props: OrderActionsProps) {
  const {
  order,
  userRole,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onInvoice,
  onStatusChange,
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
  const handleSafeAction = (action: (order: Order) => void, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent any default behavior

    // Prevent multiple rapid actions
    if (isProcessingRef.current) return;

    // Set processing flag to prevent multiple triggers
    isProcessingRef.current = true;

    // Add visual feedback with a slight delay before action
    const element = e.currentTarget as HTMLElement;
    if (element) {
      element.classList.add('bg-gray-700/70');
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
            element.classList.remove('bg-gray-700/70');
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
      element.classList.add('bg-red-900/30');
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
            element.classList.remove('bg-red-900/30');
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
            className="h-8 w-8 p-0 text-table-header hover:text-white hover:bg-table-hover interactive-element relative z-10"
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
            className="text-white focus:bg-table-hover focus:text-white"
            onClick={(e) => handleSafeAction(onView, e)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </CustomDropdownItem>
          {canModify && (
            <CustomDropdownItem
              className="text-white focus:bg-table-hover focus:text-white"
              onClick={(e) => handleSafeAction(onView, e)}
            >
              <Edit className="mr-2 h-4 w-4" />
              View/Edit Order
            </CustomDropdownItem>
          )}
          <CustomDropdownItem
            className={cn(
              "focus:bg-table-hover p-0",
              order.latest_invoice_id || order.invoice_generated_at
                ? "text-green-500 focus:text-green-500"
                : "text-white focus:text-white"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <InvoiceButtonWrapper
              order={order}
              variant="ghost"
              size="sm"
              label={order.latest_invoice_id || order.invoice_generated_at ? "View Invoice" : "Generate Invoice"}
              className="w-full justify-start text-inherit hover:text-inherit"
              showIcon={true}
              useContextHandler={true}
              onClick={(e) => {
                e.stopPropagation();
                // Close the dropdown
                setOpen(false);
              }}
            />
          </CustomDropdownItem>
          <CustomDropdownItem
            className="text-white focus:bg-table-hover focus:text-white"
            onClick={(e) => handleSafeAction(onDuplicate, e)}
          >
            <Copy className="mr-2 h-4 w-4" />
            Duplicate Order
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
