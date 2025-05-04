'use client';

import { toast } from '@/components/ui/use-toast';

/**
 * Helper function to show a notification for order deletion
 * This function uses the toast system directly instead of hooks
 * to avoid the "hooks can only be used in components" error
 *
 * @param success Whether the deletion was successful
 * @param orderNumber The order number or ID
 * @param errorMessage Optional error message
 */
export const showOrderDeletionNotification = (
  success: boolean,
  orderNumber: string,
  errorMessage?: string
) => {
  try {
    if (success) {
      // Show success notification
      toast({
        title: "Order Deleted",
        description: `Order ${orderNumber} has been deleted successfully`,
        variant: "default",
      });
    } else {
      // Show error notification
      toast({
        title: "Error",
        description: errorMessage || 'Failed to delete order',
        variant: "destructive",
      });
    }
  } catch (error) {
    // If all else fails, log to console
    if (success) {
      console.log(`Order ${orderNumber} deleted successfully`);
    } else {
      console.error(`Error deleting order ${orderNumber}:`, errorMessage);
    }
  }
};
