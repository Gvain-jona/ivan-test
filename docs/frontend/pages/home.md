# Home Page Implementation Guide

## Overview
The Home Page is the central dashboard for all users, providing a concise, actionable overview of the system status. It features role-specific content with quick metrics, pending invoices, and summaries from various modules.

## Layout Structure
The Home Page uses a vertical stack layout with the following sections:

1. **Quick Metrics** (Role-specific cards)
2. **Pending Invoices** (Separate highlighted section)
3. **Summaries** (Module-specific sections: Orders, Expenses, Material Purchases, Personal To-Do)

## Dynamic Content Rules
- **Default Row Counts**: 
  - Desktop (>1200px): 10 rows per section
  - Mobile/Small Screens (<1200px): 3 rows per section
- **"Show More" Behavior**: 
  - Loads +5 rows per click (e.g., 10 → 15 → 20)
  - Button disappears when no more records are available

## Role-Based Content

### Admin View
- **Quick Metrics** (4 Cards):
  - Today's Orders (clickable to Analytics)
  - Today's Expenses (clickable to Analytics)
  - Today's Material Purchases (clickable to Analytics)
  - Pending Tasks (clickable to Analytics)
- **Pending Invoices**: Full access
- **Summaries**: All four sections (Orders, Expenses, Material Purchases, Personal To-Do)

### Manager View
- **Quick Metrics** (3 Cards):
  - Today's Orders (clickable to Analytics)
  - Today's Expenses (clickable to Analytics)
  - Pending Tasks (clickable to Analytics)
- **Pending Invoices**: Full access
- **Summaries**: Three sections (Orders, Expenses, Personal To-Do)

### Employee View
- **Quick Metrics** (1 Card):
  - Your Pending Tasks (not clickable - no Analytics access)
- **Pending Invoices**: Filtered to accessible orders only
- **Summaries**: Two sections (Orders - filtered to accessible items, Personal To-Do)

## Detailed Section Specifications

### Quick Metrics
- **Layout**: Horizontal row (desktop), stacked (mobile)
- **Card Design**: 
  - Title (e.g., "Today's Orders")
  - Value (e.g., "5 Orders")
  - Click behavior: Navigates to relevant Analytics section (Admin/Manager only)
- **Loading State**: Skeleton loaders (gray rectangles: 200px × 100px)

### Pending Invoices
- **Header**: "Pending Invoices" with "View All" button (redirects to Orders with "Pending Payment" filter)
- **Table Columns**: Order Number, Client, Date, Amount, Action
- **Row Style**: Orange highlight for emphasis
- **Actions**: "View" button only (redirects to specific order)
- **Loading State**: Skeleton rows (3-10 based on screen size)

### Orders Summary
- **Header**: "Orders Overview" with "Add Order" and "View All" buttons
- **Table Columns**: Order Number, Client, Date, Status, Action
- **Actions**: "View" button only (redirects to specific order)
- **Loading State**: Skeleton rows (3-10 based on screen size)

### Expenses Summary
- **Header**: "Expenses Overview" with "Add Expense" and "View All" buttons
- **Table Columns**: Date, Description, Amount, Action
- **Actions**: "View" button only (redirects to specific expense)
- **Loading State**: Skeleton rows (3-10 based on screen size)

### Material Purchases Summary
- **Header**: "Material Purchases Overview" with "Add Purchase" and "View All" buttons
- **Table Columns**: Date, Supplier, Material, Cost, Action
- **Actions**: "View" button only (redirects to specific purchase)
- **Loading State**: Skeleton rows (3-10 based on screen size)

### Personal To-Do Summary
- **Header**: "Personal To-Do Overview" with "Add Task" and "View All" buttons
- **Table Columns**: Task Name, Due Date, Status, Actions
- **Actions**: "View" button and "Mark Complete" button
- **Loading State**: Skeleton rows (3-10 based on screen size)

## Action Buttons Specifications

### "View All" Button
- **Style**: Green button, top right of section header
- **Behavior**: Redirects to full page for that module

### "Add" Buttons
- **Style**: Green button, top right of section header
- **Behavior**: Opens relevant modal (Add Order, Add Expense, Add Purchase, Add Task)

### Row Action Buttons
- **"View" Button**: Green, opens detailed view of the item
- **"Mark Complete" Button**: Green (tasks only), updates task status

### "Show More" Button
- **Style**: Green button, bottom center of section
- **Behavior**: Loads +5 rows, disappears if no more rows available
- **Text**: "Show More"

## Loading States
- **Page Load**: Centered spinner during initial page load
- **Section Load**: Skeleton loaders for each section
  - Cards: Gray rectangles
  - Tables: 3-10 gray rows (depending on screen size)

## Error Handling
- **Toast Messages**: For general errors (e.g., "Failed to load pending invoices")
  - Position: Top-right
  - Style: Red background for errors, green for success
  - Behavior: Auto-dismiss after 5 seconds, manual dismiss with "×"

## Mobile Adaptations
- **Quick Metrics**: Stacked vertically
- **Tables**: Horizontally scrollable
- **Layout**: All sections stacked vertically
- **Row Count**: Default 3 rows per section

## Implementation Notes
1. Fetch data for each section independently to allow partial loading
2. Implement lazy loading for "Show More" functionality
3. Apply role-based filtering before rendering content
4. Cache quick metrics data for improved performance 