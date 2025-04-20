import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Order, OrderItem } from '@/types/orders';
import { formatCurrency } from '@/utils/formatting.utils';
import { Plus, Trash2 } from 'lucide-react';
import { DeletionType } from '@/components/ui/approval-dialog';
import { useOrderItems } from '@/hooks/orders/useOrderItems';
import { ComboboxOption } from '@/components/ui/combobox';
import { InlineItemForm } from '@/components/orders/forms/InlineItemForm';

interface OrderItemsFormProps {
  active: boolean;
  order: Partial<Order>;
  updateOrderFields: (fields: Partial<Order>) => void;
  openDeleteDialog: (id: string, index: number, name: string, type: DeletionType) => void;
  recalculateOrder: () => void;
  categories?: ComboboxOption[];
  items?: (ComboboxOption & { categoryId?: string })[];
  errors?: Record<string, string[]>;
  // New props for form state management
  formState?: number[];
  partialData?: Record<number, any>;
  onAddForm?: () => void;
  onRemoveForm?: (index: number) => void;
  onUpdatePartialData?: (index: number, data: any) => void;
}

/**
 * Component for the items tab of the order form
 */
const OrderItemsForm: React.FC<OrderItemsFormProps> = ({
  active,
  order,
  updateOrderFields,
  openDeleteDialog,
  recalculateOrder,
  categories = [],
  items: itemOptions = [],
  errors = {},
  // New props with defaults
  formState = [0],
  partialData = {},
  onAddForm,
  onRemoveForm,
  onUpdatePartialData,
}) => {
  // Use provided form state or local state as fallback
  const [localItemForms, setLocalItemForms] = useState([0]); // Local fallback
  const [localFormIdCounter, setLocalFormIdCounter] = useState(1); // Local fallback

  // Use either provided form state or local state
  // No need for useEffect to sync - just use the prop directly
  const itemForms = formState || localItemForms;
  // Debug order items
  console.log('OrderItemsForm received order:', order);
  console.log('OrderItemsForm received order.items:', order.items);

  // Use our custom hook for items management
  const { items } = useOrderItems({
    items: order.items || [],
    onItemsChange: (newItems) => {
      updateOrderFields({ items: newItems });
      recalculateOrder();
    }
  });

  // Debug items after hook initialization
  console.log('OrderItemsForm items after hook initialization:', items);

  // Add another item form
  const handleAddItem = () => {
    if (onAddForm) {
      onAddForm();
    } else {
      // Fallback to local state
      setLocalItemForms([...localItemForms, localFormIdCounter]);
      setLocalFormIdCounter(localFormIdCounter + 1);
    }
  };

  // Remove a form
  const handleRemoveForm = (index: number) => {
    if (onRemoveForm) {
      onRemoveForm(index);
    } else {
      // Fallback to local state
      setLocalItemForms(localItemForms.filter(formId => formId !== index));
    }
  };

  // Handle adding a new item from the form
  const handleAddItemFromForm = (newItem: OrderItem) => {
    const existingItemIndex = items.findIndex(item => item.id === newItem.id);

    let newItems;
    if (existingItemIndex >= 0) {
      // Update existing item
      newItems = [...items];
      newItems[existingItemIndex] = newItem;
    } else {
      // Add new item
      newItems = [...items, newItem];
    }

    updateOrderFields({ items: newItems });
    recalculateOrder();

    // The form will be removed automatically by the InlineItemForm component
    // after saving to prevent duplication
  };

  return (
    <div>
      <div className="mb-5 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">
          Order Items {items.length > 0 && <span className="text-sm text-muted-foreground ml-2">({items.length} added)</span>}
        </h3>
        <Button
          variant="outline"
          size="sm"
          className="border-primary/70 text-primary hover:bg-primary/10"
          onClick={handleAddItem}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Another Item
        </Button>
      </div>

      {/* We're not displaying items as cards anymore - they remain as editable forms */}

      {/* Only show forms for new items (not already in the items array) */}
      {itemForms.map((formIndex) => {
        // Skip forms that correspond to existing items to prevent duplication
        if (formIndex < items.length) {
          return null;
        }

        return (
          <InlineItemForm
            key={formIndex}
            onAddItem={handleAddItemFromForm}
            onRemoveForm={handleRemoveForm}
            categories={categories}
            items={itemOptions}
            formIndex={formIndex}
            isOpen={active}
            initialData={partialData[formIndex]}
            onUpdatePartialData={onUpdatePartialData ?
              (data) => onUpdatePartialData(formIndex, data) :
              undefined}
          />
        );
      })}

      {/* Display existing items as editable forms */}
      {items.map((item, index) => (
        <InlineItemForm
          key={`existing-${item.id || index}`}
          onAddItem={handleAddItemFromForm}
          onRemoveForm={() => {
            // When removing an existing item, we need to update the order
            const newItems = [...items];
            newItems.splice(index, 1);
            updateOrderFields({ items: newItems });
            recalculateOrder();
          }}
          categories={categories}
          items={itemOptions}
          formIndex={index}
          isOpen={active}
          initialData={item}
          onUpdatePartialData={onUpdatePartialData ?
            (data) => onUpdatePartialData(index, data) :
            undefined}
        />
      ))}

      {itemForms.length === 0 && items.length === 0 && (
        <div className="text-center py-8 bg-card/30 rounded-md border border-border/50 shadow-sm">
          <p className="text-muted-foreground">No items added to this order yet</p>
          <p className="text-muted-foreground/70 text-sm mt-1">Click "Add Another Item" to add items</p>
        </div>
      )}
    </div>
  );
};

export default OrderItemsForm;