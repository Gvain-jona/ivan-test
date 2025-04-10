# Implementation Plan: OrderFormModal.tsx Refactoring

This document outlines the detailed step-by-step plan for refactoring the `OrderFormModal.tsx` component to adhere to the 200-line file size limit while improving code organization, maintainability, and reusability.

## Current Component Analysis

**File Path:** `app/components/orders/OrderFormModal.tsx`

**Current Structure:**
- Large modal component with tabbed interface
- Multiple sections handling different aspects of an order (general info, items, payments, notes)
- Complex state management
- Multiple utility functions within the component
- Exceeds 200 lines

## Refactoring Goals

1. Break down the component into smaller, focused components
2. Extract business logic into custom hooks
3. Move utility functions to separate files
4. Implement Shadcn UI components where appropriate
5. Maintain all current functionality
6. Ensure the main component file is under 200 lines

## File Structure After Refactoring

```
app/
└── components/
    └── orders/
        ├── OrderFormModal/
        │   ├── index.tsx                  # Main export file (<200 lines)
        │   ├── OrderGeneralInfoForm.tsx   # General order information form
        │   ├── OrderItemsForm.tsx         # Order items management
        │   ├── OrderPaymentsForm.tsx      # Payments management section
        │   ├── OrderNotesForm.tsx         # Notes management section
        │   └── OrderFormTabs.tsx          # Tabbed interface component
        └── ...
```

```
app/
└── hooks/
    └── orders/
        ├── useOrderForm.ts                # Form state management hook
        ├── useOrderItems.ts               # Items management hook
        ├── useOrderPayments.ts            # Payments management hook
        ├── useOrderNotes.ts               # Notes management hook
        └── useOrderCalculations.ts        # Calculations hook (totals, balance)
```

```
app/
└── utils/
    └── orders/
        └── order-form.utils.ts            # Utility functions for order forms
```

## Detailed Refactoring Steps

### Step 1: Create Supporting Files and Directories

1. Create the directory structure
   ```
   mkdir -p app/components/orders/OrderFormModal
   mkdir -p app/hooks/orders
   mkdir -p app/utils/orders
   ```

2. Create the utility files
   ```
   touch app/utils/orders/order-form.utils.ts
   ```

3. Create the hooks files
   ```
   touch app/hooks/orders/useOrderForm.ts
   touch app/hooks/orders/useOrderItems.ts
   touch app/hooks/orders/useOrderPayments.ts
   touch app/hooks/orders/useOrderNotes.ts
   touch app/hooks/orders/useOrderCalculations.ts
   ```

4. Create the component files
   ```
   touch app/components/orders/OrderFormModal/index.tsx
   touch app/components/orders/OrderFormModal/OrderGeneralInfoForm.tsx
   touch app/components/orders/OrderFormModal/OrderItemsForm.tsx
   touch app/components/orders/OrderFormModal/OrderPaymentsForm.tsx
   touch app/components/orders/OrderFormModal/OrderNotesForm.tsx
   touch app/components/orders/OrderFormModal/OrderFormTabs.tsx
   ```

### Step 2: Extract Utility Functions

Move all utility functions from the original file to the appropriate utility file:

**app/utils/orders/order-form.utils.ts**
```typescript
// Status formatting functions
export const formatOrderStatus = (status: string): string => {
  // Implementation
};

// Date formatting functions
export const formatOrderDate = (date: string): string => {
  // Implementation
};

// Currency formatting
export const formatCurrency = (amount: number): string => {
  // Implementation
};

// Validation helpers
export const validateOrderItem = (item: OrderItem): boolean => {
  // Implementation
};

// Other helpers
export const generateOrderId = (): string => {
  // Implementation
};
```

### Step 3: Implement Custom Hooks

Extract the state management and business logic into hooks:

