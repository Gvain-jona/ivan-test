# InvoiceSheet Refactoring: Step-by-Step Implementation Plan

This document provides a detailed, step-by-step plan for refactoring the `InvoiceSheet.tsx` component. Follow these steps in order to ensure a smooth refactoring process with minimal risk of breaking existing functionality.

## Prerequisites

Before starting the refactoring process:

1. Create a new branch for this work
2. Ensure all tests are passing
3. Understand the current component structure and functionality
4. Review the refactoring plan and implementation guides

## Step 1: Create Directory Structure

```bash
# Create the directory structure
mkdir -p app/components/orders/invoice/InvoiceSettings
mkdir -p app/components/orders/invoice/hooks
```

## Step 2: Extract Types

1. Create the types file:

```bash
# Create the types file
touch app/components/orders/invoice/types.ts
```

2. Implement the types file with the interfaces from the original component:

```typescript
// app/components/orders/invoice/types.ts
import { Order } from '@/types/orders';

export interface InvoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onClose: () => void;
}

export interface InvoiceSettings {
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

// Shared props for settings sections
export interface SettingsSectionProps {
  control: any; // from react-hook-form
}
```

## Step 3: Implement Custom Hooks

1. Create the hook files:

```bash
# Create the hook files
touch app/components/orders/invoice/hooks/useInvoiceGeneration.ts
touch app/components/orders/invoice/hooks/useInvoiceActions.ts
```

2. Implement `useInvoiceGeneration.ts` as described in the hooks implementation guide.
3. Implement `useInvoiceActions.ts` as described in the hooks implementation guide.

## Step 4: Implement InvoicePreview Component

1. Create the preview component file:

```bash
# Create the preview component file
touch app/components/orders/invoice/InvoicePreview.tsx
```

2. Implement `InvoicePreview.tsx` as described in the preview implementation guide.

## Step 5: Implement Settings Components

1. Create the settings component files:

```bash
# Create the settings component files
touch app/components/orders/invoice/InvoiceSettings/index.tsx
touch app/components/orders/invoice/InvoiceSettings/InvoiceLayoutSection.tsx
touch app/components/orders/invoice/InvoiceSettings/FormatOptionsSection.tsx
touch app/components/orders/invoice/InvoiceSettings/AdditionalContentSection.tsx
```

2. Implement each settings component as described in the settings implementation guide:
   - First implement the section components
   - Then implement the main settings component that combines them

## Step 6: Implement Main InvoiceSheet Component

1. Create the main component file:

```bash
# Create the main component file
touch app/components/orders/invoice/InvoiceSheet.tsx
```

2. Implement `InvoiceSheet.tsx` as described in the refactored component implementation guide.

## Step 7: Create Index File for Backward Compatibility

1. Create the index file:

```bash
# Create the index file
touch app/components/orders/invoice/index.tsx
```

2. Implement the index file:

```typescript
// app/components/orders/invoice/index.tsx
export { default } from './InvoiceSheet';
export * from './types';
```

## Step 8: Update Import References

1. Find all files that import the original InvoiceSheet component:

```bash
# Find all files that import InvoiceSheet
grep -r "import InvoiceSheet from" --include="*.tsx" --include="*.ts" app/
```

2. Update the imports if necessary (they should work with the new index file, but verify).

## Step 9: Test the Refactored Component

1. Run the application and test the InvoiceSheet component:
   - Test the preview tab
   - Test the settings tab
   - Test generating an invoice
   - Test downloading and printing

2. Verify that all functionality works exactly as before.

## Step 10: Clean Up

1. Remove any unused code or comments.
2. Ensure all files have proper JSDoc comments.
3. Verify code formatting is consistent.

## Step 11: Create Documentation

1. Create a README.md file in the invoice directory:

```bash
# Create the README file
touch app/components/orders/invoice/README.md
```

2. Document the component structure, purpose, and usage.

## Step 12: Commit and Push

1. Commit the changes with a descriptive message:

```bash
git add app/components/orders/invoice/
git commit -m "Refactor: Break down InvoiceSheet component into smaller, more maintainable components"
```

2. Push the changes to the remote repository.

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
- [ ] All animations and transitions work as expected
- [ ] Component is responsive on different screen sizes
- [ ] No console errors or warnings
- [ ] Code is well-documented
- [ ] All tests pass

By following this step-by-step plan, you'll successfully refactor the InvoiceSheet component into a more maintainable and modular structure while preserving all existing functionality.
