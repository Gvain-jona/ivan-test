import { TaskStatus } from '@/types/tasks';

/**
 * Returns the appropriate CSS classes for a task status badge
 * @param status The task status
 * @returns CSS class string for styling the status badge
 */
export const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case 'pending':
      return 'bg-gray-900/20 text-gray-400 border-gray-800';
    case 'in_progress':
      return 'bg-blue-900/20 text-blue-400 border-blue-800';
    case 'completed':
      return 'bg-green-900/20 text-green-400 border-green-800';
    case 'cancelled':
      return 'bg-red-900/20 text-red-400 border-red-800';
    default:
      return 'bg-gray-900/20 text-gray-400 border-gray-800';
  }
};

/**
 * Converts a task status value to a human-readable text
 * @param status The task status
 * @returns Formatted status text for display
 */
export const getStatusText = (status: TaskStatus): string => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}; 