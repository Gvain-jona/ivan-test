import React, { useState } from 'react';
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
}) => {
  const [itemForms, setItemForms] = useState([0]); // Start with one form
  const [formIdCounter, setFormIdCounter] = useState(1); // Counter for generating unique form IDs
  // Use our custom hook for items management
  const { items } = useOrderItems({
    items: order.items || [],
    onItemsChange: (newItems) => {
      updateOrderFields({ items: newItems });
      recalculateOrder();
    }
  });

  // Add another item form
  const handleAddItem = () => {
    setItemForms([...itemForms, formIdCounter]);
    setFormIdCounter(formIdCounter + 1);
  };

  // Remove a form
  const handleRemoveForm = (index: number) => {
    setItemForms(itemForms.filter(formId => formId !== index));
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

      {itemForms.map((formIndex) => (
        <InlineItemForm
          key={formIndex}
          onAddItem={handleAddItemFromForm}
          onRemoveForm={handleRemoveForm}
          categories={categories}
          items={itemOptions}
          formIndex={formIndex}
          isOpen={active}
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