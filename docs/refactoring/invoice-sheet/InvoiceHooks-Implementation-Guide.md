# Invoice Custom Hooks Implementation Guide

This document provides detailed instructions for implementing custom hooks to handle the business logic of the InvoiceSheet component. By extracting logic into custom hooks, we can separate concerns and make the component more maintainable.

## Hook Structure

We'll create two custom hooks:

1. `useInvoiceGeneration` - Handles the invoice generation process
2. `useInvoiceActions` - Handles download and print actions

## File Locations

```
app/components/orders/invoice/hooks/
├── useInvoiceGeneration.ts
└── useInvoiceActions.ts
```

## 1. useInvoiceGeneration Hook

This hook will handle the logic for generating an invoice, including managing loading state and the invoice URL.

### Dependencies

```typescript
import { useState } from 'react';
import { generateInvoice } from '@/lib/api';
import { InvoiceSettings } from '../types';
```

### Implementation

```typescript
interface UseInvoiceGenerationProps {
  orderId: string;
}

interface UseInvoiceGenerationReturn {
  invoiceUrl: string | null;
  isGenerating: boolean;
  generateInvoiceWithSettings: (settings: InvoiceSettings) => Promise<void>;
  resetInvoice: () => void;
}

const useInvoiceGeneration = ({ orderId }: UseInvoiceGenerationProps): UseInvoiceGenerationReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  
  const generateInvoiceWithSettings = async (settings: InvoiceSettings) => {
    try {
      setIsGenerating(true);
      
      // In a real implementation, we would pass the settings to the API
      // For now, we'll just call the placeholder function
      const url = await generateInvoice(orderId, settings);
      
      setInvoiceUrl(url);
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      // Here you would handle errors, perhaps by setting an error state
      // or showing a toast notification
    } finally {
      setIsGenerating(false);
    }
  };
  
  const resetInvoice = () => {
    setInvoiceUrl(null);
  };
  
  return {
    invoiceUrl,
    isGenerating,
    generateInvoiceWithSettings,
    resetInvoice
  };
};

export default useInvoiceGeneration;
```

## 2. useInvoiceActions Hook

This hook will handle actions that can be performed on a generated invoice, such as downloading and printing.

### Dependencies

```typescript
import { useCallback } from 'react';
```

### Implementation

```typescript
interface UseInvoiceActionsProps {
  invoiceUrl: string | null;
}

interface UseInvoiceActionsReturn {
  handleDownload: () => void;
  handlePrint: () => void;
}

const useInvoiceActions = ({ invoiceUrl }: UseInvoiceActionsProps): UseInvoiceActionsReturn => {
  const handleDownload = useCallback(() => {
    if (!invoiceUrl) return;
    
    // In a real app, this would download the PDF file
    // For now, we'll just open the URL in a new tab
    window.open(invoiceUrl, '_blank');
  }, [invoiceUrl]);
  
  const handlePrint = useCallback(() => {
    if (!invoiceUrl) return;
    
    // In a real app, this would print the invoice
    // For now, we'll just simulate printing by opening the URL
    const printWindow = window.open(invoiceUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }, [invoiceUrl]);
  
  return {
    handleDownload,
    handlePrint
  };
};

export default useInvoiceActions;
```

## Usage Example

Here's how these hooks would be used in the refactored InvoiceSheet component:

```typescript
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { InvoiceSettings } from './types';
import useInvoiceGeneration from './hooks/useInvoiceGeneration';
import useInvoiceActions from './hooks/useInvoiceActions';
import InvoicePreview from './InvoicePreview';
import InvoiceSettingsComponent from './InvoiceSettings';
import OrderSheet from '@/components/ui/sheets/OrderSheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, FilePlus, Download, Printer } from 'lucide-react';
import { motion } from 'framer-motion';

const InvoiceSheet = ({ open, onOpenChange, order, onClose }) => {
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
  
  const { invoiceUrl, isGenerating, generateInvoiceWithSettings } = useInvoiceGeneration({
    orderId: order.id
  });
  
  const { handleDownload, handlePrint } = useInvoiceActions({
    invoiceUrl
  });
  
  const handleGenerate = async () => {
    const settings = form.getValues();
    await generateInvoiceWithSettings(settings);
    setActiveTab('preview');
  };
  
  // Rest of the component...
};
```

## Testing Checklist

- [ ] `useInvoiceGeneration` correctly manages loading state
- [ ] `useInvoiceGeneration` properly calls the API and handles the response
- [ ] `useInvoiceGeneration` handles errors gracefully
- [ ] `useInvoiceActions` correctly handles the download action
- [ ] `useInvoiceActions` correctly handles the print action
- [ ] Both hooks work correctly when integrated with the InvoiceSheet component

## Potential Improvements

1. **Error Handling**: Add more robust error handling with specific error messages
2. **Caching**: Implement caching to avoid regenerating the same invoice multiple times
3. **Progress Tracking**: Add progress tracking for large invoices
4. **Retry Logic**: Add retry logic for failed API calls
5. **Analytics**: Add analytics tracking for invoice generation and actions

## Notes

- These hooks encapsulate business logic, making it easier to test and maintain
- The hooks are designed to be reusable across different components
- By separating concerns, we make the component code cleaner and more focused

By implementing these hooks according to the guide, we'll have successfully extracted the business logic from the original InvoiceSheet component, making it more maintainable and testable.
