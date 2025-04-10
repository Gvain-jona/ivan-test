import { TaskPriority } from '@/types/tasks';

/**
 * Returns the appropriate CSS classes for a task priority badge
 * @param priority The task priority
 * @returns CSS class string for styling the priority badge
 */
export const getPriorityColor = (priority: TaskPriority): string => {
  switch (priority) {
    case 'low':
      return 'bg-blue-900/20 text-blue-400 border-blue-800';
    case 'medium':
      return 'bg-yellow-900/20 text-yellow-400 border-yellow-800';
    case 'high':
      return 'bg-orange-900/20 text-orange-400 border-orange-800';
    case 'urgent':
      return 'bg-red-900/20 text-red-400 border-red-800';
    default:
      return 'bg-gray-900/20 text-gray-400 border-gray-800';
  }
};

/**
 * Converts a task priority value to a human-readable text
 * @param priority The task priority
 * @returns Formatted priority text for display
 */
export const getPriorityText = (priority: TaskPriority): string => {
  switch (priority) {
    case 'low':
      return 'Low';
    case 'medium':
      return 'Medium';
    case 'high':
      return 'High';
    case 'urgent':
      return 'Urgent';
    default:
      return priority;
  }
}; 