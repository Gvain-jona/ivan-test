# Orders Page Implementation Guide

## Overview
The Orders Page is a core component of the system that manages both order data and related tasks through a tabbed interface. It supports 30 orders/day (up to 70 during peak seasons) and provides role-specific access to order information.

## Layout Structure
The Orders Page uses a tabbed layout with two main views:

1. **Orders Tab** (Default): Data table showing all orders
2. **Tasks Tab**: Card view showing tasks related to orders

Each tab has its own header with actions, filters, and content area.

## Tab Structure

### Orders Tab
- **Header**:
  - Quick Metrics (Admins/Managers): "Total Orders Today: X" (clickable to Analytics)
  - Add Order Button (Green, opens modal)
  - Filters: Date Range, Client, Status, Payment Status
- **Content**: Table of orders with expandable rows

### Tasks Tab
- **Header**:
  - Quick Metrics (Admins/Managers/employees): "Total task Today: X" 
  - Add Task Button (Green, opens modal)
  - Filters: Priority, Due Date, Status
- **Content**: Cards for tasks related to orders

## Dynamic Content Rules
- **Default Row Counts**:
  - Desktop (>1200px): 10 rows per table
  - Mobile/Small Screens (<1200px): 3 rows per table
- **"Show More" Behavior**:
  - Loads +5 rows per click (e.g., 10 → 15 → 20)
  - Button disappears when no more records are available

## Role-Based Access

### Admin View
- **Orders Tab**: Full access to all orders
  - View, Edit, Delete (with approval), Duplicate
  - Quick Status Updates (Paused → In Progress → Completed → Delivered)
  - Generate/View Invoice
- **Tasks Tab**: Full access to all order-related tasks
  - View, Edit, Delete, Mark Complete
  - Full Filter Access

### Manager View
- **Orders Tab**: Same as Admin
- **Tasks Tab**: Same as Admin

### Employee View
- **Orders Tab**: Limited to accessible items (set in Settings > User Management > Employee Access)
  - View Only (no Edit, Delete, or Duplicate)
  - No Quick Status Updates
  - Generate/View Invoice for accessible orders
- **Tasks Tab**: Limited to tasks for accessible orders
  - View, Mark Complete (no Edit or Delete)
  - Limited Filter Access

## Detailed Table Specifications (Orders Tab)

### Main Table Columns
- Order Number
- Client Name
- Date
- Total Amount
- Cash Paid
- Balance
- Payment Status (color-coded: Green=Paid, Orange=Partially Paid, Red=Unpaid)
- Order Status (color-coded: Red=Paused, Yellow=In Progress, Green=Completed, Blue=Delivered, Gray=Cancelled)
- Actions (3-dot menu)

### Subrow Content (Expandable)
- Order Items: Category, Item, Size, Qty, Unit Price, Total Cost
- Notes (if present)

### Actions Menu (3-dot)
- **Admin/Manager**:
  - View Order
  - Edit Order
  - Delete Order (requires approval)
  - Duplicate Order
  - Generate/View Invoice (toggles if invoice exists)
  - Quick Status Updates
- **Employee**:
  - View Order
  - Generate/View Invoice (toggles if invoice exists)

## Detailed Card Specifications (Tasks Tab)

### Task Card Elements
- **Card Title**: Order Number (e.g., "Order #123")
- **Card Content**:
  - Task Title (e.g., "Follow up on payment")
  - Description (Note if available)
  - Due Date
  - Priority (color-coded: Red=High, Yellow=Medium, Green=Low)
  - Status (Pending, Completed)
- **Card Actions**:
  - View Linked Order (redirects to Order view)
  - Mark Complete (checkbox)
  - Edit Task (Admin/Manager only)
  - Delete Task (Admin/Manager only, requires approval)

## Modal Specifications

### Add/Edit Order Modal
- **General Info Section**:
  - Client Name (Smart Dropdown: searchable, past entries, add new)
  - Client Type (Dropdown: Individual, Business)
  - Order Date (Date Picker)
  - Order Status (Dropdown: Paused, In Progress, Completed, Delivered, Cancelled)
  - Payment Method (Dropdown: Cash, Bank Transfer, Mobile Payment)
  - **Auto-Calculations**:
    - Total Amount (sum of all items)
    - Cash Paid (sum of all payments)
    - Balance (Total Amount - Cash Paid)
- **Items Section**:
  - Multi-entry (add/remove items)
  - Fields: Category (Smart Dropdown), Item (Smart Dropdown), Size (Smart Dropdown), Qty, Unit Price, Total Cost (auto-calculated)
- **Payments Section**:
  - Multi-entry (add/remove payments)
  - Fields: Amount, Date, Payment Type
- **Notes Section**:
  - Multi-entry (add/remove notes)
  - Fields: Type (Dropdown: Info, Client Follow-Up, Urgent, Internal), Text

### View Order Modal
- **General Info**: Client Name, Order Date, Order Status, Payment Status, Total Amount, Cash Paid, Balance, Order Number
- **Items Section**: Minimal Cards for each item (Item, Size, Qty, Unit Price, Total Cost)
  - Quick Add: Inline form for adding items
- **Payments Section**: Minimal Cards for each payment (Amount, Date, Type)
  - Quick Add: Inline form for adding payments
- **Notes Section**: List of notes (Type, Text, Timestamp)
  - Quick Add: Inline form for adding notes
- **Timeline**: Logs actions (Order created, Status changes, Payments)
- **Actions**: Generate/View Invoice button

### Add/Edit Task Modal
- **Fields**:
  - Title
  - Description
  - Due Date (Date Picker)
  - Priority (Dropdown: High, Medium, Low)
  - Linked Order (Dropdown of orders, searchable)
  - Status (Dropdown: Pending, Completed)
- **Recurring Options**:
  - Toggle: Recurring (Yes/No)
  - Frequency (if Yes): Daily, Weekly, Monthly
  - End Date (Optional)

## Loading States
- **Tab Switch**: Centered spinner during tab change
- **Table/Cards Load**: 
  - Skeleton loaders for table rows (3-10 depending on screen size)
  - Skeleton loaders for task cards (3-10 depending on screen size)
- **Modal Open**: Spinner overlay during data fetch

## Error Handling
- **Toast Messages**: For general errors (e.g., "Failed to load orders")
  - Position: Top-right
  - Style: Red background for errors, green for success
- **Form Validation**: Inline errors below each field
  - Client Name required
  - At least one item required
  - Quantity and Unit Price must be positive numbers

## Mobile Adaptations
- **Tabs**: Horizontal tabs at top of screen
- **Table View**: Card-based layout with minimal info (Client Name, Order Status, Payment Status)
  - Expandable to show full details
- **Task Cards**: Stacked vertically, simplified layout
- **Modals**: Full-screen with scrollable sections
- **Filters**: Open in a separate modal

## Implementation Notes
1. Always validate order totals on the server side
2. Cache frequently used dropdown data (clients, items)
3. Use optimistic UI updates for status changes
4. Implement proper indexing for order queries (Order Date, Client ID, Status)
5. Task generation from notes should be immediate (generate task on note save)
6. Subrow data should be lazy-loaded only on expansion 