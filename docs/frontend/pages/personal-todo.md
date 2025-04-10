# Personal To-Do Page Implementation Guide

## Overview
The Personal To-Do Page provides a dedicated space for users to manage their personal tasks, separate from system-generated tasks (like order or purchase-related tasks). It's accessible to all user roles.

## Layout Structure
The page uses a simple, focused layout:

- **Header**: Contains the page title, an "Add Task" button, and filters.
- **Content**: Displays tasks in a card-based view.

## Dynamic Content Rules
- **Default Card Counts**:
  - Desktop (>1200px): 10 task cards visible initially.
  - Mobile/Small Screens (<1200px): 5 task cards visible initially.
- **"Show More" Behavior**:
  - Loads +5 tasks per click.
  - Button disappears when no more tasks are available.

## Role-Based Access
- **Admin, Manager, Employee**: All roles have full access to *their own* personal tasks.
  - Create, View, Edit, Delete, Mark Complete.
  - Cannot view or manage personal tasks of other users.

## Detailed Card Specifications (Personal Tasks)

### Task Card Elements
- **Card Title**: Task Title.
- **Card Content**:
  - Description (if provided).
  - Due Date.
  - Priority (color-coded: High, Medium, Low).
  - Status (Pending, Completed - indicated by checkbox state and visual style).
- **Card Actions**:
  - Mark Complete (Checkbox on the card).
  - Edit Task (Opens modal).
  - Delete Task (Requires confirmation).

## Filters
- Priority (High, Medium, Low).
- Due Date (Today, This Week, Overdue, Custom Range).
- Status (Pending, Completed).

## Modal Specifications

### Add/Edit Personal Task Modal
- **Fields**:
  - Title (Required).
  - Description (Textarea, optional).
  - Due Date (Date Picker, optional).
  - Priority (Dropdown: High, Medium, Low - Default: Medium).
  - Status (Dropdown: Pending, Completed - Default: Pending).

## Loading States
- **Initial Load**: Skeleton loaders for task cards.
- **"Show More" Load**: Spinner appears below the last card.
- **Modal Open**: Spinner overlay.
- **Action Completion (Mark Complete, Delete)**: Subtle loading indicator on the specific card/action button.

## Error Handling
- **Toast Messages**: For errors during task creation, update, or deletion.
- **Form Validation**: Inline errors for the 'Title' field in the modal.
- **Empty State**: Message displayed when no tasks match the current filters or if the user has no tasks ("You have no tasks yet. Add one!").

## Mobile Adaptations
- **Task Cards**: Stacked vertically, full width.
- **Filters**: Accessed via a dedicated button opening a bottom sheet or modal.
- **Modals**: Full-screen.

## Implementation Notes
1.  Ensure strict data separation: Users should only ever see their own personal tasks.
2.  Use RLS (Row Level Security) in Supabase to enforce this data separation.
3.  Provide visual feedback when a task is marked complete (e.g., strikethrough, dimmed color).
4.  Consider sorting options (e.g., by Due Date, Priority). 