**app/hooks/orders/useOrderForm.ts**
```typescript
import { useState, useCallback } from 'react';
import { Order } from '@/types/orders';

export const useOrderForm = (initialOrder?: Partial<Order>) => {
  const [order, setOrder] = useState<Partial<Order>>(initialOrder || {
    status: 'paused',
    payment_status: 'unpaid',
    total_amount: 0,
    amount_paid: 0,
    balance: 0,
    items: [],
    notes: [],
    payments: [],
  });

  const updateOrderField = useCallback((field: string, value: any) => {
    setOrder(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetOrder = useCallback(() => {
    setOrder({
      status: 'paused',
      payment_status: 'unpaid',
      total_amount: 0,
      amount_paid: 0,
      balance: 0,
      items: [],
      notes: [],
      payments: [],
    });
  }, []);

  return {
    order,
    setOrder,
    updateOrderField,
    resetOrder
  };
};
```

**app/hooks/orders/useOrderItems.ts**
```typescript
import { useCallback } from 'react';
import { OrderItem } from '@/types/orders';
import { validateOrderItem } from '@/utils/orders/order-form.utils';

export const useOrderItems = (
  items: OrderItem[],
  updateItems: (items: OrderItem[]) => void
) => {
  const addItem = useCallback((item: OrderItem) => {
    if (validateOrderItem(item)) {
      updateItems([...items, item]);
    }
  }, [items, updateItems]);

  const updateItem = useCallback((index: number, updatedItem: OrderItem) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    updateItems(newItems);
  }, [items, updateItems]);

  const removeItem = useCallback((index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    updateItems(newItems);
  }, [items, updateItems]);

  return {
    addItem,
    updateItem,
    removeItem
  };
};
```

Similar implementations for `useOrderPayments.ts`, `useOrderNotes.ts`, and `useOrderCalculations.ts`.

### Step 4: Create Subcomponents

Break down the original component into smaller, focused components:

**app/components/orders/OrderFormModal/OrderGeneralInfoForm.tsx**
```typescript
import React from 'react';
import { Order } from '@/types/orders';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OrderGeneralInfoFormProps {
  order: Partial<Order>;
  onFieldChange: (field: string, value: any) => void;
  isEditing: boolean;
}

export const OrderGeneralInfoForm: React.FC<OrderGeneralInfoFormProps> = ({
  order,
  onFieldChange,
  isEditing
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="client_name">Client Name</Label>
          <Input
            id="client_name"
            value={order.client_name || ''}
            onChange={(e) => onFieldChange('client_name', e.target.value)}
            placeholder="Enter client name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="status">Order Status</Label>
          <Select
            value={order.status || 'paused'}
            onValueChange={(value) => onFieldChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Additional fields for general info */}
      </div>
    </div>
  );
};
```

Similar implementations for `OrderItemsForm.tsx`, `OrderPaymentsForm.tsx`, and `OrderNotesForm.tsx`.

**app/components/orders/OrderFormModal/OrderFormTabs.tsx**
```typescript
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface OrderFormTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export const OrderFormTabs: React.FC<OrderFormTabsProps> = ({
  activeTab,
  setActiveTab,
  children
}) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-4 mb-4">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="items">Items</TabsTrigger>
        <TabsTrigger value="payments">Payments</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
};
```

### Step 5: Implement Main Component

Rewrite the main component to use the extracted subcomponents and hooks:

