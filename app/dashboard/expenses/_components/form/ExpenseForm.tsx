import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { X, Settings, RefreshCw, CreditCard, StickyNote, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Expense } from '@/hooks/expenses';
import { ExpenseFormGeneral } from './ExpenseFormGeneral';
import { ExpenseFormRecurrence } from './ExpenseFormRecurrence';
import { ExpenseFormPayments } from './ExpenseFormPayments';
import { ExpenseFormNotes } from './ExpenseFormNotes';
import { expenseFormSchema, ExpenseFormValues } from './schema';
import { toast } from 'sonner';

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ExpenseFormValues) => Promise<void>;
  defaultValues?: Partial<Expense>;
  isSubmitting?: boolean;
}

export function ExpenseForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isSubmitting = false,
}: ExpenseFormProps) {
  // Check if we're in dark mode - we'll use this for theming
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const isDarkMode = typeof document !== 'undefined'
    ? document.documentElement.classList.contains('dark')
    : prefersDarkMode;
  const [formError, setFormError] = useState<string | null>(null);

  // Memoize default values to prevent unnecessary re-renders
  const formDefaultValues = useMemo(() => {
    // Log the default category value
    console.log('Default category value:', defaultValues?.category);

    // Force the category to be either 'fixed' or 'variable'
    const category = defaultValues?.category === 'fixed' ? 'fixed' : 'variable';
    console.log('Initializing form with category:', category);

    return {
    category,
    item_name: defaultValues?.item_name || '',
    quantity: defaultValues?.quantity || 1,
    unit_cost: defaultValues?.unit_cost || 0,
    responsible: defaultValues?.responsible || '',
    total_amount: defaultValues?.total_amount || 0,
    date: defaultValues?.date ? new Date(defaultValues.date) : new Date(),
    vat: defaultValues?.vat || 0,

    // Toggle settings
    is_recurring: defaultValues?.is_recurring || false,
    has_installments: defaultValues?.payments && defaultValues.payments.length > 0 || false,
    has_notes: defaultValues?.notes && Array.isArray(defaultValues.notes) && defaultValues.notes.length > 0 || false,

    // Recurrence settings
    recurrence_frequency: defaultValues?.recurrence_frequency,
    recurrence_start_date: defaultValues?.recurrence_start_date ? new Date(defaultValues.recurrence_start_date) : new Date(),
    recurrence_end_date: defaultValues?.recurrence_end_date ? new Date(defaultValues.recurrence_end_date) : undefined,
    reminder_days: defaultValues?.reminder_days || 0,

    // Advanced recurrence pattern settings
    recurrence_day_of_month: defaultValues?.recurrence_day_of_month || new Date().getDate(),
    recurrence_month_of_year: defaultValues?.recurrence_month_of_year || new Date().getMonth() + 1,
    recurrence_day_of_week: defaultValues?.recurrence_day_of_week || new Date().getDay(),
    recurrence_week_of_month: defaultValues?.recurrence_week_of_month || Math.ceil(new Date().getDate() / 7),
    recurrence_time: defaultValues?.recurrence_time || undefined,
    monthly_recurrence_type: defaultValues?.monthly_recurrence_type || 'day_of_month',

    // Payments and notes
    payments: defaultValues?.payments?.map(payment => ({
      amount: payment.amount,
      date: new Date(payment.date),
      payment_method: payment.payment_method,
    })) || [],
    notes: defaultValues?.notes && Array.isArray(defaultValues.notes)
      ? defaultValues.notes.map(note => ({
          type: note.type,
          text: note.text,
        }))
      : [],
  };
  }, [defaultValues]);

  // Initialize form with default values
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: formDefaultValues,
  });

  // Field arrays for payments and notes
  const { fields: paymentFields, append: appendPayment, remove: removePayment } = useFieldArray({
    control: form.control,
    name: 'payments',
  });

  const { fields: noteFields, append: appendNote, remove: removeNote } = useFieldArray({
    control: form.control,
    name: 'notes',
  });

  // Use selective watching to minimize re-renders
  const isRecurring = form.watch('is_recurring');
  const hasInstallments = form.watch('has_installments');
  const hasNotes = form.watch('has_notes');

  // Memoize the calculation function
  const calculateTotalAmount = useCallback(() => {
    const quantity = form.getValues('quantity') || 0;
    const unitCost = form.getValues('unit_cost') || 0;
    if (quantity && unitCost) {
      form.setValue('total_amount', quantity * unitCost, { shouldValidate: true });
    }
  }, [form]);

  // Set up listeners for quantity and unit cost changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'quantity' || name === 'unit_cost') {
        calculateTotalAmount();
      }
    });

    return () => subscription.unsubscribe();
  }, [form, calculateTotalAmount]);

  // Handle form submission with improved error handling and user feedback
  const handleSubmit = useCallback(async (values: ExpenseFormValues) => {
    try {
      // Don't proceed if already submitting
      if (isSubmitting) {
        console.log('Form submission already in progress, ignoring duplicate submission');
        return;
      }

      // Set local form error state to null
      setFormError(null);

      // Log the raw form values
      console.log('Raw form values:', values);
      console.log('Category value before formatting:', values.category);

      // Ensure category is explicitly set and not overridden
      // Force the category to be either 'fixed' or 'variable'
      const category = values.category === 'fixed' ? 'fixed' : 'variable';
      console.log('Final category value in handleSubmit:', category);

      // If installment payments are disabled, create a single payment for the full amount
      let payments = values.payments || [];
      if (!values.has_installments) {
        // Create a single payment for the full amount
        payments = [{
          amount: values.total_amount,
          date: values.date,
          payment_method: 'cash'
        }];
        console.log('Created full payment automatically:', payments);
      }

      // Only include notes if the notes toggle is enabled
      const notes = values.has_notes ? values.notes : [];

      const formattedValues = {
        ...values,
        category,
        payments,
        notes
      };

      // Log the values being submitted
      console.log('Form values before submission:', formattedValues);

      // Submit the form - the parent component will handle the loading state and success toast
      // We await the result to ensure we don't proceed until the API call is complete
      console.log('Submitting expense form to parent component...');
      const result = await onSubmit(formattedValues);
      console.log('Form submission completed with result:', result);

      // Only reset the form if the submission was successful
      // The parent component should return a truthy value to indicate success
      if (result) {
        console.log('Submission successful, resetting form');

        // Reset the form for a new entry if this is a create operation
        if (!defaultValues) {
          form.reset(formDefaultValues);
        }

        // Note: We don't show a success toast here anymore
        // The parent component (useExpensesList hook) will handle that
        // This prevents duplicate success notifications
      }

      // Important: Don't close the form automatically
      // This allows the user to make additional entries
      // onOpenChange(false); - removed to keep form open
    } catch (error) {
      console.error('Error submitting expense form:', error);

      // Improved error handling
      let errorMessage = 'An error occurred while submitting the form';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        try {
          errorMessage = JSON.stringify(error);
        } catch (e) {
          console.error('Error stringifying error object:', e);
        }
      }

      // Show error toast - we keep this here as it's specific to form validation errors
      // API errors will be handled by the parent component
      toast.error('Form Error', {
        description: errorMessage,
        duration: 5000,
      });

      setFormError(errorMessage);
    }
  }, [form, onSubmit, defaultValues, formDefaultValues, isSubmitting]);

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

  // Memoize form reset handler to prevent unnecessary re-renders
  const handleReset = useCallback(() => {
    form.reset(formDefaultValues);
    setFormError(null);
  }, [form, formDefaultValues]);

  // Memoize close handler to prevent unnecessary re-renders
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-all duration-100 ease-in-out"
        onClick={handleClose}
      />

      {/* Content */}
      <div className="fixed inset-y-0 right-0 z-50 w-full md:w-3/4 lg:w-2/3 border-l bg-background p-0 shadow-lg transition ease-in-out duration-300 sm:max-w-2xl md:max-w-3xl flex flex-col h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background p-6 border-b flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {defaultValues ? 'Edit Expense' : 'Add New Expense'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {defaultValues
                ? 'Update the expense details below'
                : 'Enter the expense details below'}
            </p>
            {formError && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-[calc(100vh-73px)]">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-28">
              {/* General Information */}
              <ExpenseFormGeneral control={form.control} />

              {/* Recurrence Toggle and Settings */}
              <div className="space-y-4">
                <div className={cn(
                  "flex items-center gap-2 p-3 rounded-lg",
                  isDarkMode ? "bg-white/5 border border-white/10" : "bg-background/5 border border-background/10"
                )}>
                  <Settings className={cn(
                    "h-5 w-5",
                    isDarkMode ? "text-white" : "text-background"
                  )} />
                  <h3 className="text-base font-medium">Additional Sections</h3>
                </div>

                {/* Recurring Expense Toggle */}
                <FormField
                  control={form.control}
                  name="is_recurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-4">
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            <div>
                              <FormLabel className="font-medium">Recurring Expense</FormLabel>
                              <FormDescription className="text-xs">
                                Enable for expenses that repeat regularly
                              </FormDescription>
                            </div>
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>

                      {/* Recurrence Settings - directly below the toggle */}
                      {isRecurring && (
                        <div className="ml-4 border-l-2 pl-4 pt-2">
                          <ExpenseFormRecurrence
                            control={form.control}
                            isRecurring={isRecurring}
                          />
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                {/* Installment Payments Toggle */}
                <FormField
                  control={form.control}
                  name="has_installments"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-4">
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <div>
                              <FormLabel className="font-medium">Installment Payments</FormLabel>
                              <FormDescription className="text-xs">
                                Enable to add multiple payments for this expense
                              </FormDescription>
                            </div>
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>

                      {/* Payments - directly below the toggle */}
                      {hasInstallments && (
                        <div className="ml-4 border-l-2 pl-4 pt-2">
                          <ExpenseFormPayments
                            control={form.control}
                            paymentFields={paymentFields}
                            appendPayment={appendPayment}
                            removePayment={removePayment}
                          />
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                {/* Notes Toggle */}
                <FormField
                  control={form.control}
                  name="has_notes"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-4">
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <StickyNote className="h-4 w-4" />
                            <div>
                              <FormLabel className="font-medium">Notes</FormLabel>
                              <FormDescription className="text-xs">
                                Enable to add notes to this expense
                              </FormDescription>
                            </div>
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>

                      {/* Notes - directly below the toggle */}
                      {hasNotes && (
                        <div className="ml-4 border-l-2 pl-4 pt-2">
                          <ExpenseFormNotes
                            control={form.control}
                            noteFields={noteFields}
                            appendNote={appendNote}
                            removeNote={removeNote}
                          />
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="sticky bottom-0 z-10 bg-background p-6 border-t">
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "flex-1 h-10 font-medium",
                    isDarkMode
                      ? "border-white/20 hover:bg-white/10"
                      : "border-black/20 hover:bg-black/10"
                  )}
                  onClick={handleReset}
                  disabled={isSubmitting}
                >
                  Clear Form
                </Button>
                <Button
                  type="submit"
                  className={cn(
                    "flex-1 h-10 font-medium",
                    isDarkMode
                      ? "bg-white text-black hover:bg-white/90"
                      : "bg-black text-white hover:bg-black/90"
                  )}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {defaultValues ? 'Updating...' : 'Saving...'}
                    </>
                  ) : (
                    defaultValues ? 'Update Expense' : 'Add Expense'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
