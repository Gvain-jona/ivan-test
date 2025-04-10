'use client';

import React, { useState } from 'react';
import { PlusCircle, ListFilter, FileText, CheckSquare, Receipt, Wallet, ArrowUpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';

// Define types for our data
interface Expense {
  id: string;
  category: string;
  date: string;
  amount: number;
  status: string;
  paymentMethod: string;
  notes: string;
}

// Sample expense data for development
const SAMPLE_EXPENSES: Expense[] = [
  {
    id: 'EXP-001',
    category: 'Rent',
    date: '2024-03-15',
    amount: 2500.00,
    status: 'Paid',
    paymentMethod: 'Bank Transfer',
    notes: 'Office space monthly rent'
  },
  {
    id: 'EXP-002',
    category: 'Utilities',
    date: '2024-03-20',
    amount: 350.00,
    status: 'Pending',
    paymentMethod: 'Cash',
    notes: 'Electricity and water bills'
  },
  {
    id: 'EXP-003',
    category: 'Equipment',
    date: '2024-03-25',
    amount: 1200.00,
    status: 'Paid',
    paymentMethod: 'Credit Card',
    notes: 'New printer purchase'
  },
];

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' or 'tasks'

  // Calculate metrics
  const totalExpenses = SAMPLE_EXPENSES.reduce((sum, expense) => sum + expense.amount, 0);
  const paidExpenses = SAMPLE_EXPENSES
    .filter(expense => expense.status === 'Paid')
    .reduce((sum, expense) => sum + expense.amount, 0);
  const pendingExpenses = SAMPLE_EXPENSES
    .filter(expense => expense.status === 'Pending')
    .reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground mt-1">Manage and track your business expenses</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-9">
            <ListFilter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm" className="h-9">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Expense
          </Button>
        </div>
      </div>

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
              <span>{Math.round((paidExpenses / totalExpenses) * 100)}% of total</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Expenses</CardTitle>
            <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
              <Wallet className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingExpenses)}</div>
            <p className="text-xs text-yellow-500 mt-1 flex items-center">
              <ArrowUpCircle className="h-3 w-3 mr-1" />
              <span>{Math.round((pendingExpenses / totalExpenses) * 100)}% of total</span>
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
            <div className="text-2xl font-bold">{new Set(SAMPLE_EXPENSES.map(e => e.category)).size}</div>
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
            className="text-sm font-medium text-muted-foreground py-2 px-4 rounded-md data-[state=active]:bg-orange-500 data-[state=active]:text-white hover:bg-muted/10"
          >
            <FileText className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
            Expenses
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="text-sm font-medium text-muted-foreground py-2 px-4 rounded-md data-[state=active]:bg-orange-500 data-[state=active]:text-white hover:bg-muted/10"
          >
            <CheckSquare className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
            Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <ExpensesTabContent expenses={SAMPLE_EXPENSES} />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <TasksTabContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Expenses tab content with expense listing
function ExpensesTabContent({ expenses }: { expenses: Expense[] }) {
  return (
    <div className="rounded-xl border border-border/40 overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/5">
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="font-medium">{expense.id}</TableCell>
              <TableCell>{expense.category}</TableCell>
              <TableCell>{expense.date}</TableCell>
              <TableCell>{formatCurrency(expense.amount)}</TableCell>
              <TableCell>
                <Badge variant="outline" className={expense.status === 'Paid'
                  ? 'bg-green-500/10 text-green-500 border-green-500/20'
                  : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                }>
                  {expense.status}
                </Badge>
              </TableCell>
              <TableCell>{expense.paymentMethod}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <FileText className="h-4 w-4" />
                    <span className="sr-only">View</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <PlusCircle className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Tasks tab content (placeholder for now)
function TasksTabContent() {
  return (
    <Card className="bg-transparent border-border/40">
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Expense-related tasks</h3>
          <p className="text-muted-foreground max-w-md">This feature is currently under development. You'll be able to manage tasks related to your expenses here.</p>
          <Button variant="outline" className="mt-4">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}