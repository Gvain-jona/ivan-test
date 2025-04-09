# Large Files Checklist

This document lists all files in the codebase that exceed 250 lines of code. These files are primary candidates for refactoring or code splitting to improve maintainability.

## Files by Size (Descending Order)

- [ ] **api.ts** (670 lines) - `app/lib/api.ts`
- [x] **InvoiceSheet.tsx** (539 lines) - `app/components/orders/InvoiceSheet.tsx` - Refactored into smaller components
- [x] **OrderViewSheet.tsx** (465 lines) - `app/components/orders/OrderViewSheet.tsx` - Refactoring in progress
- [x] **seed.ts** (461 lines) - `app/lib/supabase/seed.ts` - Left as is (data initialization file)
- [x] **InvoiceModal.tsx** (458 lines) - `app/components/archive/InvoiceModal.tsx` - Archived (not in use)
- [x] **OrderViewModal.tsx** (446 lines) - `app/components/archive/OrderViewModal.tsx` - Archived (not in use)
- [ ] **TaskFilters.tsx** (361 lines) - `app/components/tasks/TaskFilters.tsx`
- [ ] **SideNav.tsx** (339 lines) - `app/components/navigation/SideNav.tsx`
- [ ] **chart.tsx** (329 lines) - `app/components/ui/chart.tsx`
- [ ] **TaskFormModal.tsx** (321 lines) - `app/components/tasks/TaskFormModal.tsx`
- [ ] **OrdersTable.tsx** (310 lines) - `app/components/orders/OrdersTable.tsx`
- [ ] **useOrders.ts** (280 lines) - `app/hooks/useOrders.ts`
- [ ] **OrderFilters.tsx** (272 lines) - `app/components/orders/OrderFilters.tsx`
- [ ] **OrdersPageContext.tsx** (260 lines) - `app/dashboard/orders/_context/OrdersPageContext.tsx`
- [ ] **SummarySection.tsx** (256 lines) - `app/components/home/SummarySection.tsx`
- [ ] **TaskGrid.tsx** (255 lines) - `app/components/tasks/TaskGrid.tsx`

## Current Status

The following files have been addressed:
- **InvoiceSheet.tsx** - Refactored into smaller components
- **InvoiceModal.tsx** - Archived (not in use)
- **OrderViewModal.tsx** - Archived (not in use)
- **seed.ts** - Left as is (data initialization file)
- **OrderViewSheet.tsx** - Refactoring in progress

The remaining files will be left as they are for now, as they are not as critical for the current phase of refactoring.

## Refactoring Suggestions

Files with high line counts might benefit from:

1. Breaking down into smaller, more focused components
2. Extracting utility functions to separate files
3. Using composition to reduce complexity
4. Implementing custom hooks for shared logic
5. Applying design patterns to improve code organization

Use this checklist to track your refactoring progress and prioritize which files to address first.
