'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { FileText, CheckSquare, Receipt, Wallet, ArrowUpCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { ExpensesTabContent } from './_components/table';
import { TasksTabContent } from './_components/tasks/TasksTabContent';
import { useExpenses } from '@/hooks/useExpenses';
import ExpensesPageHeader from './_components/ExpensesPageHeader';
import { ExpenseForm } from './_components/form';

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' or 'tasks'
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const expensesTabRef = useRef<{ handleAddExpense?: (values: any) => Promise<any> }>({});
  const searchParams = useSearchParams();

  // Set active tab based on query parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['expenses', 'tasks'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Handle add expense button click
  const handleAddExpense = () => {
    setIsAddingExpense(true);
    // Ensure we're on the expenses tab when adding a new expense
    setActiveTab('expenses');
  };

  // Register the ExpensesTabContent component's handleAddExpense function
  const registerHandleAddExpense = useCallback((handleAddExpense: (values: any) => Promise<any>) => {
    expensesTabRef.current = { handleAddExpense };
    console.log('ExpensesTabContent registered its handleAddExpense function');
  }, []);

  // Fetch expenses for metrics with improved error handling
  // This prevents unnecessary API calls when on other tabs
  const { expenses, isLoading, isError } = useExpenses(
    // Only fetch when on expenses tab
    activeTab === 'expenses' ? {} : null
  );

  // Log any errors for debugging
  useEffect(() => {
    if (isError) {
      console.error('Error loading expenses data:', isError);
    }
  }, [isError]);

  // Ensure expenses is an array to prevent errors
  const safeExpenses = Array.isArray(expenses) ? expenses : [];

  // Calculate metrics with safe array
  const totalExpenses = safeExpenses.reduce((sum, expense) => sum + (expense.total_amount || 0), 0);
  const paidExpenses = safeExpenses
    .filter(expense => expense?.payment_status === 'paid')
    .reduce((sum, expense) => sum + (expense.total_amount || 0), 0);
  const partiallyPaidExpenses = safeExpenses
    .filter(expense => expense?.payment_status === 'partially_paid')
    .reduce((sum, expense) => sum + (expense.total_amount || 0), 0);
  const unpaidExpenses = safeExpenses
    .filter(expense => expense?.payment_status === 'unpaid')
    .reduce((sum, expense) => sum + (expense.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      <ExpensesPageHeader
        title="Expenses"
        description="Manage and track your business expenses"
        onAddExpense={handleAddExpense}
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
              <Receipt className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-orange-500 mt-1 flex items-center">
              <ArrowUpCircle className="h-3 w-3 mr-1" />
              <span>This month</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid Expenses</CardTitle>
            <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
              <Wallet className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(paidExpenses)}</div>
            <p className="text-xs text-green-500 mt-1 flex items-center">
              <ArrowUpCircle className="h-3 w-3 mr-1" />
              <span>{totalExpenses > 0 ? Math.round((paidExpenses / totalExpenses) * 100) : 0}% of total</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unpaid Expenses</CardTitle>
            <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
              <Wallet className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(unpaidExpenses)}</div>
            <p className="text-xs text-red-500 mt-1 flex items-center">
              <ArrowUpCircle className="h-3 w-3 mr-1" />
              <span>{totalExpenses > 0 ? Math.round((unpaidExpenses / totalExpenses) * 100) : 0}% of total</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
            <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(safeExpenses.map(e => e?.category).filter(Boolean)).size}</div>
            <p className="text-xs text-blue-500 mt-1 flex items-center">
              <ArrowUpCircle className="h-3 w-3 mr-1" />
              <span>Active categories</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-transparent border border-border/40 rounded-lg p-1">
          <TabsTrigger
            value="expenses"
            className="text-sm font-medium text-muted-foreground py-2 px-4 rounded-md data-[state=active]:bg-white data-[state=active]:text-background hover:bg-muted/10"
          >
            <FileText className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
            Expenses
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="text-sm font-medium text-muted-foreground py-2 px-4 rounded-md data-[state=active]:bg-white data-[state=active]:text-background hover:bg-muted/10"
          >
            <CheckSquare className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
            Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          {/* Only render when active to prevent unnecessary renders and API calls */}
          {activeTab === 'expenses' && <ExpensesTabContent onRegisterHandleAddExpense={registerHandleAddExpense} />}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          {/* Only render when active to prevent unnecessary renders */}
          {activeTab === 'tasks' && <TasksTabContent />}
        </TabsContent>
      </Tabs>

      {/* Add Expense Form */}
      <ExpenseForm
        open={isAddingExpense}
        onOpenChange={setIsAddingExpense}
        onSubmit={async (values) => {
          try {
            console.log('Form submitted in expenses page, directly calling ExpensesTabContent.handleAddExpense...');

            // Check if we have the handleAddExpense function
            if (!expensesTabRef.current.handleAddExpense) {
              console.error('handleAddExpense function not registered yet');
              throw new Error('Internal error: handleAddExpense function not registered');
            }

            // Set submitting state to true
            setIsSubmitting(true);

            // Directly call the handleAddExpense function from the ExpensesTabContent component
            // This ensures we properly await the API call
            const result = await expensesTabRef.current.handleAddExpense(values);

            // Return the result to the form
            return result;
          } catch (error) {
            console.error('Error handling expense submission in expenses page:', error);
            throw error;
          } finally {
            // Reset submitting state
            setIsSubmitting(false);
          }
        }}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}