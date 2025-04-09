import { useCallback } from 'react';
import { OrderItem } from '@/types/orders';
import { validateOrderItem } from '@/utils/orders/order-form.utils';

interface UseOrderItemsProps {
  items: OrderItem[];
  onItemsChange: (items: OrderItem[]) => void;
}

interface UseOrderItemsReturn {
  items: OrderItem[];
  addItem: (item: Partial<OrderItem>) => void;
  updateItem: (index: number, item: Partial<OrderItem>) => void;
  removeItem: (index: number) => void;
  updateItemField: (index: number, field: keyof OrderItem, value: any) => void;
  calculateItemTotal: (item: Partial<OrderItem>) => number;
  getTotalAmount: () => number;
}

/**
 * Custom hook for managing order items
 */
export const useOrderItems = ({
  items,
  onItemsChange,
}: UseOrderItemsProps): UseOrderItemsReturn => {
  // Calculate the total amount for a single item
  const calculateItemTotal = useCallback((item: Partial<OrderItem>): number => {
    if (!item.quantity || !item.unit_price) return 0;
    return item.quantity * item.unit_price;
  }, []);

  // Add a new item to the list
  const addItem = useCallback(
    (item: Partial<OrderItem>) => {
      if (!validateOrderItem(item)) return;

      const newItem = {
        ...item,
        total_amount: calculateItemTotal(item),
      } as OrderItem;

      onItemsChange([...items, newItem]);
    },
    [items, onItemsChange, calculateItemTotal]
  );

  // Update an existing item in the list
  const updateItem = useCallback(
    (index: number, updatedItem: Partial<OrderItem>) => {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        ...updatedItem,
        total_amount: calculateItemTotal({
          ...newItems[index],
          ...updatedItem,
        }),
      };
      onItemsChange(newItems);
    },
    [items, onItemsChange, calculateItemTotal]
  );

  // Update a single field in an item
  const updateItemField = useCallback(
    (index: number, field: keyof OrderItem, value: any) => {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };

      // Recalculate total if quantity or price changes
      if (field === 'quantity' || field === 'unit_price') {
        newItems[index].total_amount = calculateItemTotal(newItems[index]);
      }

      onItemsChange(newItems);
    },
    [items, onItemsChange, calculateItemTotal]
  );

  // Remove an item from the list
  const removeItem = useCallback(
    (index: number) => {
      const newItems = items.filter((_, i) => i !== index);
      onItemsChange(newItems);
    },
    [items, onItemsChange]
  );

  // Calculate the total amount for all items
  const getTotalAmount = useCallback(() => {
    return items.reduce((total, item) => total + (item.total_amount || 0), 0);
  }, [items]);

  return {
    items,
    addItem,
    updateItem,
    removeItem,
    updateItemField,
    calculateItemTotal,
    getTotalAmount,
  };
};

export default useOrderItems; 