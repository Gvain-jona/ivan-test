"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { OrderPaymentFormValues, orderPaymentSchema } from '@/schemas/order-schema';
import { OrderPayment, PaymentMethod } from '@/types/orders';
import { formatCurrency } from '@/utils/formatting.utils';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { X } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InlinePaymentFormProps {
  onAddPayment: (payment: OrderPayment) => void;
  onRemoveForm: (index: number) => void;
  formIndex: number;
  displayNumber?: number; // Add prop for display numbering
  existingPayment?: OrderPayment; // Add prop for existing payment
}

export function InlinePaymentForm({
  onAddPayment,
  onRemoveForm,
  formIndex,
  displayNumber,
  existingPayment,
}: InlinePaymentFormProps) {
  // Try to load saved form data from localStorage or use existing payment
  const loadSavedFormData = () => {
    // If we have an existing payment, use that as the default values
    if (existingPayment) {
      return {
        amount: existingPayment.amount || 0,
        payment_date: existingPayment.payment_date || new Date().toISOString().split('T')[0],
        payment_method: existingPayment.payment_method || 'cash',
      };
    }

    // Otherwise try to load from localStorage
    try {
      const savedData = localStorage.getItem(`payment-form-${formIndex}`);
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error('Error loading saved payment form data:', error);
    }

    // Default values if nothing is found
    return {
      amount: 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
    };
  };

  const form = useForm<OrderPaymentFormValues>({
    mode: 'onChange',
    resolver: zodResolver(orderPaymentSchema),
    defaultValues: {
      ...loadSavedFormData(),
      // Always ensure payment_date has a default value
      payment_date: loadSavedFormData().payment_date || new Date().toISOString().split('T')[0]
    },
  });


  // Use existing payment ID if available, otherwise track a new one
  const [savedPaymentId, setSavedPaymentId] = useState<string | null>(existingPayment?.id || null);
  const amount = form.watch('amount');
  const paymentDate = form.watch('payment_date');
  const paymentMethod = form.watch('payment_method');

  // Ref to track if we have valid data to prevent duplicate saves
  const hasValidData = useRef(false);

  // Create a save function
  const savePayment = useCallback((formData: OrderPaymentFormValues) => {
    // Ensure amount is a number
    const amount = typeof formData.amount === 'number' ? formData.amount : parseFloat(formData.amount as any) || 0;

    // Ensure payment_date is set - this is critical for database compatibility
    const payment_date = formData.payment_date || new Date().toISOString().split('T')[0];

    // Create a new formData object with the validated payment_date
    const validatedFormData = {
      ...formData,
      payment_date: payment_date,
      amount: amount
    };

    // Log validation status
    console.log('Payment validation:', {
      amount: amount > 0,
      payment_date: !!payment_date,
      payment_method: !!formData.payment_method
    });

    // Only save if we have the minimum required fields
    if (
      amount > 0 &&
      payment_date &&
      formData.payment_method
    ) {
      const paymentId = savedPaymentId || `payment-${Date.now()}-${formIndex}`;

      // Create payment object with the correct field mapping
      const newPayment: OrderPayment = {
        id: paymentId,
        amount: amount,
        payment_date: payment_date,
        payment_method: formData.payment_method as PaymentMethod,
        order_id: existingPayment?.order_id || '',
        created_at: existingPayment?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Call the parent component's onAddPayment function
      onAddPayment(newPayment);

      // Update the saved payment ID
      setSavedPaymentId(paymentId);

      // Update the valid data flag
      hasValidData.current = true;

      return true;
    }

    return false;
  }, [formIndex, onAddPayment, savedPaymentId, existingPayment]);

  // Create a debounced version of the save function
  const debouncedSave = useDebouncedCallback(savePayment, 500);

  // Manual save handler
  const handleManualSave = useCallback(() => {
    const formData = form.getValues();

    // Always store in localStorage to preserve data between section collapses
    localStorage.setItem(`payment-form-${formIndex}`, JSON.stringify(formData));

    // Auto-save the payment when all required fields are filled
    const hasRequiredFields =
      formData.amount &&
      formData.amount > 0 &&
      formData.payment_date &&
      formData.payment_method;

    if (hasRequiredFields) {
      // For new payments (no saved ID yet), only save once when all data is valid
      // and only when the amount is substantial
      if (!hasValidData.current && !savedPaymentId && formData.amount >= 100) {
        console.log('Auto-saving new payment with valid data:', formData);
        debouncedSave(formData);
        hasValidData.current = true;
      }
      // For existing payments, only save if there are actual changes
      else if (existingPayment && (
        existingPayment.amount !== formData.amount ||
        existingPayment.payment_date !== formData.payment_date ||
        existingPayment.payment_method !== formData.payment_method
      )) {
        console.log('Auto-saving updated payment with valid data:', formData);
        debouncedSave(formData);
      }
    }
  }, [form, formIndex, existingPayment, debouncedSave, savedPaymentId]);

  // We're using the handleManualSave function defined above with useCallback

  // Handle removing this form
  const handleRemoveForm = () => {
    onRemoveForm(formIndex);
  };

  const paymentMethods: { value: PaymentMethod; label: string }[] = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'mobile_payment', label: 'Mobile Payment' },
  ];

  // Auto-save form data when values change
  useEffect(() => {
    // Only save if we have valid data
    const dependencies = [amount, paymentDate, paymentMethod, form, formIndex, existingPayment, debouncedSave, savedPaymentId];
    const hasValidData = amount > 0 && paymentDate && paymentMethod;
    if (hasValidData) {
      console.log('Auto-saving payment form data...');
      debouncedSave({
        amount,
        payment_date: paymentDate,
        payment_method: paymentMethod
      });
    }
  }, [amount, paymentDate, paymentMethod, form, formIndex, existingPayment, debouncedSave, savedPaymentId]);

  return (
    <div className="bg-[hsl(var(--card))]/30 border border-[hsl(var(--border))]/50 rounded-md p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-medium">Payment #{displayNumber || formIndex + 1}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemoveForm}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value || ''}
                      className={`${form.formState.errors.amount ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      onChange={e => {
                        // Always convert to a number, default to 0 if empty
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        console.log('Payment amount changed to:', value);
                        field.onChange(value);
                      }}
                      min={0.01}
                      step={0.01}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">Payment Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      className={`${form.formState.errors.payment_date ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      value={field.value || new Date().toISOString().split('T')[0]}
                      onFocus={(e) => {
                        // If empty, set to today's date when focused
                        if (!field.value) {
                          field.onChange(new Date().toISOString().split('T')[0]);
                        }
                      }}
                      onChange={(e) => {
                        // Ensure we never have an empty date
                        const value = e.target.value || new Date().toISOString().split('T')[0];
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">Payment Method</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className={`${form.formState.errors.payment_method ? 'border-red-500 focus-visible:ring-red-500' : ''}`}>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          <div className="mt-6 p-4 bg-muted/20 rounded-md border border-border/30">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">Amount:</span>
                <span className="text-lg font-semibold">
                  {formatCurrency(form.watch('amount') || 0)}
                </span>
              </div>
              <Button
                type="button"
                onClick={handleManualSave}
                variant="default"
                size="sm"
                className="bg-primary text-white hover:bg-primary/90"
              >
                Save Payment
              </Button>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}
