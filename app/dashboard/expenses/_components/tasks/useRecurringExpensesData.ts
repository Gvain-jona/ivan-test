import { useMemo } from 'react';
import { format, isToday, isTomorrow, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isBefore, isAfter, isSameDay } from 'date-fns';
import { FilterType, RecurringExpense, RecurringExpenseOccurrence } from './types';

interface FilterCounts {
  all: number;
  today: number;
  tomorrow: number;
  thisWeek: number;
  nextWeek: number;
  thisMonth: number;
  upcoming: number;
  overdue: number;
  completed: number;
}

interface UseRecurringExpensesDataResult {
  filteredOccurrences: RecurringExpenseOccurrence[];
  groupedOccurrences: Record<string, RecurringExpenseOccurrence[]>;
  sortedDates: string[];
  filterCounts: FilterCounts;
}

export function useRecurringExpensesData(
  occurrences: RecurringExpenseOccurrence[],
  filter: FilterType,
  searchQuery: string,
  useClientSideFiltering: boolean = true
): UseRecurringExpensesDataResult {
  // Filter occurrences based on selected filter and search query
  const filteredOccurrences = useMemo(() => {
    return occurrences.filter(occurrence => {
      const expense = occurrence.expense || {} as RecurringExpense;
      const occurrenceDate = new Date(occurrence.occurrence_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = addDays(today, 1);
      const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
      const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
      const nextWeekStart = addDays(thisWeekEnd, 1);
      const nextWeekEnd = addDays(nextWeekStart, 6);
      const thisMonthStart = startOfMonth(today);
      const thisMonthEnd = endOfMonth(today);

      // Search filter
      const matchesSearch = searchQuery === '' ||
        (expense.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         expense.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         expense.recurrence_frequency?.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Date/status filter
      switch (filter) {
        case 'today':
          return isToday(occurrenceDate) && occurrence.status === 'pending';
        case 'tomorrow':
          return isSameDay(occurrenceDate, tomorrow) && occurrence.status === 'pending';
        case 'thisWeek':
          return (
            isAfter(occurrenceDate, thisWeekStart) &&
            isBefore(occurrenceDate, thisWeekEnd) &&
            occurrence.status === 'pending'
          );
        case 'nextWeek':
          return (
            isAfter(occurrenceDate, nextWeekStart) &&
            isBefore(occurrenceDate, nextWeekEnd) &&
            occurrence.status === 'pending'
          );
        case 'thisMonth':
          return (
            isAfter(occurrenceDate, thisMonthStart) &&
            isBefore(occurrenceDate, thisMonthEnd) &&
            occurrence.status === 'pending'
          );
        case 'upcoming':
          return occurrenceDate > today && occurrence.status === 'pending';
        case 'overdue':
          return occurrenceDate < today && occurrence.status === 'pending';
        case 'completed':
          return occurrence.status === 'completed';
        case 'all':
        default:
          return true;
      }
    });
  }, [occurrences, filter, searchQuery]);

  // Group occurrences by date for better organization
  const groupedOccurrences = useMemo(() => {
    return filteredOccurrences.reduce((groups, occurrence) => {
      const date = new Date(occurrence.occurrence_date);
      const dateKey = format(date, 'yyyy-MM-dd');

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }

      groups[dateKey].push(occurrence);
      return groups;
    }, {} as Record<string, RecurringExpenseOccurrence[]>);
  }, [filteredOccurrences]);

  // Sort dates
  const sortedDates = useMemo(() => {
    return Object.keys(groupedOccurrences).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });
  }, [groupedOccurrences]);

  // Calculate counts for each filter
  const filterCounts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = addDays(today, 1);
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const nextWeekStart = addDays(thisWeekEnd, 1);
    const nextWeekEnd = addDays(nextWeekStart, 6);
    const thisMonthStart = startOfMonth(today);
    const thisMonthEnd = endOfMonth(today);

    return {
      all: occurrences.length,
      today: occurrences.filter(o => isToday(new Date(o.occurrence_date)) && o.status === 'pending').length,
      tomorrow: occurrences.filter(o => isSameDay(new Date(o.occurrence_date), tomorrow) && o.status === 'pending').length,
      thisWeek: occurrences.filter(o => {
        const date = new Date(o.occurrence_date);
        return isAfter(date, thisWeekStart) && isBefore(date, thisWeekEnd) && o.status === 'pending';
      }).length,
      nextWeek: occurrences.filter(o => {
        const date = new Date(o.occurrence_date);
        return isAfter(date, nextWeekStart) && isBefore(date, nextWeekEnd) && o.status === 'pending';
      }).length,
      thisMonth: occurrences.filter(o => {
        const date = new Date(o.occurrence_date);
        return isAfter(date, thisMonthStart) && isBefore(date, thisMonthEnd) && o.status === 'pending';
      }).length,
      upcoming: occurrences.filter(o => new Date(o.occurrence_date) > today && o.status === 'pending').length,
      overdue: occurrences.filter(o => new Date(o.occurrence_date) < today && o.status === 'pending').length,
      completed: occurrences.filter(o => o.status === 'completed').length,
    };
  }, [occurrences]);

  return {
    filteredOccurrences,
    groupedOccurrences,
    sortedDates,
    filterCounts
  };
}
