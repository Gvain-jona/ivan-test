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

## Types

### InvoiceSheetProps

Props for the main InvoiceSheet component.

```typescript
interface InvoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onClose: () => void;
}
```

### InvoiceSettings

Settings for customizing the invoice.

```typescript
interface InvoiceSettings {
  includeHeader: boolean;
  includeFooter: boolean;
  includeLogo: boolean;
  includeSignature: boolean;
  format: 'a4' | 'letter';
  template: 'standard' | 'minimal' | 'detailed';
  notes: string;
  paymentTerms: string;
  customHeader: string;
  customFooter: string;
}
```

## Styling

The component uses Tailwind CSS for styling and maintains the dark theme with orange accent colors used throughout the application. The invoice preview itself uses a light theme to match the appearance of the actual printed invoice.

## Accessibility

The component includes proper ARIA attributes and supports keyboard navigation. The tab interface is fully accessible, and all interactive elements have appropriate focus states.

## Future Improvements

Potential future improvements for the Invoice component:

1. Add more template options
2. Support for different languages and currencies
3. Custom branding options
4. Save and load invoice templates
5. Email invoice directly to client
6. Preview updates in real-time as settings change

## Contributing

When making changes to the Invoice component:

1. Maintain the modular structure
2. Keep components focused on a single responsibility
3. Update tests for any changes
4. Document any new props or features
5. Ensure backward compatibility

## Related Components

- `OrderViewModal` - Uses the Invoice component to generate invoices for orders
- `OrdersTable` - Contains actions to open the Invoice component for an order

## Changelog

- **v1.0.0** - Initial refactored version
- **v0.9.0** - Original monolithic implementation

---

This README provides an overview of the refactored Invoice component system. For more detailed implementation guides, refer to the documentation in the `docs/` directory.
