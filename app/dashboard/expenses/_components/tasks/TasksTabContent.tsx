'use client';

import React, { useState } from 'react';
import { CheckSquare } from 'lucide-react';
import { RecurringExpensesList } from './RecurringExpensesList';
// import { CalendarWithSidebar } from './CalendarWithSidebar';
// import { TaskForm } from './TaskForm';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import { RecurringExpensesProvider } from '../../_context/RecurringExpensesContext';

/**
 * Provider wrapper for the Tasks tab
 */
export function TasksTabContent() {
  return (
    <RecurringExpensesProvider>
      <TasksTabContentInner />
    </RecurringExpensesProvider>
  );
}

/**
 * Inner content component with access to the RecurringExpensesContext
 */
function TasksTabContentInner() {
  // Check if we're in dark mode - we'll use this for theming
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const isDarkMode = typeof document !== 'undefined'
    ? document.documentElement.classList.contains('dark')
    : prefersDarkMode;

  return (
    <div className="space-y-4">
      {/* View Content */}
      <RecurringExpensesList />

      {/* Task Form - Commented out as requested
      <TaskForm
        open={isAddingTask}
        onOpenChange={setIsAddingTask}
        onSubmit={() => {
          setIsAddingTask(false);
          // In the future, this would create a task
        }}
      />
      */}
    </div>
  );
}
