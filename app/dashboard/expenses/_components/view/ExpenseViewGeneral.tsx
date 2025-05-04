import React from 'react';
import { Calendar, DollarSign, Tag, User, Clock } from 'lucide-react';
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
import { Expense } from '@/hooks/expenses';
import { StatusBadge } from '../shared';

interface ExpenseViewGeneralProps {
  expense: Expense;
}

/**
 * General information section of the expense view
 */
export function ExpenseViewGeneral({ expense }: ExpenseViewGeneralProps) {
  // Format creator name
  const getCreatorName = () => {
    if (!expense?.created_by) return 'Unknown';
    if (typeof expense.created_by === 'string') return 'Unknown';
    return expense.created_by.full_name || 'Unknown';
  };

  return (
    <div>
      <h3 className="text-sm font-medium mb-2">General Information</h3>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between">
            <div>
              <CardTitle className="text-lg">{expense.category}</CardTitle>
              <CardDescription>{expense.item_name}</CardDescription>
            </div>
            <StatusBadge status={expense.payment_status} type="payment" />
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
  );
}
