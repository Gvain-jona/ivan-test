# Invoice Component

This directory contains the refactored Invoice component system, which is used to generate, preview, customize, and download invoices for orders in the Ivan Prints Business Management System.

## Component Structure

The Invoice component has been refactored into a modular structure:

```
app/components/orders/invoice/
├── index.tsx                    # Re-export for backward compatibility
├── InvoiceSheet.tsx             # Main container component
├── InvoicePreview.tsx           # Invoice preview component
├── types.ts                     # Shared types
├── InvoiceSettings/             # Settings components
│   ├── index.tsx                # Main settings component
│   ├── InvoiceLayoutSection.tsx # Layout settings section
│   ├── FormatOptionsSection.tsx # Format options section
│   └── AdditionalContentSection.tsx # Additional content section
├── hooks/                       # Custom hooks
│   ├── useInvoiceGeneration.ts  # Invoice generation logic
│   └── useInvoiceActions.ts     # Download and print actions
└── README.md                    # This file
```

## Usage

The Invoice component can be imported and used as follows:

```tsx
import InvoiceSheet from '@/components/orders/invoice';
import { Order } from '@/types/orders';

// In your component
const [isOpen, setIsOpen] = useState(false);
const order: Order = { /* order data */ };

return (
  <>
    <Button onClick={() => setIsOpen(true)}>Generate Invoice</Button>
    
    <InvoiceSheet
      open={isOpen}
      onOpenChange={setIsOpen}
      order={order}
      onClose={() => setIsOpen(false)}
    />
  </>
);
```

## Components

### InvoiceSheet

The main container component that orchestrates the entire invoice generation process.

**Props:**
- `open: boolean` - Controls whether the sheet is open
- `onOpenChange: (open: boolean) => void` - Callback when the open state changes
- `order: Order` - The order data to generate an invoice for
- `onClose: () => void` - Callback when the sheet is closed

### InvoicePreview

Displays a preview of the generated invoice or an empty state with a generate button.

**Props:**
- `order: Order` - The order data
- `invoiceUrl: string | null` - URL of the generated invoice, or null if not generated
- `isGenerating: boolean` - Whether an invoice is currently being generated
- `settings: InvoiceSettings` - The current invoice settings
- `onGenerate: () => void` - Callback to generate the invoice

### InvoiceSettings

A form component that allows customization of the invoice.

**Props:**
- `form: UseFormReturn<InvoiceSettings>` - The react-hook-form instance

## Custom Hooks

### useInvoiceGeneration

Manages the invoice generation process, including API calls and loading state.

**Parameters:**
- `orderId: string` - The ID of the order to generate an invoice for

**Returns:**
- `invoiceUrl: string | null` - URL of the generated invoice, or null if not generated
- `isGenerating: boolean` - Whether an invoice is currently being generated
- `generateInvoiceWithSettings: (settings: InvoiceSettings) => Promise<void>` - Function to generate an invoice
- `resetInvoice: () => void` - Function to reset the invoice state

### useInvoiceActions

Provides functions for actions that can be performed on a generated invoice.

**Parameters:**
- `invoiceUrl: string | null` - URL of the generated invoice

**Returns:**
- `handleDownload: () => void` - Function to download the invoice
- `handlePrint: () => void` - Function to print the invoice