**app/components/orders/OrderFormModal/index.tsx**
```typescript
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Order } from '@/types/orders';
import { TabsContent } from '@/components/ui/tabs';

// Import custom hooks
import { useOrderForm } from '@/hooks/orders/useOrderForm';
import { useOrderItems } from '@/hooks/orders/useOrderItems';
import { useOrderPayments } from '@/hooks/orders/useOrderPayments';
import { useOrderNotes } from '@/hooks/orders/useOrderNotes';
import { useOrderCalculations } from '@/hooks/orders/useOrderCalculations';

// Import subcomponents
import { OrderFormTabs } from './OrderFormTabs';
import { OrderGeneralInfoForm } from './OrderGeneralInfoForm';
import { OrderItemsForm } from './OrderItemsForm';
import { OrderPaymentsForm } from './OrderPaymentsForm';
import { OrderNotesForm } from './OrderNotesForm';

interface OrderFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (order: Order) => void;
  initialOrder?: Partial<Order>;
  title: string;
  isEditing: boolean;
}

const OrderFormModal: React.FC<OrderFormModalProps> = ({
  open,
  onOpenChange,
  onSave,
  initialOrder,
  title,
  isEditing,
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const { toast } = useToast();
  
  // Use custom hooks
  const { order, updateOrderField, setOrder } = useOrderForm(initialOrder);
  const { addItem, updateItem, removeItem } = useOrderItems(
    order.items || [],
    (items) => updateOrderField('items', items)
  );
  const { addPayment, updatePayment, removePayment } = useOrderPayments(
    order.payments || [],
    (payments) => updateOrderField('payments', payments)
  );
  const { addNote, updateNote, removeNote } = useOrderNotes(
    order.notes || [],
    (notes) => updateOrderField('notes', notes)
  );
  const { calculateTotals } = useOrderCalculations();
  
  const handleSave = () => {
    // Calculate final totals
    const finalOrder = calculateTotals(order as Order);
    
    // Save the order
    onSave(finalOrder as Order);
    onOpenChange(false);
    
    // Show success message
    toast({
      title: isEditing ? "Order Updated" : "Order Created",
      description: `Order has been ${isEditing ? "updated" : "created"} successfully.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <OrderFormTabs activeTab={activeTab} setActiveTab={setActiveTab}>
          <TabsContent value="general">
            <OrderGeneralInfoForm
              order={order}
              onFieldChange={updateOrderField}
              isEditing={isEditing}
            />
          </TabsContent>
          
          <TabsContent value="items">
            <OrderItemsForm
              items={order.items || []}
              onAddItem={addItem}
              onUpdateItem={updateItem}
              onRemoveItem={removeItem}
            />
          </TabsContent>
          
          <TabsContent value="payments">
            <OrderPaymentsForm
              payments={order.payments || []}
              onAddPayment={addPayment}
              onUpdatePayment={updatePayment}
              onRemovePayment={removePayment}
            />
          </TabsContent>
          
          <TabsContent value="notes">
            <OrderNotesForm
              notes={order.notes || []}
              onAddNote={addNote}
              onUpdateNote={updateNote}
              onRemoveNote={removeNote}
            />
          </TabsContent>
        </OrderFormTabs>
        
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isEditing ? 'Update' : 'Create'} Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderFormModal;
```

### Step 6: Update Original File

Temporarily update the original file to re-export from the new location:

**app/components/orders/OrderFormModal.tsx**
```typescript
import OrderFormModal from './OrderFormModal/index';
export default OrderFormModal;
```

### Step 7: Testing

Test the refactored components to ensure all functionality works as expected:

1. Verify that the form renders correctly
2. Test all form interactions
3. Confirm that data is correctly saved
4. Validate calculations and state management
5. Check for any regressions in UI or behavior

### Step 8: Documentation

Update documentation to reflect the new component structure:

1. Update component JSDoc comments
2. Add README.md files where needed
3. Document complex logic or business rules
4. Provide usage examples

## Benefits of This Refactoring

1. **Improved Maintainability:** Each component has a clear, single responsibility
2. **Enhanced Reusability:** Hooks and utilities can be reused in other parts of the application
3. **Better Testability:** Smaller components are easier to test
4. **Reduced Cognitive Load:** Developers can focus on smaller pieces of logic
5. **Improved Performance:** Potential for more granular re-renders
6. **Modern Practices:** Integration with Shadcn UI components
7. **File Size Compliance:** Main component file is now under 200 lines

## Migration Path

To minimize disruption, this refactoring can be implemented incrementally:

1. First create the utility functions and hooks
2. Then implement the subcomponents
3. Update the main component file
4. Add the re-export from the original location
5. Only when everything is stable, remove the original file

This ensures that other parts of the application that depend on this component continue to function during the refactoring process. 