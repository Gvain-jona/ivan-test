import { toast } from "sonner";

/**
 * Helper function to show a notification for expense deletion
 * This function uses the Sonner toast system directly instead of hooks
 * to avoid the "hooks can only be used in components" error
 *
 * @param success Whether the deletion was successful
 * @param expenseName The expense name or ID
 * @param errorMessage Optional error message
 */
export const showExpenseDeletionNotification = (
  success: boolean,
  expenseName: string,
  errorMessage?: string
) => {
  try {
    if (success) {
      // Show success notification
      toast.success("Expense Deleted", {
        description: `Expense "${expenseName}" has been deleted successfully`,
        duration: 4000,
        position: "top-center",
      });
    } else {
      // Show error notification
      toast.error("Error", {
        description: errorMessage || 'Failed to delete expense',
        duration: 5000,
        position: "top-center",
      });
    }
  } catch (error) {
    // Fallback in case toast fails
    console.error('Error showing notification:', error);
  }
};
