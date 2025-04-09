/**
 * Checks if a task's due date is in the past
 * @param dueDate The due date string
 * @returns boolean indicating if the date is past due
 */
export const isPastDue = (dueDate: string): boolean => {
  const today = new Date();
  const due = new Date(dueDate);
  return due < today && !due.toDateString().includes(today.toDateString());
};

/**
 * Formats a date string for display
 * @param dateString The date string to format
 * @returns Formatted date string
 */
export const formatTaskDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Calculates days remaining until the due date
 * @param dueDate The due date string 
 * @returns Number of days remaining (negative if past due)
 */
export const getDaysRemaining = (dueDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}; 