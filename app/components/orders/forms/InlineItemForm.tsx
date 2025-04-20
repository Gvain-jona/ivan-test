"use client"

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlobalSmartCombobox } from '@/components/ui/global-smart-combobox';
import { OrderItemFormValues, orderItemSchema } from '@/schemas/order-schema';
import { OrderItem } from '@/types/orders';
import { formatCurrency } from '@/utils/formatting.utils';
import { X } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface InlineItemFormProps {
  onAddItem: (item: OrderItem) => void;
  onRemoveForm: (index: number) => void;
  categories?: ComboboxOption[];
  items?: (ComboboxOption & { categoryId?: string })[];
  formIndex: number;
  sizes?: ComboboxOption[];
  isOpen?: boolean;
  // New props for form state persistence
  initialData?: Partial<OrderItemFormValues>;
  onUpdatePartialData?: (data: Partial<OrderItemFormValues>) => void;
}

export function InlineItemForm({
  onAddItem,
  onRemoveForm,
  categories = [],
  items = [],
  formIndex,
  sizes = [], // We'll use the useSmartSizes hook instead
  isOpen = true,
  initialData,
  onUpdatePartialData,
}: InlineItemFormProps) {
  // Load initial data from props or use defaults
  const getInitialValues = () => {
    // Use initialData if provided
    if (initialData) {
      return {
        category_id: initialData.category_id || '',
        category_name: initialData.category_name || '',
        // Store original values to detect changes
        category_name_original: initialData.category_name || '',
        item_id: initialData.item_id || '',
        item_name: initialData.item_name || '',
        // Store original values to detect changes
        item_name_original: initialData.item_name || '',
        size: initialData.size || '',
        quantity: initialData.quantity || 1,
        unit_price: initialData.unit_price || 0,
      };
    }

    // Default values
    return {
      category_id: '',
      category_name: '',
      category_name_original: '',
      item_id: '',
      item_name: '',
      item_name_original: '',
      size: '',
      quantity: 1,
      unit_price: 0,
    };
  };

  const form = useForm<OrderItemFormValues>({
    resolver: zodResolver(orderItemSchema),
    defaultValues: getInitialValues(),
  });

  // Generate a unique ID for this item if it doesn't have one yet
  const [itemId] = useState(() => initialData?.id || `item-${Date.now()}-${formIndex}`);

  // Refs to track form state and prevent issues
  const hasValidData = useRef(false);
  const isAutoSaving = useRef(false);
  const lastAutoSaveAttempt = useRef<number>(0);

  // Watch form values
  const quantity = form.watch('quantity');
  const unitPrice = form.watch('unit_price');

  // Calculate total amount when quantity or unit price changes
  useEffect(() => {
    if (quantity && unitPrice) {
      form.setValue('total_amount', quantity * unitPrice);
    }
  }, [quantity, unitPrice, form]);



  // Watch all form values to persist partial data when switching tabs
  const formValues = form.watch();

  // Function to check if all required fields are filled
  const checkFormCompleteness = useCallback(() => {
    const formData = form.getValues();
    return (
      formData.category_name &&
      formData.item_name &&
      formData.quantity &&
      formData.quantity > 0 &&
      formData.unit_price !== undefined &&
      formData.unit_price >= 0 &&
      formData.size
    );
  }, [form]);

  // Function to save the item - optimized to use UUIDs
  const saveItem = useCallback((formData: OrderItemFormValues) => {
    // Only create/update the item if we have valid data
    if (checkFormCompleteness()) {
      // Ensure we have the item name and category name
      // These are now the primary data, not the IDs
      const itemName = formData.item_name;
      const categoryName = formData.category_name;

      // Generate UUIDs for item_id and category_id if not provided
      // or if we have a name but no ID (which means it's a new item/category)
      const itemId =
        (formData.item_id && formData.item_name === formData.item_name_original)
          ? formData.item_id
          : crypto.randomUUID();

      const categoryId =
        (formData.category_id && formData.category_name === formData.category_name_original)
          ? formData.category_id
          : crypto.randomUUID();

      const newItem: OrderItem = {
        id: itemId,
        order_id: '',
        item_id: itemId,
        category_id: categoryId,
        item_name: itemName,
        category_name: categoryName,
        size: formData.size || 'Default',
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        total_amount: formData.quantity * formData.unit_price,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Send the item to the parent component
      onAddItem(newItem);
      hasValidData.current = true;

      // Keep the form for editing until final submission
      // This allows users to review and modify their entries

      return true;
    }
    return false;
  }, [itemId, onAddItem, checkFormCompleteness, onRemoveForm, formIndex]);

  // Auto-save handler
  const handleAutoSave = useCallback(() => {
    // Don't auto-save if we're already in the process of saving
    if (isAutoSaving.current) return;

    // Throttle auto-save attempts (no more than once every 2 seconds)
    const now = Date.now();
    if (now - lastAutoSaveAttempt.current < 2000) return;
    lastAutoSaveAttempt.current = now;

    const formData = form.getValues();

    // Only auto-save if all required fields are filled
    if (checkFormCompleteness()) {
      // Set flag to prevent duplicate auto-saves
      isAutoSaving.current = true;
      console.log('Auto-saving item with valid data:', formData);
      saveItem(formData);

      // Reset auto-save flag after a delay
      setTimeout(() => {
        isAutoSaving.current = false;
      }, 1000);
    }
  }, [form, saveItem, checkFormCompleteness]);

  // Update partial data whenever form values change
  useEffect(() => {
    if (onUpdatePartialData) {
      // Save current form state to parent component regardless of isOpen
      // This ensures data is always persisted even when tab is not active
      onUpdatePartialData(formValues);
    }
  }, [formValues, onUpdatePartialData]);

  // When the form becomes visible again, ensure we have the latest data
  useEffect(() => {
    if (isOpen && initialData) {
      // Update form with any saved data when tab becomes active
      Object.entries(initialData).forEach(([key, value]) => {
        if (value !== undefined) {
          form.setValue(key as any, value);
        }
      });
    }
  }, [isOpen, initialData, form]);

  // Watch form values for auto-save
  useEffect(() => {
    // Only attempt auto-save if the form is open/visible
    if (isOpen && checkFormCompleteness()) {
      // Debounce the auto-save to prevent too many saves while typing
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 1500); // Wait 1.5 seconds after last change before auto-saving

      return () => clearTimeout(timer);
    }
  }, [formValues, isOpen, handleAutoSave, checkFormCompleteness]);

  // Manual save handler - called when Save button is clicked
  const handleManualSave = useCallback(() => {
    const formData = form.getValues();
    saveItem(formData);
  }, [form, saveItem]);

  // Add a button to manually save the item
  const saveButton = (
    <Button
      type="button"
      variant="default"
      size="sm"
      className="bg-primary hover:bg-primary/90"
      onClick={handleManualSave}
    >
      Save Item
    </Button>
  );

  // Handle removing this form
  const handleRemoveForm = () => {
    // Clear form errors when removing
    form.clearErrors();
    onRemoveForm(formIndex);
  };

  return (
    <div className="bg-card/30 border border-border/50 rounded-md p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-medium">Item #{formIndex + 1}</h3>
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
              name="category_name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">Category</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter category name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="item_name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">Item</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter item name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">Size</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter size" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      min={1}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit_price"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">Unit Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      min={0}
                      step={0.01}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


          </div>

          <div className="mt-6 p-4 bg-muted/20 rounded-md border border-border/30">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">Total Cost:</span>
                <span className="text-lg font-semibold">
                  {formatCurrency(form.watch('quantity') * form.watch('unit_price') || 0)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {checkFormCompleteness() && (
                  <span className="text-xs text-muted-foreground italic">
                    Auto-saving enabled
                  </span>
                )}
                {saveButton}
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}
