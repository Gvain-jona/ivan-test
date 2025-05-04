'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface ExpensesPageHeaderProps {
  title: string;
  description: string;
  onAddExpense?: () => void;
}

/**
 * Header component for the Expenses page displaying the title, description, and add button
 */
const ExpensesPageHeader: React.FC<ExpensesPageHeaderProps> = ({
  title,
  description,
  onAddExpense
}) => {
  return (
    <div className="flex flex-row justify-between items-center mb-2">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      {onAddExpense && (
        <Button
          onClick={onAddExpense}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold flex items-center gap-2 px-5 py-2.5 h-11 shadow-md hover:shadow-lg hover:translate-y-[-1px] transition-all duration-200 rounded-lg text-base"
          size="lg"
        >
          <PlusCircle className="h-5 w-5" />
          New Expense
        </Button>
      )}
    </div>
  );
};

export default ExpensesPageHeader;
