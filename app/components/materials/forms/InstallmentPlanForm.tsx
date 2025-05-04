import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addDays } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useCreateInstallmentPlan } from '@/hooks/materials';
import { Button } from '@/components/ui/button';
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
  SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useSWRConfig } from 'swr';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

// Define the form schema
const formSchema = z.object({
  total_installments: z.coerce.number().min(1, 'Must have at least 1 installment'),
  payment_frequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly']),
  first_payment_date: z.date(),
  reminder_days: z.coerce.number().min(0).max(30).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface InstallmentPlanFormProps {
  purchaseId: string;
  remainingBalance: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function InstallmentPlanForm({
  purchaseId,
  remainingBalance,
  onSuccess,
  onCancel,
  open,
  onOpenChange,
  children
}: InstallmentPlanFormProps) {
  const { toast } = useToast();
  const { createInstallmentPlan, isLoading } = useCreateInstallmentPlan(purchaseId);
  const { mutate: globalMutate } = useSWRConfig();

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      total_installments: 3,
      payment_frequency: 'monthly',
      first_payment_date: addDays(new Date(), 30), // Default to 30 days from now
      reminder_days: 3,
    },
  });

  // Calculate installment amount based on total installments
  const totalInstallments = form.watch('total_installments');
  const installmentAmount = totalInstallments > 0
    ? (remainingBalance / totalInstallments).toFixed(2)
    : '0.00';

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    try {
      console.log('Creating installment plan with data:', {
        total_installments: data.total_installments,
        payment_frequency: data.payment_frequency,
        first_payment_date: format(data.first_payment_date, 'yyyy-MM-dd'),
        reminder_days: data.reminder_days,
      });

      // Make the API call directly to ensure we get the full response
      const response = await fetch(`/api/material-purchases/${purchaseId}/installments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          total_installments: data.total_installments,
          payment_frequency: data.payment_frequency,
          first_payment_date: format(data.first_payment_date, 'yyyy-MM-dd'),
          reminder_days: data.reminder_days,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to create installment plan');
      }

      console.log('Installment plan created successfully:', result);

      // Ensure we have the installments data from the response
      const installments = result.data?.installments || result.installments;

      if (!installments || installments.length === 0) {
        console.warn('Installment plan created but no installments returned in the response');

        // Force a direct fetch of installments to ensure they're in the cache
        try {
          console.log('Fetching installments directly after creation');
          const installmentsResponse = await fetch(`/api/material-purchases/${purchaseId}/installments`);

          if (installmentsResponse.ok) {
            const installmentsResult = await installmentsResponse.json();
            console.log('Fetched installments after creation:', installmentsResult);
          }
        } catch (fetchError) {
          console.error('Error fetching installments after creation:', fetchError);
        }
      }

      toast({
        title: 'Installment plan created',
        description: 'Your installment plan has been created successfully.',
      });

      // Wait a moment to ensure data is properly saved before refreshing
      await new Promise(resolve => setTimeout(resolve, 500));

      // Implement aggressive cache invalidation strategy
      try {
        console.log('Implementing aggressive cache invalidation after plan creation');

        // Define all the cache keys that need to be invalidated
        const cacheKeys = [
          // Main purchase cache keys
          `${API_ENDPOINTS.MATERIALS}/${purchaseId}`,
          `${API_ENDPOINTS.MATERIALS}/${purchaseId}/optimized`,
          `${API_ENDPOINTS.MATERIALS}/${purchaseId}/optimized?include_installments=true`,
          `${API_ENDPOINTS.MATERIALS}/${purchaseId}/optimized?include_payments=true&include_notes=true&include_installments=true`,

          // Specific data type cache keys
          `${API_ENDPOINTS.MATERIALS}/${purchaseId}/installments`,

          // List cache keys (these might contain the purchase)
          `${API_ENDPOINTS.MATERIALS}/optimized`,
          `material-purchase-${purchaseId}`,
          `material-purchases-list`
        ];

        // Invalidate all cache keys
        console.log('Invalidating the following cache keys:', cacheKeys);
        for (const key of cacheKeys) {
          await globalMutate(
            (cacheKey) => typeof cacheKey === 'string' && cacheKey.includes(key),
            undefined,
            { revalidate: true }
          );
        }

        // Force a direct fetch of the installments to ensure they're in the cache
        console.log('Forcing a direct fetch of installments after plan creation');

        // First try the optimized endpoint with a fresh fetch (no-cache)
        const optimizedResponse = await fetch(
          `${API_ENDPOINTS.MATERIALS}/${purchaseId}/optimized?include_installments=true`,
          { cache: 'no-store' }
        );

        if (optimizedResponse.ok) {
          const optimizedResult = await optimizedResponse.json();
          console.log('Fetched from optimized endpoint after plan creation:', optimizedResult);

          // Update the SWR cache with this fresh data
          globalMutate(`${API_ENDPOINTS.MATERIALS}/${purchaseId}/optimized?include_installments=true`, optimizedResult);
        }

        // Also try the direct endpoint to ensure we have the data
        const installmentsResponse = await fetch(
          `${API_ENDPOINTS.MATERIALS}/${purchaseId}/installments`,
          { cache: 'no-store' }
        );

        if (installmentsResponse.ok) {
          const installmentsResult = await installmentsResponse.json();
          console.log('Fetched installments directly after plan creation:', installmentsResult);

          // Update the SWR cache with this fresh data
          globalMutate(`${API_ENDPOINTS.MATERIALS}/${purchaseId}/installments`, installmentsResult);
        }
      } catch (fetchError) {
        console.error('Error in cache invalidation after plan creation:', fetchError);
      }

      // Wait a longer moment to ensure data is properly saved and cache is invalidated
      await new Promise(resolve => setTimeout(resolve, 800));

      // Call onSuccess to refresh the parent component
      if (onSuccess) {
        console.log('Calling onSuccess to refresh parent component');
        await onSuccess();
      }

      // Wait another moment to ensure all data is properly refreshed
      await new Promise(resolve => setTimeout(resolve, 500));

      if (onOpenChange) onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating installment plan:', error);
      toast({
        title: 'Error creating installment plan',
        description: error.message || 'An error occurred while creating the installment plan.',
        variant: 'destructive',
      });
    }
  };

  // If children are provided, render them as a trigger for the sheet
  if (children) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          {children}
        </SheetTrigger>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Create Installment Plan</SheetTitle>
            <SheetDescription>
              Set up an installment payment plan for this purchase
            </SheetDescription>
          </SheetHeader>
          <div className="py-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Remaining Balance</div>
                  <div className="text-lg font-semibold">${remainingBalance.toFixed(2)}</div>
                </div>

                {/* Number of Installments */}
                <FormField
                  control={form.control}
                  name="total_installments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Installments</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter number of installments"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.valueAsNumber || 1);
                          }}
                          min={1}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Installment Amount (calculated) */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Installment Amount</div>
                  <div className="text-lg font-semibold">${installmentAmount}</div>
                </div>

                {/* Payment Frequency */}
                <FormField
                  control={form.control}
                  name="payment_frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* First Payment Date */}
                <FormField
                  control={form.control}
                  name="first_payment_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>First Payment Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
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
                              date < new Date()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Reminder Days */}
                <FormField
                  control={form.control}
                  name="reminder_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reminder Days Before Due Date</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter days before due date for reminder"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.valueAsNumber || 3);
                          }}
                          min={0}
                          max={30}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (onOpenChange) onOpenChange(false);
                      if (onCancel) onCancel();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Plan
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // If no children are provided, still use the Sheet component but with a hidden trigger
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <span className="hidden" />
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Create Installment Plan</SheetTitle>
          <SheetDescription>
            Set up an installment payment plan for this purchase
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <div className="text-sm font-medium">Remaining Balance</div>
                <div className="text-lg font-semibold">${remainingBalance.toFixed(2)}</div>
              </div>

              {/* Number of Installments */}
              <FormField
                control={form.control}
                name="total_installments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Installments</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter number of installments"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.valueAsNumber || 1);
                        }}
                        min={1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Installment Amount (calculated) */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Installment Amount</div>
                <div className="text-lg font-semibold">${installmentAmount}</div>
              </div>

              {/* Payment Frequency */}
              <FormField
                control={form.control}
                name="payment_frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* First Payment Date */}
              <FormField
                control={form.control}
                name="first_payment_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>First Payment Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
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
                            date < new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reminder Days */}
              <FormField
                control={form.control}
                name="reminder_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder Days Before Due Date</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter days before due date for reminder"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.valueAsNumber || 3);
                        }}
                        min={0}
                        max={30}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (onOpenChange) onOpenChange(false);
                    if (onCancel) onCancel();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Plan
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
