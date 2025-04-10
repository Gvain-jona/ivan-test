# Archived Components

This directory contains components that were previously part of the application but are no longer in active use. They are preserved here for reference and potential future use.

## Archived Components List

1. **InvoiceModal.tsx** - Modal dialog for invoice generation and preview
   - Replaced by: `InvoiceSheet.tsx`
   - Archived on: April 4, 2024
   - Reason: The application now uses a slide-in panel (Sheet) instead of a modal dialog

2. **OrderViewModal.tsx** - Modal dialog for viewing order details
   - Replaced by: `OrderViewSheet.tsx`
   - Archived on: April 4, 2024
   - Reason: The application now uses a slide-in panel (Sheet) instead of a modal dialog

3. **OrderFormModal.tsx** - Modal dialog for creating and editing orders
   - Replaced by: `OrderFormSheet.tsx`
   - Archived on: April 4, 2024
   - Reason: The application now uses a slide-in panel (Sheet) instead of a modal dialog

## Usage Guidelines

If you need to reference or restore any of these components:

1. Review the component to understand its functionality
2. Check the current implementation of its replacement to understand differences
3. If restoring, make sure to update imports and dependencies
4. Consider whether the component needs modernization before reintroduction

## Archiving Process

When archiving components:

1. Verify the component is not imported or used anywhere in the application
2. Copy the component to this directory
3. Update this README with information about the component
4. Consider removing the original file to avoid confusion

This archiving approach allows us to maintain a clean codebase while preserving valuable code for future reference.
