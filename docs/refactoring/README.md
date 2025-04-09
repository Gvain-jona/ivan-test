# Refactoring Documentation

This directory contains documentation for various refactoring efforts in the Ivan Prints Business Management System.

## Current Refactoring Projects

### [InvoiceSheet Component](./invoice-sheet/InvoiceSheet-Refactoring-Plan.md)

The InvoiceSheet component refactoring breaks down a large 539-line component into smaller, more maintainable pieces.

**Documentation:**
- [Refactoring Plan](./invoice-sheet/InvoiceSheet-Refactoring-Plan.md) - Overview of the refactoring strategy
- [Step-by-Step Implementation](./invoice-sheet/InvoiceSheet-Refactoring-Steps.md) - Detailed implementation steps
- [Component README](./invoice-sheet/InvoiceSheet-README.md) - Documentation for the refactored component

**Implementation Guides:**
- [Main Component Guide](./invoice-sheet/RefactoredInvoiceSheet-Implementation-Guide.md) - Guide for the main container component
- [Preview Component Guide](./invoice-sheet/InvoicePreview-Implementation-Guide.md) - Guide for the preview component
- [Settings Component Guide](./invoice-sheet/InvoiceSettings-Implementation-Guide.md) - Guide for the settings components
- [Custom Hooks Guide](./invoice-sheet/InvoiceHooks-Implementation-Guide.md) - Guide for the custom hooks

### InvoiceModal Component (Archived)

The InvoiceModal component was initially planned for refactoring, but after analysis, it was determined that the component is not used in the application. Instead of refactoring, it has been archived.

**Documentation:**
- [Refactoring Plan](./invoice-modal/InvoiceModal-Refactoring-Plan.md) - Original refactoring plan (for reference)
- [Component README](./invoice-modal/InvoiceModal-README.md) - Documentation for the component

**Archiving Decision:**
- Component was not imported or used anywhere in the application
- The application uses InvoiceSheet instead (already refactored)
- Component has been moved to `app/components/archive` for future reference

## Refactoring Guidelines

For general refactoring guidelines, see:
- [Refactoring Rules](../RefactoringRules.md) - Comprehensive rules for refactoring
- [Large Files Checklist](../large-files-checklist.md) - List of large files that may need refactoring

## Tracking Progress

Refactoring progress is tracked in:
- [Refactoring Audit](../refactoring-audit.md) - Audit of code that needs refactoring
- [Refactoring Progress](../refactoring-progress.md) - Progress on current refactoring efforts
- [Refactoring Implementation Plan](../refactoring-implementation-plan.md) - Overall plan for refactoring work
