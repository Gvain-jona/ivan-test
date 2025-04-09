# Codebase Refactoring Master Implementation Plan

This document outlines the comprehensive implementation plan for refactoring the Ivan Prints Business Management System codebase to comply with the 200-line file size limit. The plan is structured in phases to ensure systematic, low-risk refactoring while maintaining existing functionality.

## Overview

The codebase audit has identified several files that exceed the 200-line limit and require refactoring. This plan organizes the refactoring work into logical phases, with dependencies and priorities taken into account.

## Implementation Phases

The refactoring will be implemented in six phases:

### Phase 1: Utility Function Extraction (Week 1)

**Objective:** Extract all utility functions from components into dedicated utility files.

**Tasks:**
1. Create utility directories structure
2. Extract formatting utilities
   - Date formatting
   - Currency formatting
   - Status text formatting
3. Extract styling utilities
   - Status color utilities
   - Priority color utilities
4. Extract validation utilities
5. Add tests for utility functions

**Files Affected:**
- `app/utils/orders/order-form.utils.ts` (new)
- `app/utils/tasks/task-status.utils.ts` (new)
- `app/utils/tasks/task-priority.utils.ts` (new)
- `app/utils/tasks/task-date.utils.ts` (new)
- `app/utils/formatting.utils.ts` (new)

**Dependencies:** None

**Priority:** High

### Phase 2: Shared UI Components (Week 2)

**Objective:** Create reusable UI components for common elements.

**Tasks:**
1. Create badge components
   - Status badges
   - Priority badges
   - Payment status badges
2. Create reusable table components
   - Table headers
   - Table pagination
   - Table actions
3. Create common form components
   - Form sections
   - Form fields with validation

**Files Affected:**
- `app/components/ui/badges/StatusBadge.tsx` (new)
- `app/components/ui/badges/PriorityBadge.tsx` (new)
- `app/components/ui/table/TableHeader.tsx` (new)
- `app/components/ui/table/TablePagination.tsx` (new)
- `app/components/ui/form/FormSection.tsx` (new)

**Dependencies:** Phase 1

**Priority:** High

### Phase 3: Custom Hooks (Week 3)

**Objective:** Extract complex state management into custom hooks.

**Tasks:**
1. Create order-related hooks
   - `useOrderForm`
   - `useOrderItems`
   - `useOrderCalculations`
2. Create task-related hooks
   - `useTaskForm`
   - `useTaskRecurrence`
3. Create general-purpose hooks
   - `useModalState`
   - `usePagination`
   - `useFilters`

**Files Affected:**
- `app/hooks/orders/useOrderForm.ts` (new)
- `app/hooks/orders/useOrderItems.ts` (new)
- `app/hooks/orders/useOrderCalculations.ts` (new)
- `app/hooks/tasks/useTaskForm.ts` (new)
- `app/hooks/tasks/useTaskRecurrence.ts` (new)
- `app/hooks/ui/useModalState.ts` (new)
- `app/hooks/ui/usePagination.ts` (new)
- `app/hooks/ui/useFilters.ts` (new)

**Dependencies:** None (can run in parallel with Phase 2)

**Priority:** High

### Phase 4: OrderFormModal Refactoring (Week 4)

**Objective:** Refactor the OrderFormModal component to meet the 200-line limit.

**Tasks:**
1. Create component directory structure
2. Extract form section components
   - General info form
   - Items form
   - Payments form
   - Notes form
3. Create tabbed interface component
4. Update main component to use new structure
5. Add re-export from original location

**Files Affected:**
- `app/components/orders/OrderFormModal/index.tsx` (new)
- `app/components/orders/OrderFormModal/OrderGeneralInfoForm.tsx` (new)
- `app/components/orders/OrderFormModal/OrderItemsForm.tsx` (new)
- `app/components/orders/OrderFormModal/OrderPaymentsForm.tsx` (new)
- `app/components/orders/OrderFormModal/OrderNotesForm.tsx` (new)
- `app/components/orders/OrderFormModal/OrderFormTabs.tsx` (new)
- `app/components/orders/OrderFormModal.tsx` (updated to re-export)

**Dependencies:** Phases 1-3

**Priority:** Medium

**Detailed Implementation Plan:** [OrderFormModal Implementation Plan](implementation-plans/OrderFormModal.md)

### Phase 5: TaskGrid Refactoring (Week 4)

**Objective:** Refactor the TaskGrid component to meet the 200-line limit.

**Tasks:**
1. Create component directory structure
2. Extract task card component
3. Extract badge components
4. Extract actions component
5. Update main component to use new structure
6. Add re-export from original location

