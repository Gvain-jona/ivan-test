# OrderViewSheet Component Refactoring Plan

This document outlines a comprehensive plan for refactoring the `OrderViewSheet.tsx` component, which currently has 465 lines of code. The goal is to break it down into smaller, more manageable components while maintaining all existing functionality.

## Table of Contents

1. [Component Analysis](#component-analysis)
2. [Refactoring Strategy](#refactoring-strategy)
3. [Component Breakdown](#component-breakdown)
4. [Implementation Steps](#implementation-steps)
5. [Testing Strategy](#testing-strategy)
6. [Documentation Updates](#documentation-updates)

## Component Analysis

The `OrderViewSheet.tsx` component is responsible for:

1. Displaying order details in a side panel (using OrderSheet)
2. Showing different tabs for order details, items, payments, and notes
3. Allowing users to add payments to an order
4. Providing actions like Edit Order and Generate Invoice
5. Displaying different UI based on user role

Key issues:

- The component is too large (465 lines)
- It handles multiple responsibilities
- The tab content sections are complex and could be separate components
- Payment form logic is mixed with UI rendering
- Event handlers are embedded within the main component

## Refactoring Strategy

After analyzing the component and considering the successful refactoring of OrderFormSheet, we'll apply the following approach:

1. **Follow the OrderFormSheet Pattern**: Use a similar structure to the OrderFormSheet component, which has already been successfully refactored
2. **Extract Tab Content Components**: Break down each tab into its own component
3. **Extract Payment Form Logic**: Move payment form logic to a custom hook
4. **Apply Single Responsibility Principle**: Ensure each component does one thing well

## Component Breakdown

We'll break down the component into the following structure:

```
app/components/orders/order-view/
├── index.tsx                    # Main export (for backward compatibility)
├── OrderViewSheet.tsx           # Main container (simplified)
├── OrderDetailsTab.tsx          # Details tab content
├── OrderItemsTab.tsx            # Items tab content
├── OrderPaymentsTab.tsx         # Payments tab content
├── OrderNotesTab.tsx            # Notes tab content
├── PaymentForm.tsx              # Payment form component
├── hooks/                       # Custom hooks
│   └── useOrderPayments.ts      # Payment form state and logic
└── types.ts                     # Shared types and interfaces
```

This structure mirrors the successful approach used in OrderFormSheet, where each tab's content is extracted into its own component, but kept in the same directory for simplicity.

## Implementation Steps

### Step 1: Create Directory Structure

1. Create the directory structure as outlined above
2. Set up the initial files with basic exports

### Step 2: Extract Types

1. Create `types.ts` for component-specific types:
   - Define `OrderViewSheetProps` interface
   - Define props interfaces for each tab component
   - Define props interface for the payment form

### Step 3: Create Custom Hooks

1. Create `hooks/useOrderPayments.ts` hook:
   - Move payment form state (amount, method, notes)
   - Handle payment form submission logic
   - Handle payment calculations

### Step 4: Create Tab Content Components

1. Create `OrderDetailsTab.tsx`:
   - Extract the details tab content
   - Include status, order info, and payment info sections

2. Create `OrderItemsTab.tsx`:
   - Extract the items tab content
   - Include the items table

3. Create `OrderPaymentsTab.tsx`:
   - Extract the payments tab content
   - Include the payments table
   - Import and use the PaymentForm component

4. Create `OrderNotesTab.tsx`:
   - Extract the notes tab content
   - Include the notes timeline

### Step 5: Create Payment Form Component

1. Create `PaymentForm.tsx`:
   - Extract the payment form UI
   - Use the useOrderPayments hook for state and logic
   - Handle form submission

### Step 6: Refactor Main Component

1. Update `OrderViewSheet.tsx`:
   - Import and use the new tab components
   - Maintain tab state management
   - Pass necessary props to child components

2. Create `index.tsx` for backward compatibility:
   - Re-export the main component

### Step 7: Update Imports and References

1. Update any imports in other files that reference the original component
2. Ensure all paths are correct

## Testing Strategy

To ensure the refactoring doesn't break existing functionality:

1. **Manual Testing**:
   - Test the order view flow
   - Verify all tabs work correctly
   - Test payment form functionality
   - Check that the UI appears identical to the original

2. **Regression Testing**:
   - Ensure the component works with the same props as before
   - Verify that all user interactions produce the same results

3. **Edge Cases**:
   - Test with different order data
   - Test with various user roles
   - Test error handling scenarios

## Documentation Updates

1. Update component JSDoc comments to reflect new structure
2. Create README.md in the order-view directory explaining:
   - Component purpose
   - Component structure
   - Usage examples
   - Available props and options

3. Update any existing documentation that references the original component

## Implementation Checklist

- [ ] Create directory structure
- [ ] Extract types to separate file
- [ ] Create useOrderPayments hook
- [ ] Implement OrderDetailsTab component
- [ ] Implement OrderItemsTab component
- [ ] Implement PaymentForm component
- [ ] Implement OrderPaymentsTab component
- [ ] Implement OrderNotesTab component
- [ ] Refactor main OrderViewSheet component
- [ ] Create index.tsx for backward compatibility
- [ ] Update imports and references
- [ ] Test all functionality
- [ ] Update documentation

## Benefits of This Refactoring

1. **Improved Maintainability**: Smaller, focused components are easier to understand and modify
2. **Better Code Organization**: Logical separation of concerns
3. **Enhanced Reusability**: Components and hooks can be reused elsewhere
4. **Easier Testing**: Isolated components are easier to test
5. **Simplified Reasoning**: Each file has a clear, single responsibility
6. **Reduced Cognitive Load**: Developers can focus on one aspect at a time
7. **Consistent Patterns**: Following the same pattern as OrderFormSheet makes the codebase more consistent

By following this refactoring plan, we'll transform the large, monolithic OrderViewSheet component into a well-organized, maintainable set of components while preserving all existing functionality.
