# Expenses Page Implementation Guide

## Overview
The Expenses Page is dedicated to tracking and managing business expenses for Admins and Managers. It features a tabbed interface to separate expense data from related tasks. Employees do not have access to this page.

## Layout Structure
The Expenses Page uses a tabbed layout with two main views:

1.  **Expenses Tab** (Default): Data table showing all expenses.
2.  **Tasks Tab**: Card view showing tasks related to expenses.

Each tab has its own header with actions, filters, and content area.

## Tab Structure

### Expenses Tab
- **Header**:
  - Quick Metrics (Admins/Managers): "Total Expenses Today: X USH" (clickable to Analytics).
  - Add Expense Button (Green, opens modal).
  - Filters: Date Range, Category.
- **Content**: Table of expenses with expandable rows.

### Tasks Tab
- **Header**:
  - Add Task Button (Green, opens modal - task is linked to an expense if context allows, otherwise general).
  - Filters: Priority, Due Date, Status.
- **Content**: Cards for tasks related to expenses (e.g., "Follow up on Expense #456").

## Dynamic Content Rules
- **Default Row Counts**:
  - Desktop (>1200px): 10 rows per table.
  - Mobile/Small Screens (<1200px): 3 rows per table.
- **"Show More" Behavior**:
  - Loads +5 rows per click (e.g., 10 \u2192 15 \u2192 20).
  - Button disappears when no more records are available.

## Role-Based Access

### Admin View
- **Expenses Tab**: Full access to all expenses.
  - View, Edit, Delete (with approval).
  - Add/Edit/View Installments (payments).
- **Tasks Tab**: Full access to all expense-related tasks.
  - View, Edit, Delete, Mark Complete.
  - Full Filter Access.

### Manager View
- **Expenses Tab**: Same as Admin.
- **Tasks Tab**: Same as Admin.

### Employee View
- No access to Expenses page (redirected to Home Page).

## Detailed Table Specifications (Expenses Tab)

### Main Table Columns
- Date
- Category (Smart Dropdown)
- Total Amount
- Amount Paid
- Balance
- Installment (Yes/No - based on if multiple payments exist or setup)
- VAT (Optional - display if entered)
- Actions (3-dot menu)

### Subrow Content (Expandable)
- Payment Details: List of payments (Payment #, Amount, Date, Type).
- Notes (if present).

### Actions Menu (3-dot)
- **Admin/Manager**:
  - View Expense
  - Edit Expense
  - Delete Expense (requires approval)

## Detailed Card Specifications (Tasks Tab)

### Task Card Elements
- **Card Title**: Expense Description (e.g., "Rent for March") or linked Expense ID.
- **Card Content**:
  - Task Title (e.g., "Follow up on payment").
  - Description (Note if available).
  - Due Date.
  - Priority (color-coded: Red=High, Yellow=Medium, Green=Low).
  - Status (Pending, Completed).
- **Card Actions**:
  - View Linked Expense (redirects to Expense view).
  - Mark Complete (checkbox).
  - Edit Task.
  - Delete Task (requires approval).

## Modal Specifications

### Add/Edit Expense Modal
- **General Info Section**:
  - Date (Date Picker).
  - Category (Smart Dropdown: Rent, Utilities, Salaries, Marketing, Equipment - customizable).
  - Total Amount (Input).
  - Installments (Toggle: On/Off - Default: On).
  - VAT (Optional Input: e.g., 16%).
- **Payments Section** (Visible if Installments=On):
  - Multi-entry (add/remove payments).
  - Fields: Amount, Date, Payment Type (Dropdown: Cash, Bank Transfer, Mobile Payment).
  - Auto-Calculations: Amount Paid, Balance.
  - Optional Structured Payments: Number of Installments, Amount per Installment, Start Date, Frequency (Weekly, Monthly, Quarterly).
- **Notes Section**:
  - Multi-entry (add/remove notes).
  - Fields: Type (Dropdown: Info, Follow-Up, Urgent, Internal), Text.
- **Recurring Expense Link**:
  - Note: Recurring expenses setup is handled in Personal To-Do Page, but this modal could link an existing recurring task if applicable.

### View Expense Modal
- **General Info**: Date, Category, Total Amount, Amount Paid, Balance, Installment (Yes/No), VAT (if entered).
- **Payments Section**: Minimal Cards for each payment (Amount, Date, Type).
  - Quick Add: Inline form (Amount, Date, Type, "Add" button), updates Amount Paid/Balance.
- **Notes Section**: List of notes (Type, Text, Timestamp).
  - Quick Add/Edit: Inline forms.
- **Timeline**: Logs actions (e.g., "Expense added," "Payment added $50").

### Add/Edit Task Modal (Context: Expense)
- **Fields**:
  - Title.
  - Description.
  - Due Date (Date Picker).
  - Priority (Dropdown: High, Medium, Low).
  - Linked Expense (Dropdown of expenses, searchable - prefilled if adding from expense context).
  - Status (Dropdown: Pending, Completed).

## Loading States
- **Tab Switch**: Centered spinner during tab change.
- **Table/Cards Load**: Skeleton loaders (3-10 depending on screen size).
- **Modal Open**: Spinner overlay during data fetch for View/Edit.

## Error Handling
- **Toast Messages**: General errors (e.g., "Failed to load expenses").
- **Form Validation**: Inline errors below each field (e.g., "Amount is required").

## Mobile Adaptations
- **Tabs**: Horizontal tabs at top.
- **Table View**: Card-based layout, expandable.
- **Task Cards**: Stacked vertically.
- **Modals**: Full-screen.
- **Filters**: Open in a separate modal.

## Implementation Notes
1.  Validate expense amounts on the server.
2.  Cache category dropdown data.
3.  Use optimistic UI updates for task completion.
4.  Implement proper indexing for expense queries (Date, Category).
5.  Task generation from notes (Follow-Up, Urgent, Internal) should trigger a pop-up confirmation before creating the task in the Personal To-Do Page (or linked here if explicitly expense-related). 