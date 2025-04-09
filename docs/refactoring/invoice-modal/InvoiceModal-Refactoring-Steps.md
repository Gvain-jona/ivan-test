# InvoiceModal Refactoring: Step-by-Step Implementation Plan

This document provides a detailed, step-by-step plan for refactoring the `InvoiceModal.tsx` component. Follow these steps in order to ensure a smooth refactoring process with minimal risk of breaking existing functionality.

## Prerequisites

Before starting the refactoring process:

1. Create a new branch for this work
2. Ensure all tests are passing
3. Understand the current component structure and functionality
4. Review the refactoring plan and implementation guides

## Step 1: Create Directory Structure

```bash
# Create the directory structure
mkdir -p app/components/orders/invoice-modal/hooks
```

## Step 2: Extract Modal-Specific Types

1. Create the types file:

```bash
# Create the types file
touch app/components/orders/invoice-modal/types.ts
```

2. Implement the types file with the interfaces specific to the modal:

```typescript
// app/components/orders/invoice-modal/types.ts
import { Order } from '@/types/orders';
import { InvoiceSettings } from '../invoice/types';

export interface InvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onClose: () => void;
}

// Re-export InvoiceSettings from the invoice component for convenience
export { InvoiceSettings };
```

## Step 3: Create Modal-Specific Hooks (if needed)

1. Create the hook file:

```bash
# Create the hook file
touch app/components/orders/invoice-modal/hooks/useInvoiceModal.ts
```

2. Implement the hook with any modal-specific logic:

```typescript
// app/components/orders/invoice-modal/hooks/useInvoiceModal.ts
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { InvoiceSettings } from '../types';

interface UseInvoiceModalProps {
  // Add any props needed for the hook
}

interface UseInvoiceModalReturn {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  form: any; // Replace with proper type from react-hook-form
}

const useInvoiceModal = (props: UseInvoiceModalProps): UseInvoiceModalReturn => {
  const [activeTab, setActiveTab] = useState<string>('preview');
  
  const form = useForm<InvoiceSettings>({
    defaultValues: {
      includeHeader: true,
      includeFooter: true,
      includeLogo: true,
      includeSignature: false,
      format: 'a4',
      template: 'standard',
      notes: `Thank you for your business!`,
      paymentTerms: 'Payment due within 30 days.',
      customHeader: '',
      customFooter: '',
    },
  });
  
  return {
    activeTab,
    setActiveTab,
    form
  };
};

export default useInvoiceModal;
```

## Step 4: Implement Main InvoiceModal Component

1. Create the main component file:

```bash
# Create the main component file
touch app/components/orders/invoice-modal/InvoiceModal.tsx
```

2. Implement the InvoiceModal component:

```typescript
// app/components/orders/invoice-modal/InvoiceModal.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, FilePlus, Download, Printer, ArrowLeft } from 'lucide-react';

import { InvoiceModalProps } from './types';
import useInvoiceModal from './hooks/useInvoiceModal';
import useInvoiceGeneration from '../invoice/hooks/useInvoiceGeneration';
import useInvoiceActions from '../invoice/hooks/useInvoiceActions';
import InvoicePreview from '../invoice/InvoicePreview';
import InvoiceSettings from '../invoice/InvoiceSettings';

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  open,
  onOpenChange,
  order,
  onClose,
}) => {
  // Use the custom hooks
  const { activeTab, setActiveTab, form } = useInvoiceModal({});
  
  const { invoiceUrl, isGenerating, generateInvoiceWithSettings } = useInvoiceGeneration({
    orderId: order.id
  });
  
  const { handleDownload, handlePrint } = useInvoiceActions({
    invoiceUrl
  });
  
  // Event handlers
  const handleGenerate = async () => {
    const settings = form.getValues();
    await generateInvoiceWithSettings(settings);
    setActiveTab('preview');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] bg-gray-950 border-gray-800 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-500" />
            Invoice for Order #{order.id.substring(0, 8)}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-gray-900 border-b border-gray-800 w-full justify-start">
            <TabsTrigger 
              value="preview" 
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              <FilePlus className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="mt-4">
            <InvoicePreview
              order={order}
              invoiceUrl={invoiceUrl}
              isGenerating={isGenerating}
              settings={form.getValues()}
              onGenerate={handleGenerate}
            />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-4">
            <InvoiceSettings form={form} />
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="sm:justify-between mt-4 pt-4 border-t border-gray-800">
          <Button
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
            onClick={onClose}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Order
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
              onClick={handlePrint}
              disabled={!invoiceUrl}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              className="bg-orange-600 text-white hover:bg-orange-700"
              onClick={handleDownload}
              disabled={!invoiceUrl}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceModal;
```

