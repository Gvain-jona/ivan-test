# Archived Invoice Components

This directory contains archived invoice components that were part of the previous invoice system. These components are kept for reference but are no longer actively used in the application.

## Migration Plan

The invoice system has been completely rebuilt with a new architecture located in `app/features/invoices`. The new system provides:

1. **Improved PDF Generation**: More reliable PDF generation with better feedback
2. **Better Settings Management**: Settings are properly saved and loaded from the database
3. **Professional Design**: The template uses proper typography, spacing, and color contrast
4. **Improved User Experience**: The interface provides clear feedback and is easier to use

## Integration Points

The new invoice system is integrated with the existing order management system through:

1. **InvoiceButtonWrapper**: A wrapper component that handles both direct button clicks and integration with the existing order context
2. **OrderActions Component**: Updated to use the new InvoiceButtonWrapper
3. **InvoicesTab Component**: Updated to use the new InvoiceButtonWrapper
4. **OrderInvoiceTab Component**: Updated to use the new InvoiceButtonWrapper
5. **useOrderModals Hook**: Updated to work with the new invoice system

## Files to Archive

The following files are part of the old invoice system and should be archived:

- `app/components/orders/invoice/InvoiceSheet.tsx`
- `app/components/orders/invoice/InvoicePreview.tsx`
- `app/components/orders/invoice/types.ts`
- `app/components/orders/invoice/hooks/useInvoiceGeneration.ts`
- `app/components/orders/invoice/hooks/useServerInvoiceGeneration.ts`
- `app/components/orders/invoice/hooks/useClientInvoiceGeneration.ts`
- `app/components/orders/invoice/hooks/usePuppeteerInvoiceGeneration.ts`
- `app/components/orders/invoice/hooks/useEnhancedInvoiceGeneration.ts`
- `app/components/orders/invoice/hooks/useInvoiceActions.ts`
- `app/components/orders/invoice/utils/clientPdfGenerator.ts`
- `app/components/orders/invoice/utils/enhancedPdfGenerator.ts`
- `app/components/orders/invoice/utils/simplePdfGenerator.ts`
- `app/components/orders/invoice/InvoiceSettings/index.tsx`
- `app/components/orders/invoice/InvoiceSettings/InvoiceLayoutSection.tsx`
- `app/components/orders/invoice/InvoiceSettings/FormatOptionsSection.tsx`
- `app/components/orders/invoice/InvoiceSettings/AdditionalContentSection.tsx`

## How to Archive

1. Move the files to the `_archive` directory
2. Update any imports in files that still reference these components
3. Test the application to ensure everything works correctly
4. Once confirmed, the archived files can be safely removed in a future update
