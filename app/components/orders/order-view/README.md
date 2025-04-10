# Order View Component

This directory contains the refactored Order View component system, which is used to display order details, items, payments, and notes in the Ivan Prints Business Management System.

## Component Structure

The Order View component has been refactored into a modular structure:

```
app/components/orders/order-view/
├── index.tsx                    # Re-export for backward compatibility
├── OrderViewSheet.tsx           # Main container component
├── OrderDetailsTab.tsx          # Details tab content
├── OrderItemsTab.tsx            # Items tab content
├── OrderPaymentsTab.tsx         # Payments tab content
├── OrderNotesTab.tsx            # Notes tab content
├── PaymentForm.tsx              # Payment form component
├── hooks/                       # Custom hooks
│   └── useOrderPayments.ts      # Payment form state and logic
├── types.ts                     # Shared types and interfaces
└── README.md                    # This file
```

## Usage

The Order View component can be imported and used as follows:

```tsx
import OrderViewSheet from '@/components/orders/order-view';
import { Order } from '@/types/orders';

// In your component
const [isOpen, setIsOpen] = useState(false);
const order: Order = { /* order data */ };

return (
  <>
    <Button onClick={() => setIsOpen(true)}>View Order</Button>
    
    <OrderViewSheet
      open={isOpen}
      onOpenChange={setIsOpen}
      order={order}
      onClose={() => setIsOpen(false)}
      onEdit={handleEditOrder}
      onGenerateInvoice={handleGenerateInvoice}
      userRole="admin"
    />
  </>
);
```

## Components

### OrderViewSheet

The main container component that orchestrates the entire order view process.

**Props:**
- `open: boolean` - Controls whether the sheet is open
- `onOpenChange: (open: boolean) => void` - Callback when the open state changes
- `order: Order` - The order data to display
- `onClose: () => void` - Callback when the sheet is closed
- `onEdit: (order: Order) => void` - Callback when the edit button is clicked
- `onGenerateInvoice: (order: Order) => void` - Callback when the generate invoice button is clicked
- `userRole?: string` - The user's role (determines edit permissions)

### OrderDetailsTab

Displays the order details, status, and payment information.

**Props:**
- `order: Order` - The order data
- `calculateBalancePercent: () => number` - Function to calculate the payment progress percentage

### OrderItemsTab

Displays the order items in a table.

**Props:**
- `order: Order` - The order data

### OrderPaymentsTab

Displays the order payments and payment form.

**Props:**
- `order: Order` - The order data
- `showPaymentForm: boolean` - Whether to show the payment form
- `setShowPaymentForm: (show: boolean) => void` - Function to toggle the payment form
- `canEdit: boolean` - Whether the user can add payments
- `onAddPayment: (payment: OrderPayment) => void` - Callback when a payment is added

### OrderNotesTab

Displays the order notes and history.

**Props:**
- `order: Order` - The order data

### PaymentForm

Form for adding payments to an order.

**Props:**
- `onSubmit: (payment: OrderPayment) => void` - Callback when the form is submitted
- `onCancel: () => void` - Callback when the form is cancelled

## Custom Hooks

### useOrderPayments

Manages the payment form state and logic.

**Parameters:**
- `order: Order` - The order data
- `onAddPayment: (payment: OrderPayment) => void` - Callback when a payment is added

**Returns:**
- `paymentAmount: string` - The payment amount
- `setPaymentAmount: (amount: string) => void` - Function to set the payment amount
- `paymentMethod: string` - The payment method
- `setPaymentMethod: (method: string) => void` - Function to set the payment method
- `paymentNotes: string` - The payment notes
- `setPaymentNotes: (notes: string) => void` - Function to set the payment notes
- `handleSubmit: () => void` - Function to submit the form
- `resetForm: () => void` - Function to reset the form
