import React from 'react';
import { format } from 'date-fns';
import { Control, UseFieldArrayReturn } from 'react-hook-form';
import { PlusCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PAYMENT_METHODS } from './schema';

interface ExpenseFormPaymentsProps {
  control: Control<any>;
  paymentFields: UseFieldArrayReturn['fields'];
  appendPayment: UseFieldArrayReturn['append'];
  removePayment: UseFieldArrayReturn['remove'];
}

/**
 * Payments section of the expense form
 * Memoized to prevent unnecessary re-renders
 */
export function ExpenseFormPayments({
  control,
  paymentFields,
  appendPayment,
  removePayment
}: ExpenseFormPaymentsProps) {
  // Add payment handler
  const handleAddPayment = () => {
    appendPayment({ amount: '', date: new Date(), payment_method: 'cash' });
  };
  return (
    <div className="space-y-4 border-t pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Payments</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddPayment}
          className="h-9"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Payment
        </Button>
      </div>

      <div className="space-y-6">
        {paymentFields.length > 0 ? (
          <div className="space-y-6">
            {paymentFields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 bg-muted/5 shadow-sm relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 absolute top-2 right-2"
                  onClick={() => removePayment(index)}
                >
                  <X className="h-4 w-4" />
                </Button>

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={control}
                    name={`payments.${index}.amount`}
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={control}
                      name={`payments.${index}.payment_method`}
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="font-medium">Payment Method</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select method" />
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

                    <FormField
                      control={control}
                      name={`payments.${index}.date`}
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="font-medium">Payment Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              className="h-10"
                              value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                              onChange={(e) => {
                                const date = e.target.value ? new Date(e.target.value) : null;
                                field.onChange(date);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center p-6 border rounded-md bg-muted/10">
            <p className="text-sm text-muted-foreground">No payments added yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
