'use client';

/**
 * @deprecated This file is deprecated and will be removed in the future.
 * Please use the components in the view directory instead.
 */

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Edit, Trash2, PlusCircle, X, FileText, Calendar, DollarSign, Tag, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn, formatCurrency, formatDate, getInitials } from '@/lib/utils';
import { Expense, ExpensePayment, ExpenseNote, useExpense } from '@/hooks/useExpenses';
import { PaymentForm } from './PaymentForm';
import { NoteForm } from './NoteForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ExpenseViewProps {
  expense: Expense;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => Promise<void>;
}

export function ExpenseView({
  expense,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: ExpenseViewProps) {
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    addPayment,
    updatePayment,
    deletePayment,
    addNote,
    updateNote,
    deleteNote,
    isSubmitting
  } = useExpense(expense?.id);

  // Get payment status badge color
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'partially_paid':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'unpaid':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return '';
    }
  };

  // Get note type badge color
  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'follow-up':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'urgent':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'internal':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default:
        return '';
    }
  };

  // Handle delete expense
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(expense.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting expense:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Format creator name
  const getCreatorName = () => {
    if (!expense?.created_by) return 'Unknown';
    if (typeof expense.created_by === 'string') return 'Unknown';
    return expense.created_by.full_name || 'Unknown';
  };

  if (!expense) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
        <SheetHeader className="mb-4">
          <div className="flex justify-between items-center">
            <SheetTitle>Expense Details</SheetTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onEdit(expense)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the expense
                      and all associated payments and notes.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <SheetDescription>
            View and manage expense details
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* General Information */}
          <div>
            <h3 className="text-sm font-medium mb-2">General Information</h3>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div>
                    <CardTitle className="text-lg">{expense.category}</CardTitle>
                    <CardDescription>{expense.description}</CardDescription>
                  </div>
                  <Badge variant="outline" className={getPaymentStatusColor(expense.payment_status)}>
                    {expense.payment_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Date
                    </p>
                    <p className="text-sm font-medium">{formatDate(expense.date)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Total Amount
                    </p>
                    <p className="text-sm font-medium">{formatCurrency(expense.total_amount)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Amount Paid
                    </p>
                    <p className="text-sm font-medium">{formatCurrency(expense.amount_paid)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Balance
                    </p>
                    <p className="text-sm font-medium">{formatCurrency(expense.balance)}</p>
                  </div>
                  {expense.responsible && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Responsible
                      </p>
                      <p className="text-sm font-medium">{expense.responsible}</p>
                    </div>
                  )}
                  {expense.vat > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Tag className="h-4 w-4 mr-2" />
                        VAT
                      </p>
                      <p className="text-sm font-medium">{formatCurrency(expense.vat)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="h-4 w-4 mr-2" />
                  Created by {getCreatorName()}
                  <Clock className="h-4 w-4 ml-4 mr-2" />
                  {formatDate(expense.created_at || '')}
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Payments */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">
                Payments
                {expense.payments && expense.payments.length > 0 && (
                  <Badge variant="outline" className="ml-2 bg-muted">
                    {expense.payments.length}
                  </Badge>
                )}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingPayment(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Payment
              </Button>
            </div>

            {expense.payments && expense.payments.length > 0 ? (
              <div className="space-y-3">
                {expense.payments.map((payment: ExpensePayment) => (
                  <Card key={payment.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-base">
                          {formatCurrency(payment.amount)}
                        </CardTitle>
                        <Badge variant="outline" className="capitalize">
                          {payment.payment_method.replace('_', ' ')}
                        </Badge>
                      </div>
                      <CardDescription>
                        {formatDate(payment.date)}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-end gap-2 pt-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          // Open payment form with this payment's data
                          // This would be implemented in a real application
                          alert('Edit payment functionality would be implemented here');
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this payment? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deletePayment(payment.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <DollarSign className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No payments yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setIsAddingPayment(true)}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Payment
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Notes */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">
                Notes
                {expense.notes && Array.isArray(expense.notes) && expense.notes.length > 0 && (
                  <Badge variant="outline" className="ml-2 bg-muted">
                    {expense.notes.length}
                  </Badge>
                )}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingNote(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </div>

            {expense.notes && Array.isArray(expense.notes) && expense.notes.length > 0 ? (
              <div className="space-y-3">
                {expense.notes.map((note: ExpenseNote) => (
                  <Card key={note.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <Badge variant="outline" className={cn("capitalize", getNoteTypeColor(note.type))}>
                          {note.type.replace('-', ' ')}
                        </Badge>
                        <CardDescription>
                          {formatDate(note.created_at || '')}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm">{note.text}</p>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 pt-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          // Handle edit note
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          // Handle delete note
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No notes yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setIsAddingNote(true)}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Payment Form */}
        <PaymentForm
          open={isAddingPayment}
          onOpenChange={setIsAddingPayment}
          onSubmit={async (values) => {
            await addPayment(values);
            setIsAddingPayment(false);
          }}
          isSubmitting={isSubmitting}
        />

        {/* Note Form */}
        <NoteForm
          open={isAddingNote}
          onOpenChange={setIsAddingNote}
          onSubmit={async (values) => {
            await addNote(values);
            setIsAddingNote(false);
          }}
          isSubmitting={isSubmitting}
        />
      </SheetContent>
    </Sheet>
  );
}
