import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ExpensePayment } from '@/hooks/expenses';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface PaymentCardProps {
  payment: ExpensePayment;
  onEdit?: (payment: ExpensePayment) => void;
  onDelete?: (id: string) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * A reusable card component for displaying payment information
 */
export function PaymentCard({ payment, onEdit, onDelete, isSubmitting = false }: PaymentCardProps) {
  return (
    <Card className="overflow-hidden">
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
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(payment)}
            disabled={isSubmitting}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        )}
        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={isSubmitting}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
                <span className="sr-only">Delete</span>
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
                  onClick={() => onDelete(payment.id)}
                  className="bg-red-500 hover:bg-red-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  );
}
