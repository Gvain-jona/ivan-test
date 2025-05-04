'use client';

import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExpensePayment } from '@/hooks/expenses';
import { PAYMENT_METHODS } from './schema';

// Form schema
const paymentFormSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  date: z.date(),
  payment_method: z.string().min(1, 'Payment method is required'),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PaymentFormValues) => Promise<void>;
  defaultValues?: Partial<ExpensePayment>;
  isSubmitting?: boolean;
}

export function PaymentForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isSubmitting = false,
}: PaymentFormProps) {
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize form with default values
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: defaultValues?.amount || 0,
      date: defaultValues?.date ? new Date(defaultValues.date) : new Date(),
      payment_method: defaultValues?.payment_method || 'cash',
    },
  });

  // Handle form submission
  const handleSubmit = async (values: PaymentFormValues) => {
    try {
      setFormError(null);
      await onSubmit(values);
      form.reset();
    } catch (error) {
      console.error('Error submitting payment form:', error);
      setFormError(error instanceof Error ? error.message : 'An error occurred while submitting the form');
    }
  };

  // Reset form when closed
  useEffect(() => {
    if (!open) {
      form.reset();
      setFormError(null);
    }
  }, [open, form]);

  // Handle body scroll locking
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-all duration-100 ease-in-out"
        onClick={() => onOpenChange(false)}
      />

      {/* Content */}
      <div className="fixed inset-y-0 right-0 z-50 w-full md:w-1/2 border-l bg-background p-0 shadow-lg transition ease-in-out duration-300 sm:max-w-md flex flex-col h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">
              {defaultValues ? 'Edit Payment' : 'Add Payment'}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {defaultValues
              ? 'Update the payment details below'
              : 'Enter the payment details below'}
          </p>
          {formError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-[calc(100vh-73px)]">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="font-medium">Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="h-10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="font-medium">Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal h-10",
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
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="font-medium">Payment Method</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="sticky bottom-0 z-10 bg-background p-6 border-t">
              <Button
                type="submit"
                className="w-full h-10 font-medium bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : defaultValues ? 'Update Payment' : 'Add Payment'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
