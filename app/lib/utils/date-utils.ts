import { format, addDays, addWeeks, addMonths, addYears, getDaysInMonth, setDate, getDate, getMonth, getYear, setMonth, setYear } from 'date-fns';

/**
 * Calculates the next occurrence date based on a base date and frequency
 * @param baseDate The base date to calculate from
 * @param frequency The frequency of recurrence
 * @param options Additional options for calculating the next occurrence
 * @returns The next occurrence date
 */
export function calculateNextOccurrence(
  baseDate: string | Date,
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
  options?: {
    dayOfMonth?: number;
    dayOfWeek?: number;
    weekOfMonth?: number;
    monthOfYear?: number;
    monthlyRecurrenceType?: 'day_of_month' | 'day_of_week';
  }
): Date {
  const date = new Date(baseDate);

  switch (frequency) {
    case 'daily':
      return addDays(date, 1);

    case 'weekly':
      if (options?.dayOfWeek !== undefined) {
        // Calculate days to add to get to the next occurrence of the specified day
        const currentDayOfWeek = date.getDay();
        const daysToAdd = (options.dayOfWeek - currentDayOfWeek + 7) % 7;
        return addDays(date, daysToAdd || 7); // If daysToAdd is 0, add a week
      }
      return addWeeks(date, 1);

    case 'monthly':
      if (options?.monthlyRecurrenceType === 'day_of_month' && options?.dayOfMonth) {
        // Get the next month's date
        const nextMonth = addMonths(date, 1);

        // Get the number of days in the next month
        const daysInNextMonth = getDaysInMonth(nextMonth);

        // If the target day is greater than the days in the month, use the last day
        const targetDay = Math.min(options.dayOfMonth, daysInNextMonth);

        // Set the day of the month
        return setDate(nextMonth, targetDay);
      } else if (options?.monthlyRecurrenceType === 'day_of_week' &&
                options?.dayOfWeek !== undefined &&
                options?.weekOfMonth) {
        // Calculate the next occurrence for a specific day of a specific week
        // (e.g., 3rd Monday of the month)

        // Get the first day of the next month
        const nextMonth = new Date(getYear(date), getMonth(date) + 1, 1);

        // Find the first occurrence of the specified day of week in the next month
        const firstDayOfWeek = options.dayOfWeek;
        const firstDayOfMonth = nextMonth.getDay();
        const daysToAdd = (firstDayOfWeek - firstDayOfMonth + 7) % 7;

        // Add days to get to the first occurrence of the day of week
        const firstOccurrence = addDays(nextMonth, daysToAdd);

        // Add weeks to get to the specified week of the month
        const targetOccurrence = addWeeks(firstOccurrence, options.weekOfMonth - 1);

        // If the calculated date is in the following month, go back to the last occurrence in the target month
        if (getMonth(targetOccurrence) !== getMonth(nextMonth)) {
          return addWeeks(targetOccurrence, -1);
        }

        return targetOccurrence;
      }
      return addMonths(date, 1);

    case 'quarterly':
      return addMonths(date, 3);

    case 'yearly':
      if (options?.monthOfYear !== undefined && options?.dayOfMonth) {
        // Get the next year
        const nextYear = addYears(date, 1);

        // Create a date with the specified month and day in the next year
        const targetDate = new Date(getYear(nextYear), options.monthOfYear - 1, 1);

        // Get the number of days in the target month
        const daysInTargetMonth = getDaysInMonth(targetDate);

        // If the target day is greater than the days in the month, use the last day
        const targetDay = Math.min(options.dayOfMonth, daysInTargetMonth);

        // Set the day of the month
        return setDate(targetDate, targetDay);
      }
      return addYears(date, 1);

    default:
      throw new Error(`Invalid frequency: ${frequency}`);
  }
}

/**
 * Formats a date as YYYY-MM-DD
 * @param date The date to format
 * @returns The formatted date string
 */
export function formatDateForDatabase(date: Date | string): string {
  return format(new Date(date), 'yyyy-MM-dd');
}

/**
 * Formats a date as Month Day, Year
 * @param date The date to format
 * @returns The formatted date string
 */
export function formatDateForDisplay(date: Date | string): string {
  return format(new Date(date), 'MMMM d, yyyy');
}

/**
 * Checks if a date is in the past
 * @param date The date to check
 * @returns True if the date is in the past
 */
export function isDateInPast(date: Date | string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
}

/**
 * Checks if a date is today
 * @param date The date to check
 * @returns True if the date is today
 */
export function isDateToday(date: Date | string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate.getTime() === today.getTime();
}

/**
 * Checks if a date is in the future
 * @param date The date to check
 * @returns True if the date is in the future
 */
export function isDateInFuture(date: Date | string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate > today;
}
