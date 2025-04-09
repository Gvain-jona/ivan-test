"use client"

import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { SmartCombobox, SmartComboboxOption } from '@/components/ui/smart-combobox';
import { useSmartDropdown } from '@/hooks/useSmartDropdown';
import { useSmartSizes } from '@/hooks/useSmartSizes';
import { OrderItemFormValues, orderItemSchema } from '@/schemas/order-schema';
import { OrderItem } from '@/types/orders';
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

interface InlineItemFormProps {
  onAddItem: (item: OrderItem) => void;
  onRemoveForm: (index: number) => void;
  categories?: ComboboxOption[];
  items?: (ComboboxOption & { categoryId?: string })[];
  formIndex: number;
  sizes?: ComboboxOption[];
  isOpen?: boolean;
}

export function InlineItemForm({
  onAddItem,
  onRemoveForm,
  categories = [],
  items = [],
  formIndex,
  sizes = [], // We'll use the useSmartSizes hook instead
  isOpen = true,
}: InlineItemFormProps) {
  const form = useForm<OrderItemFormValues>({
    resolver: zodResolver(orderItemSchema),
    defaultValues: {
      category_id: '',
      category_name: '',
      item_id: '',
      item_name: '',
      size: '',
      quantity: 1,
      unit_price: 0,
    },
  });

  const [savedItemId, setSavedItemId] = useState<string | null>(null);
  const selectedCategoryId = form.watch('category_id');
  const quantity = form.watch('quantity');
  const unitPrice = form.watch('unit_price');
  const categoryName = form.watch('category_name');
  const itemName = form.watch('item_name');

  // Use our smart dropdown hooks
  const {
    options: categoryOptions,
    isLoading: categoriesLoading,
    setSearchQuery: setCategorySearch,
    createOption: createCategory,
    refreshOptions: refreshCategories
  } = useSmartDropdown({
    entityType: 'categories',
    initialOptions: categories.map(c => ({ value: c.value, label: c.label })),
  });

  const {
    options: itemOptions,
    isLoading: itemsLoading,
    setSearchQuery: setItemSearch,
    createOption: createItem,
    refreshOptions: refreshItems
  } = useSmartDropdown({
    entityType: 'items',
    parentId: selectedCategoryId,
    initialOptions: items.filter(item => !selectedCategoryId || item.categoryId === selectedCategoryId)
      .map(i => ({ value: i.value, label: i.label, categoryId: i.categoryId })),
  });

  // Use our smart sizes hook
  const {
    sizes: sizeOptions,
    recentSizes,
    isLoading: sizesLoading,
    createSize,
    refreshSizes
  } = useSmartSizes();

  // Update category name when category is selected
  useEffect(() => {
    if (selectedCategoryId) {
      const category = categoryOptions.find(c => c.value === selectedCategoryId);
      if (category) {
        form.setValue('category_name', category.label);
      }
    }
  }, [selectedCategoryId, categoryOptions, form]);

  // Update item name when item is selected
  const handleItemChange = (value: string) => {
    form.setValue('item_id', value);
    const selectedItem = itemOptions.find(item => item.value === value);
    if (selectedItem) {
      form.setValue('item_name', selectedItem.label);
    }
  };

  // Handle creating a new category
  const handleCreateCategory = async (value: string) => {
    const newCategory = await createCategory(value);
    if (newCategory) {
      form.setValue('category_id', newCategory.value);
      form.setValue('category_name', newCategory.label);
      return newCategory;
    }
    return null;
  };

  // Handle creating a new item
  const handleCreateItem = async (value: string) => {
    if (!selectedCategoryId) {
      return null;
    }
    const newItem = await createItem(value);
    if (newItem) {
      form.setValue('item_id', newItem.value);
      form.setValue('item_name', newItem.label);
      return newItem;
    }
    return null;
  };

  // Calculate total amount when quantity or unit price changes
  useEffect(() => {
    if (quantity && unitPrice) {
      form.setValue('total_amount', quantity * unitPrice);
    }
  }, [quantity, unitPrice, form]);

  // Create a debounced save function
  const saveItem = useCallback((formData: OrderItemFormValues) => {
    // Only save if we have the minimum required fields
    if (
      formData.category_name &&
      formData.item_name &&
      formData.quantity &&
      formData.quantity > 0 &&
      formData.unit_price !== undefined &&
      formData.unit_price >= 0 &&
      formData.size // Size is now required
    ) {
      const itemId = savedItemId || `item-${Date.now()}-${formIndex}`;

      const newItem: OrderItem = {
        id: itemId,
        order_id: '',
        ...formData,
        total_amount: formData.quantity * formData.unit_price,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // If we haven't saved an item yet, store the ID
      if (!savedItemId) {
        setSavedItemId(itemId);
      }

      onAddItem(newItem);
    }
  }, [onAddItem, savedItemId, formIndex, setSavedItemId]);

  const debouncedSave = useDebouncedCallback(saveItem, 800); // 800ms debounce time

  // Watch for form changes and trigger the debounced save
  useEffect(() => {
    if (categoryName || itemName || quantity || unitPrice || form.watch('size')) {
      const formData = form.getValues();
      debouncedSave(formData);
    }
  }, [categoryName, itemName, quantity, unitPrice, form, debouncedSave]);

  // Refresh data when the form is opened
  useEffect(() => {
    if (isOpen) {
      refreshCategories();
      refreshSizes();
      if (selectedCategoryId) {
        refreshItems();
      }
    }
  }, [isOpen, refreshCategories, refreshItems, refreshSizes, selectedCategoryId]);

  // Handle removing this form
  const handleRemoveForm = () => {
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
              name="category_id"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">Category</FormLabel>
                  <FormControl>
                    <SmartCombobox
                      options={categoryOptions}
                      value={field.value}
                      onChange={field.onChange}
                      onSearch={setCategorySearch}
                      isLoading={categoriesLoading}
                      placeholder="Select or search category"
                      allowCreate={true}
                      onCreateOption={handleCreateCategory}
                      entityName="Category"
                      emptyMessage="No categories found. Create one?"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="item_id"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">Item</FormLabel>
                  <FormControl>
                    <SmartCombobox
                      options={itemOptions}
                      value={field.value}
                      onChange={handleItemChange}
                      onSearch={setItemSearch}
                      isLoading={itemsLoading}
                      placeholder={selectedCategoryId ? "Select or search item" : "Select a category first"}
                      disabled={!selectedCategoryId}
                      allowCreate={selectedCategoryId ? true : false}
                      onCreateOption={handleCreateItem}
                      entityName="Item"
                      emptyMessage={selectedCategoryId ? "No items found. Create one?" : "Select a category first"}
                    />
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
                    <SmartCombobox
                      options={sizeOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select size"
                      allowCreate={true}
                      onCreateOption={async (value) => {
                        const newSize = await createSize(value);
                        if (newSize) {
                          form.setValue('size', newSize.value);
                          return newSize;
                        }
                        return null;
                      }}
                      entityName="Size"
                      emptyMessage="Select a size or create a custom one"
                      recentOptions={recentSizes}
                      isLoading={sizesLoading}
                    />
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
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}
