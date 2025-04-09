# Invoice Modal Component

This directory contains documentation for the refactored Invoice Modal component, which is used to display and customize invoices in a modal dialog.

## Component Purpose

The Invoice Modal component provides a dialog interface for:
- Previewing invoices for orders
- Customizing invoice settings
- Generating, downloading, and printing invoices

## Refactoring Benefits

The original `InvoiceModal.tsx` component was 458 lines long and contained multiple responsibilities. The refactored version:

1. **Leverages Existing Components**: Reuses components from the InvoiceSheet refactoring
2. **Separates Concerns**: Divides the component into smaller, focused pieces
3. **Improves Maintainability**: Makes the code easier to understand and modify
4. **Reduces Duplication**: Shares logic with the InvoiceSheet component
5. **Enhances Testability**: Makes components easier to test in isolation

## Component Structure

The refactored Invoice Modal component is organized as follows:

```
app/components/orders/invoice-modal/
├── index.tsx                    # Re-export for backward compatibility
├── InvoiceModal.tsx             # Main container component
├── hooks/                       # Modal-specific hooks
│   └── useInvoiceModal.ts       # Modal-specific logic
├── types.ts                     # Modal-specific types
└── README.md                    # Component documentation
```

This component also leverages components from the Invoice component:

```
app/components/orders/invoice/
├── InvoicePreview.tsx           # Preview component
├── InvoiceSettings/             # Settings components
│   ├── index.tsx
│   ├── InvoiceLayoutSection.tsx
│   ├── FormatOptionsSection.tsx
│   └── AdditionalContentSection.tsx
├── hooks/                       # Shared hooks
│   ├── useInvoiceGeneration.ts
│   └── useInvoiceActions.ts
└── types.ts                     # Shared types
```

## Key Differences from InvoiceSheet

While the InvoiceModal component shares much of its functionality with the InvoiceSheet component, there are some key differences:

1. **Container Component**: Uses Dialog instead of OrderSheet
2. **Layout**: Optimized for a modal dialog layout
3. **Styling**: Uses different styling to match the modal context
4. **Footer Actions**: Has a different footer layout with a "Back to Order" button

## Implementation Details

### Main Component (InvoiceModal.tsx)

The main component is responsible for:
- Rendering the Dialog container
- Managing the tab state between preview and settings
- Coordinating between the form, hooks, and child components

### Custom Hook (useInvoiceModal.ts)

This hook manages modal-specific state:
- Tab state
- Form state
- Any other modal-specific logic

### Shared Components

The component reuses several components from the InvoiceSheet refactoring:
- **InvoicePreview**: Displays the invoice preview
- **InvoiceSettings**: Provides settings controls
- **useInvoiceGeneration**: Handles invoice generation
- **useInvoiceActions**: Handles download and print actions

## Usage Example

```tsx
import InvoiceModal from '@/components/orders/invoice-modal';
import { Order } from '@/types/orders';

// In your component
const [isOpen, setIsOpen] = useState(false);
const order: Order = { /* order data */ };

return (
  <>
    <Button onClick={() => setIsOpen(true)}>Generate Invoice</Button>
    
    <InvoiceModal
      open={isOpen}
      onOpenChange={setIsOpen}
      order={order}
      onClose={() => setIsOpen(false)}
    />
  </>
);
```

## Props

- `open: boolean` - Controls whether the modal is open
- `onOpenChange: (open: boolean) => void` - Callback when the open state changes
- `order: Order` - The order data to generate an invoice for
- `onClose: () => void` - Callback when the modal is closed

## Implementation Checklist

- [ ] Create directory structure
- [ ] Extract modal-specific types
- [ ] Create modal-specific hooks
- [ ] Implement main InvoiceModal component
- [ ] Create index.tsx for backward compatibility
- [ ] Update original file for backward compatibility
- [ ] Test all functionality
- [ ] Update documentation

## Testing Strategy

To ensure the refactoring doesn't break existing functionality:

1. **Manual Testing**:
   - Test the invoice generation flow
   - Verify all settings work correctly
   - Test download and print functionality
   - Check that the UI appears identical to the original

2. **Regression Testing**:
   - Ensure the component works with the same props as before
   - Verify that all user interactions produce the same results

3. **Edge Cases**:
   - Test with different order data
   - Test with various settings combinations
   - Test error handling scenarios

## Future Improvements

Potential future improvements for the Invoice Modal component:

1. Add more template options
2. Support for different languages and currencies
3. Custom branding options
4. Save and load invoice templates
5. Email invoice directly to client
6. Preview updates in real-time as settings change
