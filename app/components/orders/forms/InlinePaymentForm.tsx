"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { OrderPaymentFormValues, orderPaymentSchema } from '@/schemas/order-schema';
import { OrderPayment, PaymentMethod } from '@/types/orders';
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
}

export function InlinePaymentForm({
  onAddPayment,
  onRemoveForm,
  formIndex,
}: InlinePaymentFormProps) {
  const form = useForm<OrderPaymentFormValues>({
    mode: 'onChange',
    resolver: zodResolver(orderPaymentSchema),
    defaultValues: {
      amount: 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
    },
  });


  const [savedPaymentId, setSavedPaymentId] = useState<string | null>(null);
  const amount = form.watch('amount');
  const paymentDate = form.watch('payment_date');
  const paymentMethod = form.watch('payment_method');


  // Create a save function
  const savePayment = useCallback((formData: OrderPaymentFormValues) => {
    // Only save if we have the minimum required fields
    if (
      formData.amount &&
      formData.amount > 0 &&
      formData.payment_date &&
      formData.payment_method
    ) {
      const paymentId = savedPaymentId || `payment-${Date.now()}-${formIndex}`;

      const newPayment: OrderPayment = {
        id: paymentId,
        order_id: '',
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // If we haven't saved a payment yet, store the ID
      if (!savedPaymentId) {
        setSavedPaymentId(paymentId);
      }

      onAddPayment(newPayment);
    }
  }, [onAddPayment, savedPaymentId, formIndex, setSavedPaymentId]);

  const debouncedSave = useDebouncedCallback(savePayment, 800); // 800ms debounce time

  // Watch for form changes and trigger the debounced save
  useEffect(() => {
    if (amount || paymentDate || paymentMethod) {
      const formData = form.getValues();
      debouncedSave(formData);
    }
  }, [amount, paymentDate, paymentMethod, form, debouncedSave]);

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

  return (
    <div className="bg-card/30 border border-border/50 rounded-md p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-medium">Payment #{formIndex + 1}</h3>
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
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      min={0.01}
                      step={0.01}
                    />
                  </FormControl>
                  <FormMessage />
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
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
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
                    <SelectTrigger>
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
                <FormMessage />
              </FormItem>
            )}
          />



        </div>
      </Form>
    </div>
  );
}
