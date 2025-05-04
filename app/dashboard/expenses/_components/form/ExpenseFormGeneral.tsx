import React from 'react';
import { format } from 'date-fns';
import { Control } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import { ClipboardList } from 'lucide-react';
import { CATEGORIES } from './schema';

interface ExpenseFormGeneralProps {
  control: Control<any>;
}

/**
 * General information section of the expense form
 * Memoized to prevent unnecessary re-renders
 */
export function ExpenseFormGeneral({ control }: ExpenseFormGeneralProps) {
  // Check if we're in dark mode - we'll use this for theming
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const isDarkMode = typeof document !== 'undefined'
    ? document.documentElement.classList.contains('dark')
    : prefersDarkMode;

  return (
    <div className="space-y-6">
      <div className={cn(
        "flex items-center gap-2 p-3 rounded-lg",
        isDarkMode ? "bg-white/5 border border-white/10" : "bg-background/5 border border-background/10"
      )}>
        <ClipboardList className={cn(
          "h-5 w-5",
          isDarkMode ? "text-white" : "text-background"
        )} />
        <h3 className="text-base font-medium">General Information</h3>
      </div>

      {/* Category and Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <FormField
            control={control}
            name="category"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-medium">Category</FormLabel>
                <Select
                  onValueChange={(value) => {
                    if (value === 'fixed' || value === 'variable') {
                      field.onChange(value);
                    }
                  }}
                  value={field.value}
                  defaultValue="variable"
                >
                  <FormControl>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormField
            control={control}
            name="date"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-medium">Date</FormLabel>
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

      {/* Item Name and Responsible Person */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <FormField
            control={control}
            name="item_name"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-medium">Item Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter item name"
                    className="h-10"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormField
            control={control}
            name="responsible"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-medium">Responsible Person (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter name"
                    className="h-10"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Quantity, Unit Cost, and VAT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <FormField
            control={control}
            name="quantity"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-medium">Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="1"
                    className="h-10"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      // Auto-calculate total amount is handled in the parent component
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormField
            control={control}
            name="unit_cost"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-medium">Unit Cost</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="h-10"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      // Auto-calculate total amount is handled in the parent component
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormField
            control={control}
            name="vat"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-medium">VAT (Optional)</FormLabel>
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
        </div>
      </div>

      {/* Total Amount */}
      <FormField
        control={control}
        name="total_amount"
        render={({ field }) => (
          <FormItem>
            <Card className="border border-border/50 bg-muted/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="font-medium text-base">Total Amount</FormLabel>
                  <div className="text-xl font-bold">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'UGX',
                      minimumFractionDigits: 0,
                    }).format(field.value || 0)}
                  </div>
                </div>
                <FormDescription className="text-xs mt-1">
                  Auto-calculated from quantity × unit cost
                </FormDescription>
              </CardContent>
            </Card>
            <FormControl>
              <Input
                type="number"
                className="hidden"
                {...field}
                readOnly
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
