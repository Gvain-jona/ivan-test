import { useCallback } from 'react';
import { TaskRecurrenceFrequency } from '@/types/tasks';

interface UseTaskRecurrenceProps {
  isRecurring: boolean;
  frequency?: TaskRecurrenceFrequency;
  startDate?: string;
  endDate?: string;
  onRecurrenceChange: (isRecurring: boolean) => void;
  onFrequencyChange: (frequency: TaskRecurrenceFrequency) => void;
  onEndDateChange: (endDate: string) => void;
}

interface UseTaskRecurrenceReturn {
  isRecurring: boolean;
  frequency: TaskRecurrenceFrequency;
  startDate: string;
  endDate: string | undefined;
  toggleRecurrence: () => void;
  setFrequency: (frequency: TaskRecurrenceFrequency) => void;
  setEndDate: (endDate: string) => void;
  getNextOccurrence: (fromDate: string) => string;
  getOccurrences: (maxCount?: number) => string[];
  getHumanReadableSchedule: () => string;
}

/**
 * Custom hook for managing task recurrence
 */
export const useTaskRecurrence = ({
  isRecurring = false,
  frequency = 'weekly',
  startDate = new Date().toISOString().substring(0, 10),
  endDate,
  onRecurrenceChange,
  onFrequencyChange,
  onEndDateChange,
}: UseTaskRecurrenceProps): UseTaskRecurrenceReturn => {
  // Toggle recurrence on/off
  const toggleRecurrence = useCallback(() => {
    onRecurrenceChange(!isRecurring);
  }, [isRecurring, onRecurrenceChange]);
  
  // Set recurrence frequency
  const setFrequency = useCallback((newFrequency: TaskRecurrenceFrequency) => {
    onFrequencyChange(newFrequency);
  }, [onFrequencyChange]);
  
  // Set recurrence end date
  const setEndDate = useCallback((newEndDate: string) => {
    onEndDateChange(newEndDate);
  }, [onEndDateChange]);
  
  // Calculate the next occurrence based on frequency
  const getNextOccurrence = useCallback((fromDate: string): string => {
    const date = new Date(fromDate);
    
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'biweekly':
        date.setDate(date.getDate() + 14);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      default:
        return fromDate;
    }
    
    return date.toISOString().substring(0, 10);
  }, [frequency]);
  
  // Get multiple occurrences
  const getOccurrences = useCallback((maxCount: number = 10): string[] => {
    if (!isRecurring) return [startDate];
    
    const occurrences: string[] = [startDate];
    let currentDate = startDate;
    
    // Generate occurrences up to max count or end date
    for (let i = 1; i < maxCount; i++) {
      const nextDate = getNextOccurrence(currentDate);
      
      // Stop if we've reached the end date
      if (endDate && nextDate > endDate) break;
      
      occurrences.push(nextDate);
      currentDate = nextDate;
    }
    
    return occurrences;
  }, [isRecurring, startDate, endDate, getNextOccurrence]);
  
  // Generate a human-readable description of the recurrence
  const getHumanReadableSchedule = useCallback((): string => {
    if (!isRecurring) return 'One time task';
    
    const frequencyText = {
      daily: 'Daily',
      weekly: 'Weekly',
      biweekly: 'Every two weeks',
      monthly: 'Monthly'
    }[frequency];
    
    let schedule = `Repeats ${frequencyText.toLowerCase()}`;
    
    if (endDate) {
      schedule += ` until ${new Date(endDate).toLocaleDateString()}`;
    } else {
      schedule += ' (no end date)';
    }
    
    return schedule;
  }, [isRecurring, frequency, endDate]);
  
  return {
    isRecurring,
    frequency,
    startDate,
    endDate,
    toggleRecurrence,
    setFrequency,
    setEndDate,
    getNextOccurrence,
    getOccurrences,
    getHumanReadableSchedule,
  };
};

export default useTaskRecurrence; 