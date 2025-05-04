import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, DollarSign, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ExpensePayment } from '@/hooks/expenses';
import { formatCurrency } from '@/lib/utils';

interface AddExpensePaymentFormProps {
  expenseId: string;
  onSubmit: (payment: Partial<ExpensePayment>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<ExpensePayment>;
}

const AddExpensePaymentForm: React.FC<AddExpensePaymentFormProps> = ({
  expenseId,
  onSubmit,
  onCancel,
  isSubmitting = false,
  defaultValues
}) => {
  // Initialize form data with default values if provided
  const [formData, setFormData] = useState<Partial<ExpensePayment>>({
    expense_id: expenseId,
    amount: defaultValues?.amount || 0,
    date: defaultValues?.date
      ? typeof defaultValues.date === 'string'
        ? defaultValues.date.includes('T')
          ? format(new Date(defaultValues.date), 'yyyy-MM-dd')
          : defaultValues.date
        : format(new Date(defaultValues.date), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd'),
    payment_method: defaultValues?.payment_method || 'cash'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      // Convert date to ISO format if it's not already
      const formattedData = {
        ...formData,
        // Ensure date is in ISO format for API
        date: formData.date
          ? formData.date.includes('T')
            ? formData.date
            : new Date(formData.date).toISOString()
          : new Date().toISOString()
      };

      // Log the form data for debugging
      console.log('Submitting payment form data:', {
        original: formData,
        formatted: formattedData,
        isEdit: !!defaultValues
      });

      await onSubmit(formattedData);
    } catch (error) {
      console.error('Error submitting payment:', error);
      // No need to show toast here as it's handled in the parent component
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="amount">Payment Amount</Label>
          <div className="relative mt-1">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="amount"
              name="amount"
              type="number"
              placeholder="0"
              value={formData.amount || ''}
              onChange={handleChange}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="date">Payment Date</Label>
          <div className="relative mt-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date || format(new Date(), 'yyyy-MM-dd')}
              onChange={handleChange}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="payment_method">Payment Method</Label>
          <Select
            value={formData.payment_method || 'cash'}
            onValueChange={(value) => handleSelectChange('payment_method', value)}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="mobile_money">Mobile Money</SelectItem>
              <SelectItem value="credit_card">Credit Card</SelectItem>
              <SelectItem value="check">Check</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Total Amount:</span>
          <span className="text-lg font-semibold">
            {formatCurrency(formData.amount || 0)}
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !formData.amount || formData.amount <= 0}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {defaultValues ? 'Updating...' : 'Adding...'}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {defaultValues ? 'Update Payment' : 'Add Payment'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default AddExpensePaymentForm;
