import React from 'react';
import { Control } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';

interface ExpenseFormTogglesProps {
  control: Control<any>;
}

/**
 * Toggle switches for payments and notes sections
 * Memoized to prevent unnecessary re-renders
 */
export function ExpenseFormToggles({ control }: ExpenseFormTogglesProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Additional Sections</h3>
      
      {/* Installment Payments Toggle */}
      <FormField
        control={control}
        name="has_installments"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
            <div className="space-y-1">
              <FormLabel className="font-medium">Installment Payments</FormLabel>
              <FormDescription className="text-xs">
                Enable to add multiple payments for this expense
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      {/* Notes Toggle */}
      <FormField
        control={control}
        name="has_notes"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
            <div className="space-y-1">
              <FormLabel className="font-medium">Notes</FormLabel>
              <FormDescription className="text-xs">
                Enable to add notes to this expense
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