**Files Affected:**
- `app/components/tasks/TaskGrid/index.tsx` (new)
- `app/components/tasks/TaskGrid/TaskCard.tsx` (new)
- `app/components/tasks/TaskGrid/TaskStatusBadge.tsx` (new)
- `app/components/tasks/TaskGrid/TaskPriorityBadge.tsx` (new)
- `app/components/tasks/TaskGrid/TaskActions.tsx` (new)
- `app/components/tasks/TaskGrid.tsx` (updated to re-export)

**Dependencies:** Phases 1-3

**Priority:** Medium

**Detailed Implementation Plan:** [TaskGrid Implementation Plan](implementation-plans/TaskGrid.md)

### Phase 6: Other Components Refactoring (Weeks 5-6)

**Objective:** Refactor remaining components that exceed the 200-line limit.

**Tasks:**
1. Refactor OrdersTable component
2. Refactor OrderFilters component
3. Refactor ApprovalDialog component
4. Refactor SummarySection component
5. Refactor OrdersPage component

**Files Affected:**
- `app/components/orders/OrdersTable.tsx`
- `app/components/orders/OrderFilters.tsx`
- `app/components/ui/approval-dialog.tsx`
- `app/components/home/SummarySection.tsx`
- `app/dashboard/orders/page.tsx`

**Dependencies:** Phases 1-3

**Priority:** Medium

## Shadcn UI Component Integration

Throughout the refactoring process, we will replace custom UI elements with their Shadcn UI equivalents:

1. **Dialogs:** Replace custom dialogs with Shadcn `Dialog` component
2. **Tabs:** Replace custom tabs with Shadcn `Tabs`, `TabsList`, `TabsContent` components
3. **Forms:** Replace form inputs with Shadcn `Form` components
4. **Tables:** Replace custom tables with Shadcn `Table` components
5. **Badges:** Replace custom badges with Shadcn `Badge` component
6. **Cards:** Replace custom cards with Shadcn `Card` components

## Testing Strategy

For each refactored component:

1. **Unit Testing:**
   - Create unit tests for utility functions
   - Test component rendering with various props
   - Test component interactions

2. **Integration Testing:**
   - Test component integration with parent components
   - Verify data flow through multiple components

3. **Visual Testing:**
   - Verify visual appearance matches original
   - Check for any styling regressions

4. **Accessibility Testing:**
   - Verify keyboard navigation works correctly
   - Check for correct ARIA attributes

## Documentation Strategy

For each refactored component:

1. **Component Documentation:**
   - Add JSDoc comments to component and functions
   - Document props and their purpose
   - Document component behavior and edge cases

2. **Directory README:**
   - Create README.md files for component directories
   - Explain component purpose and relationship to others
   - Provide usage examples

3. **Implementation Notes:**
   - Document any non-obvious implementation details
   - Explain complex business logic

## Progress Tracking

Progress will be tracked in the following ways:

1. **Implementation Checklist:**
   - Update the implementation checklist with completed tasks
   - Mark each component as refactored when complete

2. **Pull Requests:**
   - Create pull requests for each phase of work
   - Include detailed descriptions of changes
   - Reference relevant documentation

3. **Changelog:**
   - Update the changelog with each significant refactoring
   - Document any issues encountered and their solutions

## Risk Management

The following risks have been identified:

1. **Functionality Regression:**
   - Mitigated by incremental changes and thorough testing
   - Each component will be refactored and tested independently

2. **Performance Impact:**
   - Monitor performance before and after refactoring
   - Ensure no significant performance degradation

3. **Schedule Delays:**
   - Phase work logically to minimize blockers
   - Prioritize high-impact refactoring first

4. **Developer Coordination:**
   - Clearly document refactoring status
   - Communicate changes to all team members

## Post-Refactoring Review

After completing all refactoring work:

1. **Code Review:**
   - Conduct comprehensive code review
   - Verify adherence to project standards

2. **Performance Audit:**
   - Measure performance metrics
   - Compare with pre-refactoring baseline

3. **Documentation Review:**
   - Verify all components are properly documented
   - Update project-level documentation

4. **Cleanup:**
   - Remove temporary re-export files
   - Resolve any remaining TODOs

## Conclusion

This refactoring plan provides a structured approach to breaking down large components into smaller, more maintainable pieces while ensuring consistent patterns and practices across the codebase. By following this plan, we will achieve a more maintainable, testable, and scalable codebase that adheres to the 200-line file size limit. 