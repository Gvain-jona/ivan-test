# Refactored InvoiceSheet Implementation Guide

This document provides detailed instructions for implementing the refactored `InvoiceSheet` component, which will serve as the main container component after extracting the various sub-components and hooks.

## Component Purpose

The refactored `InvoiceSheet` component will:
1. Serve as the container for all invoice-related components
2. Manage the tab state between preview and settings
3. Coordinate between the form, hooks, and child components
4. Maintain the overall structure and functionality of the original component

## File Structure

```
app/components/orders/invoice/
├── index.tsx                    # Re-export for backward compatibility
├── InvoiceSheet.tsx             # Main container component
├── InvoicePreview.tsx           # Invoice preview component
├── types.ts                     # Shared types
├── InvoiceSettings/             # Settings components
│   ├── index.tsx
│   ├── InvoiceLayoutSection.tsx
│   ├── FormatOptionsSection.tsx
│   └── AdditionalContentSection.tsx
└── hooks/                       # Custom hooks
    ├── useInvoiceGeneration.ts
    └── useInvoiceActions.ts
```

## Dependencies

```typescript
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, FilePlus, Download, Printer } from 'lucide-react';
import { motion } from 'framer-motion';
import OrderSheet from '@/components/ui/sheets/OrderSheet';
import { InvoiceSheetProps, InvoiceSettings } from './types';
import InvoicePreview from './InvoicePreview';
import InvoiceSettings from './InvoiceSettings';
import useInvoiceGeneration from './hooks/useInvoiceGeneration';
import useInvoiceActions from './hooks/useInvoiceActions';
```

## Implementation

```typescript
const InvoiceSheet: React.FC<InvoiceSheetProps> = ({
  open,
  onOpenChange,
  order,
  onClose,
}) => {
  // Tab state
  const [activeTab, setActiveTab] = useState<string>('preview');
  
  // Form setup
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
  
  // Custom hooks
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
    <OrderSheet 
      open={open} 
      onOpenChange={onOpenChange}
      title={`Invoice for Order #${order.id.substring(0, 8)}`}
      size="xl"
      onClose={onClose}
    >
      <div className="p-0 flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
          <div className="border-b border-[#2B2B40] px-6">
            <TabsList className="bg-transparent w-full justify-start">
              <TabsTrigger 
                value="preview" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none text-[#6D6D80] px-4 py-2"
              >
                <FileText className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none text-[#6D6D80] px-4 py-2"
              >
                <FilePlus className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-auto">
            <TabsContent value="preview" className="h-full flex flex-col p-6">
              <InvoicePreview
                order={order}
                invoiceUrl={invoiceUrl}
                isGenerating={isGenerating}
                settings={form.getValues()}
                onGenerate={handleGenerate}
              />
            </TabsContent>
            
            <TabsContent value="settings" className="h-full p-6">
              <InvoiceSettings form={form} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
      
      <div className="border-t border-[#2B2B40] p-6 flex flex-wrap gap-3">
        {invoiceUrl && (
          <>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleDownload}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handlePrint}
                variant="outline"
                className="border-[#2B2B40] bg-transparent hover:bg-white/[0.02] text-[#6D6D80] hover:text-white"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </motion.div>
          </>
        )}
        
        {!invoiceUrl && activeTab === 'settings' && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleGenerate}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Invoice'}
            </Button>
          </motion.div>
        )}
      </div>
    </OrderSheet>
  );
};

export default InvoiceSheet;
```

## Backward Compatibility

To maintain backward compatibility, create an `index.tsx` file that re-exports the component:

```typescript
// app/components/orders/invoice/index.tsx
export { default } from './InvoiceSheet';
export * from './types';
```

## Testing Checklist

- [ ] Component renders correctly with all sub-components
- [ ] Tab navigation works as expected
- [ ] Form state is properly managed
- [ ] Invoice generation works correctly
- [ ] Download and print actions work correctly
- [ ] UI appears identical to the original component
- [ ] All animations and transitions work as expected
- [ ] Component is responsive on different screen sizes

## Implementation Steps

1. **Create Directory Structure**:
   - Create the directory structure as outlined above
   - Set up the initial files with basic exports

2. **Extract Types**:
   - Create the `types.ts` file with all necessary interfaces

3. **Implement Sub-Components**:
   - Implement `InvoicePreview.tsx`
   - Implement the settings components
   - Implement the custom hooks

4. **Implement Main Component**:
   - Create `InvoiceSheet.tsx` as outlined above
   - Create `index.tsx` for backward compatibility

5. **Test and Refine**:
   - Test all functionality
   - Make any necessary adjustments
   - Ensure backward compatibility

## Benefits of This Refactoring

1. **Improved Maintainability**: Each component has a clear, single responsibility
2. **Better Code Organization**: Logic is separated from presentation
3. **Enhanced Reusability**: Components and hooks can be reused elsewhere
4. **Easier Testing**: Isolated components and hooks are easier to test
5. **Reduced Complexity**: Each file is smaller and more focused
6. **Better Performance**: Potential for more optimized rendering
7. **Clearer Code Intent**: Each file's purpose is immediately clear

## Potential Future Improvements

1. **State Management**: Consider using context for more complex state management
2. **Caching**: Implement caching for generated invoices
3. **Optimistic UI**: Show a preview before the actual invoice is generated
4. **Accessibility Improvements**: Enhance keyboard navigation and screen reader support
5. **Internationalization**: Add support for multiple languages
6. **Theme Support**: Add support for different themes or color schemes

By implementing this refactored component according to the guide, we'll have successfully transformed the large, monolithic InvoiceSheet component into a well-organized, maintainable set of components while preserving all existing functionality.