## Step 5: Create Index File for Backward Compatibility

1. Create the index file:

```bash
# Create the index file
touch app/components/orders/invoice-modal/index.tsx
```

2. Implement the index file:

```typescript
// app/components/orders/invoice-modal/index.tsx
export { default } from './InvoiceModal';
export * from './types';
```

## Step 6: Update Original InvoiceModal.tsx for Backward Compatibility

1. Update the original file to re-export from the new location:

```typescript
// app/components/orders/InvoiceModal.tsx
/**
 * This file is now a re-export from the refactored invoice-modal component.
 * 
 * The component has been refactored into smaller, more maintainable pieces.
 * See the new implementation at app/components/orders/invoice-modal/
 */

export { default } from './invoice-modal';
export * from './invoice-modal/types';
```

## Step 7: Create README for Documentation

1. Create the README file:

```bash
# Create the README file
touch app/components/orders/invoice-modal/README.md
```

2. Implement the README:

```markdown
# Invoice Modal Component

This directory contains the refactored Invoice Modal component, which is used to generate, preview, customize, and download invoices for orders in a modal dialog.

## Component Structure

The Invoice Modal component has been refactored into a modular structure:

```
app/components/orders/invoice-modal/
├── index.tsx                    # Re-export for backward compatibility
├── InvoiceModal.tsx             # Main container component
├── hooks/                       # Modal-specific hooks
│   └── useInvoiceModal.ts       # Modal-specific logic
└── types.ts                     # Modal-specific types
```

This component also leverages components from the Invoice component:

```
app/components/orders/invoice/
├── InvoicePreview.tsx           # Preview component
├── InvoiceSettings/             # Settings components
├── hooks/                       # Shared hooks
└── types.ts                     # Shared types
```

## Usage

The Invoice Modal component can be imported and used as follows:

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
```

## Step 8: Test the Refactored Component

1. Run the application and test the InvoiceModal component:
   - Test the preview tab
   - Test the settings tab
   - Test generating an invoice
   - Test downloading and printing

2. Verify that all functionality works exactly as before.

## Step 9: Update Documentation

1. Update the refactoring progress documentation:
   - Mark InvoiceModal as refactored in the large files checklist
   - Update the refactoring progress tracking document

## Troubleshooting Common Issues

### Issue: Component doesn't render correctly

- Check that all props are being passed correctly
- Verify CSS classes are applied properly
- Check for console errors

### Issue: Form doesn't work correctly

- Verify that form control is properly passed to child components
- Check that form values are being accessed correctly

### Issue: Invoice generation doesn't work

- Check that the hooks are implemented correctly
- Verify API calls are being made properly

### Issue: Styling differences

- Compare the rendered output with the original component
- Adjust CSS classes as needed

## Verification Checklist

- [ ] All components render correctly
- [ ] Tab navigation works as expected
- [ ] Form state is properly managed
- [ ] Invoice generation works correctly
- [ ] Download and print actions work correctly
- [ ] UI appears identical to the original component
- [ ] No console errors or warnings
- [ ] Code is well-documented
- [ ] All tests pass

By following this step-by-step plan, you'll successfully refactor the InvoiceModal component into a more maintainable and modular structure while preserving all existing functionality and leveraging the work already done in the InvoiceSheet refactoring.
