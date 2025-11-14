# Codebase Refactoring Audit

This document provides a comprehensive audit of files in the codebase that exceed 200 lines of code and require refactoring. For each file, we analyze the current issues and provide a detailed refactoring strategy following the project's refactoring guidelines.

## Table of Contents

1. [Order Management Components](#order-management-components)
   - [OrderFormModal.tsx](#orderformmodaltsx)
   - [OrdersTable.tsx](#orderstabletsx)
   - [OrderFilters.tsx](#orderfilterstsxs)
2. [Task Management Components](#task-management-components)
   - [TaskFormModal.tsx](#taskformmodaltsx)
   - [TaskGrid.tsx](#taskgridtsx)
3. [Dashboard Components](#dashboard-components)
   - [Orders Page](#orderspage)
4. [UI Components](#ui-components)
   - [ApprovalDialog.tsx](#approvaldialogtsxs)
   - [SummarySection.tsx](#summarysectiontsx)
5. [Implementation Timeline](#implementation-timeline)

## Order Management Components

### OrderFormModal.tsx

**File Path:** `app/components/orders/OrderFormModal.tsx`

**Current Issues:**
- Complex form handling with multiple tabs
- Mixed concerns for items, payments, and notes management
- Large amount of state management
- Exceeds 200-line limit

**Refactoring Recommendations:**

1. **Extract Form Sections:**
   - Create `OrderGeneralInfoForm.tsx` component
   - Create `OrderItemsForm.tsx` component 
   - Create `OrderPaymentsForm.tsx` component
   - Create `OrderNotesForm.tsx` component

2. **Create Custom Hooks:**
   - `useOrderForm.ts` for managing form state
   - `useOrderCalculations.ts` for total and balance calculations
   - `useOrderValidation.ts` for form validation logic

3. **Extract Types:**
   - Move types to dedicated types files
   - Create separate type definitions for different sections

4. **Potential Shadcn Component Replacements:**
   - Replace custom tabs with Shadcn `Tabs` component
   - Use Shadcn `Form` components for validation
   - Implement Shadcn `Dialog` for confirmation modals

### OrdersTable.tsx

**File Path:** `app/components/orders/OrdersTable.tsx`

**Current Issues:**
- Complex table rendering logic
- Multiple action handlers
- Mixed pagination and filtering concerns
- Exceeds 200-line limit

**Refactoring Recommendations:**

1. **Extract Components:**
   - Create `OrderTableHeader.tsx` component
   - Create `OrderTablePagination.tsx` component
   - Create `OrderTableFooter.tsx` component

2. **Create Custom Hooks:**
   - `useOrdersTableState.ts` for table state management
   - `useOrdersPagination.ts` for pagination logic
   - `useOrdersSelection.ts` for row selection

3. **Potential Shadcn Component Replacements:**
   - Replace custom table with Shadcn `Table` component
   - Use Shadcn `Pagination` for page navigation
   - Implement Shadcn `DropdownMenu` for actions

### OrderFilters.tsx

**File Path:** `app/components/orders/OrderFilters.tsx`

**Current Issues:**
- Complex filter state management
- Multiple filter types handled in one component
- Exceeds 200-line limit

**Refactoring Recommendations:**

1. **Extract Components:**
   - Create `OrderStatusFilter.tsx` component
   - Create `OrderDateFilter.tsx` component
   - Create `OrderSearchFilter.tsx` component

2. **Create Custom Hooks:**
   - `useOrderFilters.ts` for filter state management
   - `useFilterEffects.ts` for applying filters to data

3. **Potential Shadcn Component Replacements:**
   - Replace custom filters with Shadcn `Select` components
   - Use Shadcn `DatePicker` for date range selection
   - Implement Shadcn `Input` for search functionality

## Task Management Components

### TaskFormModal.tsx

**File Path:** `app/components/tasks/TaskFormModal.tsx`

**Current Issues:**
- Complex form state management
- Multiple date handling functions
- Mixed concerns for recurring tasks
- Exceeds 200-line limit

**Refactoring Recommendations:**

1. **Extract Components:**
   - Create `TaskBasicInfoForm.tsx` component
   - Create `TaskRecurrenceForm.tsx` component
   - Create `TaskAssignmentForm.tsx` component

2. **Create Custom Hooks:**
   - `useTaskForm.ts` for form state management
   - `useTaskRecurrence.ts` for recurring task logic
   - `useTaskDates.ts` for date handling functions

3. **Potential Shadcn Component Replacements:**
   - Replace custom form inputs with Shadcn `Form` components
   - Use Shadcn `DatePicker` for date selection
   - Implement Shadcn `Select` for assignment dropdown

### TaskGrid.tsx

**File Path:** `app/components/tasks/TaskGrid.tsx`

**Current Issues:**
- Complex status and priority handling
- Mixed concerns for task display and actions
- Utility functions embedded in component
- Exceeds 200-line limit

**Refactoring Recommendations:**

1. **Extract Components:**
   - Create `TaskCard.tsx` component
   - Create `TaskStatusBadge.tsx` component
   - Create `TaskPriorityBadge.tsx` component
   - Create `TaskActions.tsx` component

2. **Extract Utilities:**
   - Create `task-status.utils.ts` for status-related functions
   - Create `task-priority.utils.ts` for priority-related functions
   - Create `task-date.utils.ts` for date-related functions

3. **Potential Shadcn Component Replacements:**
   - Replace custom cards with Shadcn `Card` components
   - Use Shadcn `Badge` for status and priority indicators
   - Implement Shadcn `DropdownMenu` for actions

## Dashboard Components

### OrdersPage.tsx

**File Path:** `app/dashboard/orders/page.tsx`

**Current Issues:**
- Complex state management for filters and modals
- Mixed concerns for orders and tasks
- Multiple modal states
- Exceeds 200-line limit

**Refactoring Recommendations:**

1. **Extract Components:**
   - Create `OrdersTab.tsx` component
   - Create `TasksTab.tsx` component
   - Create `OrderMetricsCards.tsx` component

2. **Create Custom Hooks:**
   - `useOrdersPageState.ts` for page state management
   - `useTasksPageState.ts` for tasks tab state
   - `useModalState.ts` for modal management

3. **Extract Context:**
   - Create `OrdersPageContext.tsx` for state sharing
   - Implement context provider pattern

4. **Potential Shadcn Component Replacements:**
   - Replace custom tabs with Shadcn `Tabs` component
   - Use Shadcn `Card` for metric cards
   - Implement Shadcn `Dialog` for all modals

## UI Components

### ApprovalDialog.tsx

**File Path:** `app/components/ui/approval-dialog.tsx`

**Current Issues:**
- Complex dialog with multiple states
- Mixed concerns for different approval types
- Exceeds 200-line limit

**Refactoring Recommendations:**

1. **Extract Components:**
   - Create `ApprovalDialogHeader.tsx` component
   - Create `ApprovalDialogForm.tsx` component
   - Create `ApprovalDialogFooter.tsx` component

2. **Create Custom Hooks:**
   - `useApprovalDialog.ts` for dialog state management
   - `useApprovalSubmission.ts` for form submission logic

3. **Potential Shadcn Component Replacements:**
   - Use Shadcn `Dialog` as the base component
   - Implement Shadcn `Form` for validation
   - Use Shadcn `RadioGroup` for reason selection

### SummarySection.tsx

**File Path:** `app/components/home/SummarySection.tsx`

**Current Issues:**
- Multiple formatting functions
- Mixed concerns for displaying different data types
- Complex conditional rendering
- Exceeds 200-line limit

**Refactoring Recommendations:**

1. **Extract Components:**
   - Create `SummarySectionHeader.tsx` component
   - Create `SummarySectionList.tsx` component
   - Create `SummarySectionFooter.tsx` component

2. **Extract Utilities:**
   - Create `formatting.utils.ts` for currency and date formatting
   - Create `status.utils.ts` for status class generation

3. **Create Custom Hooks:**
   - `useSummaryDisplay.ts` for display logic
   - `useShowMore.ts` for "Show More" functionality

4. **Potential Shadcn Component Replacements:**
   - Use Shadcn `Card` for the summary container
   - Implement Shadcn `Table` for data display
   - Use Shadcn `Badge` for status indicators

## Implementation Timeline

The refactoring will be implemented in phases to ensure minimal disruption to ongoing development:

1. **Phase 1: Utility Extraction (Week 1)**
   - Extract all utility functions into dedicated files
   - Create reusable formatting and helper functions
   - Implement shared types

2. **Phase 2: Custom Hooks (Week 2)**
   - Create custom hooks for state management
   - Refactor components to use the new hooks
   - Test hook functionality

3. **Phase 3: Component Extraction (Weeks 3-4)**
   - Break down large components into smaller ones
   - Update imports and dependencies
   - Ensure proper prop passing

4. **Phase 4: Shadcn Integration (Week 5)**
   - Replace custom UI elements with Shadcn components
   - Update styling to maintain consistency
   - Test component interactions

5. **Phase 5: Testing and Documentation (Week 6)**
   - Comprehensive testing of refactored components
   - Update documentation to reflect new structure
   - Final review and adjustments 