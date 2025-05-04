'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, CalendarIcon, DollarSign, Save } from 'lucide-react';
import { MaterialPayment } from '@/types/materials';
import { BottomOverlayForm } from './BottomOverlayForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Form schema
const formSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  date: z.date({
    required_error: "Payment date is required",
  }),
  payment_method: z.string().min(1, 'Payment method is required'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditMaterialPaymentFormProps {
  payment: MaterialPayment;
  onSubmit: (payment: MaterialPayment) => Promise<boolean>;
  onClose: () => void;
  isSubmitting: boolean;
}

/**
 * Form for editing an existing payment
 * Matches the styling used in expense view
 */
export function EditMaterialPaymentForm({
  payment,
  onSubmit,
  onClose,
  isSubmitting
}: EditMaterialPaymentFormProps) {
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize form with payment data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: payment.amount || 0,
      date: payment.date ? parseISO(payment.date) : new Date(),
      payment_method: payment.payment_method || 'cash',
      notes: payment.notes || '',
    },
  });

  // Handle form submission
  const handleSubmit = async (data: FormValues) => {
    try {
      setFormError(null);

      const updatedPayment: MaterialPayment = {
        ...payment,
        amount: data.amount,
        date: data.date.toISOString(),
        payment_method: data.payment_method,
        notes: data.notes,
      };

      const success = await onSubmit(updatedPayment);

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      setFormError(error instanceof Error ? error.message : 'An error occurred while updating the payment');
    }
  };

  // Get form values for summary
  const watchAmount = form.watch('amount');
  const formattedAmount = formatCurrency(watchAmount || 0);

  return (
    <BottomOverlayForm title="Edit Payment" onClose={onClose}>
      <div className="mb-6">
        <div className="bg-muted/50 rounded-lg p-4 mb-4 border border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Payment Details</p>
              <p className="font-medium">{format(payment.date ? parseISO(payment.date) : new Date(), "MMM d, yyyy")}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Original Amount</p>
              <p className="font-medium text-green-500">{formatCurrency(payment.amount || 0)}</p>
            </div>
          </div>
        </div>

        {formError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (UGX)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-9"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Payment Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Add notes about this payment"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="w-full">
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </BottomOverlayForm>
  );
}
