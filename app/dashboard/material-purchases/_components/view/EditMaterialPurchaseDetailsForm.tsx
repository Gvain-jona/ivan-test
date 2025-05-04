'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Save, Package, DollarSign, User } from 'lucide-react';
import { MaterialPurchase } from '@/types/materials';
import { useMaterialPurchaseView } from './context/MaterialPurchaseViewContext';
import { BottomOverlayForm } from './BottomOverlayForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency, formatDate } from '@/lib/utils';

// Form schema
const formSchema = z.object({
  material_name: z.string().min(1, 'Material name is required'),
  supplier_name: z.string().optional(),
  quantity: z.coerce.number().min(0.01, 'Quantity must be greater than 0'),
  unit: z.string().optional(),
  unit_price: z.coerce.number().min(0, 'Unit price must be non-negative'),
  total_amount: z.coerce.number().min(0, 'Total amount must be non-negative'),
});

type FormValues = z.infer<typeof formSchema>;

interface EditMaterialPurchaseDetailsFormProps {
  purchase: MaterialPurchase;
  onClose: () => void;
}

/**
 * Form for editing material purchase details
 * Matches the styling used in expense view
 */
export function EditMaterialPurchaseDetailsForm({ purchase, onClose }: EditMaterialPurchaseDetailsFormProps) {
  const { onEdit, refreshPurchase } = useMaterialPurchaseView();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize form with purchase data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      material_name: purchase.material_name || '',
      supplier_name: purchase.supplier_name || '',
      quantity: purchase.quantity || 0,
      unit: purchase.unit || '',
      unit_price: purchase.unit_price || 0,
      total_amount: purchase.total_amount || 0,
    },
  });

  // Watch quantity and unit_price to calculate total_amount
  const quantity = form.watch('quantity');
  const unitPrice = form.watch('unit_price');
  const totalAmount = form.watch('total_amount');

  // Update total amount when quantity or unit price changes
  React.useEffect(() => {
    const calculatedTotal = quantity * unitPrice;
    form.setValue('total_amount', calculatedTotal);
  }, [quantity, unitPrice, form]);

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      setFormError(null);

      // Create updated purchase object
      const updatedPurchase = {
        ...purchase,
        material_name: data.material_name,
        supplier_name: data.supplier_name,
        quantity: data.quantity,
        unit: data.unit,
        unit_price: data.unit_price,
        total_amount: data.total_amount,
      };

      // Call the onEdit function from context
      await onEdit(updatedPurchase);

      // Refresh the purchase data
      await refreshPurchase();

      // Close the form
      onClose();
    } catch (error) {
      console.error('Error updating material purchase:', error);
      setFormError(error instanceof Error ? error.message : 'An error occurred while updating the purchase details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomOverlayForm title="Edit Purchase Details" onClose={onClose}>
      <div className="mb-6">
        <div className="bg-muted/50 rounded-lg p-4 mb-4 border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Purchase Details</p>
                <p className="text-xs text-muted-foreground">Date: {formatDate(purchase.date || '')}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current Total</p>
              <p className="font-medium text-primary">{formatCurrency(purchase.total_amount || 0)}</p>
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="material_name"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Material Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Package className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input {...field} className="pl-9" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supplier_name"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Supplier Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input {...field} className="pl-9" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.01" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="unit_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Price (UGX)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input {...field} type="number" step="0.01" className="pl-9" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="total_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Amount (UGX)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        readOnly
                        className="bg-muted pl-9 font-medium"
                      />
                    </div>
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
