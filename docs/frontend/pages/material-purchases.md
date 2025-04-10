# Material Purchases Page Implementation Guide

## Overview
The Material Purchases Page is accessible only to Admins and provides a system for tracking material acquisitions and related tasks. It includes features for managing suppliers, handling installment payments, and generating reminders.

## Layout Structure
The Material Purchases Page uses a tabbed layout with two main views:

1.  **Material Purchases Tab** (Default): Data table showing all purchase records.
2.  **Tasks Tab**: Card view showing tasks related to material purchases.

Each tab has its own header with actions, filters, and content area.

## Tab Structure

### Material Purchases Tab
- **Header**:
  - Quick Metrics: "Total Purchases Today: X USH" (clickable to Analytics).
  - Add Purchase Button (Green, opens modal).
  - Filters: Date Range, Supplier, Payment Status (Paid, Partially Paid, Unpaid).
- **Content**: Table of purchases with expandable rows.

### Tasks Tab
- **Header**:
  - Add Task Button (Green, opens modal - task is linked to a purchase if context allows).
  - Filters: Priority, Due Date, Status.
- **Content**: Cards for tasks related to material purchases (e.g., "Follow up on Purchase #789").

## Dynamic Content Rules
- **Default Row Counts**:
  - Desktop (>1200px): 10 rows per table.
  - Mobile/Small Screens (<1200px): 3 rows per table.
- **"Show More" Behavior**:
  - Loads +5 rows per click.
  - Button disappears when no more records are available.

## Role-Based Access

### Admin View
- **Material Purchases Tab**: Full access to all purchases.
  - View, Edit, Delete (with approval).
  - Mark Paid.
  - Add/Edit/View Installments (payments).
- **Tasks Tab**: Full access to all purchase-related tasks.
  - View, Edit, Delete, Mark Complete.
  - Full Filter Access.

### Manager View
- No access to Material Purchases page (redirected to Home Page).

### Employee View
- No access to Material Purchases page (redirected to Home Page).

## Detailed Table Specifications (Material Purchases Tab)

### Main Table Columns
- Date
- Supplier (Smart Dropdown)
- Item (Smart Dropdown)
- Quantity
- Total Amount
- Amount Paid
- Balance
- Installment (Yes/No)
- Payment Status (color-coded: Green=Paid, Orange=Partially Paid, Red=Unpaid)
- Actions (3-dot menu)

### Subrow Content (Expandable)
- Payment Details: List of payments (Payment #, Amount, Date, Type).
- Notes (if present).

### Actions Menu (3-dot)
- **Admin Only**:
  - View Purchase
  - Edit Purchase
  - Delete Purchase (requires approval)
  - Mark Paid (if Partially Paid/Unpaid)

## Detailed Card Specifications (Tasks Tab)

### Task Card Elements
- **Card Title**: Purchase Item/Supplier (e.g., "Paper from Supplier A") or linked Purchase ID.
- **Card Content**:
  - Task Title (e.g., "Pay installment").
  - Description (Note if available).
  - Due Date.
  - Priority (color-coded).
  - Status (Pending, Completed).
- **Card Actions**:
  - View Linked Purchase (redirects to Purchase view).
  - Mark Complete (checkbox).
  - Edit Task.
  - Delete Task (requires approval).

## Modal Specifications

### Add/Edit Material Purchase Modal
- **General Info Section**:
  - Date (Date Picker).
  - Supplier (Smart Dropdown: user history, searchable, add new).
  - Item (Smart Dropdown: user history, searchable, add new).
  - Quantity (Input).
  - Unit Price (Input).
  - Total Amount (Auto-calculated: Quantity \u00d7 Unit Price).
  - Installments (Toggle: On/Off - Default: On).
- **Payments Section** (Visible if Installments=On):
  - Multi-entry (add/remove payments).
  - Fields: Amount, Date, Payment Type (Dropdown: Cash, Bank Transfer, Mobile Payment).
  - Auto-Calculations: Amount Paid, Balance.
  - Optional Structured Payments: Number of Installments, Amount per Installment, Start Date, Frequency (Weekly, Monthly, Quarterly).
- **Notes Section**:
  - Multi-entry (add/remove notes).
  - Fields: Type (Dropdown: Info, Follow-Up, Urgent, Internal), Text.

### View Material Purchase Modal
- **General Info**: Date, Supplier, Item, Quantity, Total Amount, Amount Paid, Balance, Installment (Yes/No).
- **Payments Section**: Minimal Cards for each payment (Amount, Date, Type).
  - Quick Add: Inline form (Amount, Date, Type, "Add" button).
- **Notes Section**: List of notes (Type, Text, Timestamp).
  - Quick Add/Edit: Inline forms.
- **Timeline**: Logs actions (e.g., "Purchase added," "Payment added $100").

### Add/Edit Task Modal (Context: Material Purchase)
- **Fields**:
  - Title.
  - Description.
  - Due Date (Date Picker).
  - Priority (Dropdown: High, Medium, Low).
  - Linked Purchase (Dropdown of purchases, searchable - prefilled).
  - Status (Dropdown: Pending, Completed).

## Installment Reminders
- **Mechanism**: Combined approach using Personal Tasks and Home Page section.
  - **Personal Tasks**: Auto-generated task per installment (e.g., "Pay Installment: $50 to Supplier A", Priority: Medium/High).
  - **Home Page Section**: "Critical Weekly To-Do" widget shows installments due within 7 days or overdue.
- **Notifications**: In-app and push notifications for reminders.

## Loading States
- **Tab Switch**: Centered spinner.
- **Table/Cards Load**: Skeleton loaders.
- **Modal Open**: Spinner overlay.

## Error Handling
- **Toast Messages**: General errors.
- **Form Validation**: Inline errors.

## Mobile Adaptations
- **Tabs**: Horizontal scroll.
- **Table View**: Card-based layout.
- **Task Cards**: Stacked vertically.
- **Modals**: Full-screen.
- **Filters**: Separate modal.

## Implementation Notes
1.  Validate purchase amounts on the server.
2.  Cache supplier and item dropdown data (based on user history).
3.  Installment reminder tasks should be generated automatically when structured payments are set up.
4.  Implement indexing for purchase queries (Date, Supplier, Item).
5.  Task generation from notes requires confirmation. 