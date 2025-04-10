# Notifications Page Implementation Guide

## Overview
The Notifications Page serves as a central hub for users to view system-generated alerts, reminders, and updates relevant to their role and actions within the application.

## Layout Structure
- **Header**: Page Title ("Notifications"), Actions (e.g., "Mark All as Read").
- **Content**: A list or feed of notification items, typically ordered newest first.
- **Filters**: Options to filter notifications (e.g., All, Unread).

## Dynamic Content Rules
- **Initial Load**: Display the latest 20-25 notifications.
- **Lazy Loading/Pagination**: Load older notifications as the user scrolls down or clicks a "Load More" button.

## Role-Based Access
- **All Roles (Admin, Manager, Employee)**: Users see notifications relevant to them.
  - Examples:
    - Task assignments or updates.
    - Order status changes (if involved).
    - Overdue reminders (tasks, payments).
    - Mentions (if implemented).
- **Admin-Specific Notifications**: May include system alerts, user management actions (e.g., new user invitation sent), approval requests needing review.

## Detailed Notification Item Specifications
- **Structure**: Each notification is typically a card or list item.
- **Elements**:
  - **Icon**: Relevant icon based on notification type (e.g., bell, task icon, order icon).
  - **Message**: Clear and concise text describing the event (e.g., "Order #123 has been marked as Completed", "You have been assigned Task: Prepare Design Mockup", "Installment payment for Purchase #456 is due tomorrow").
  - **Timestamp**: Time since the notification was generated (e.g., "5 minutes ago", "Yesterday at 2:15 PM").
  - **Unread Indicator**: Visual cue (e.g., a dot, different background color) for unread notifications.
  - **Context Link (Optional)**: A link to navigate directly to the related item (e.g., the specific order, task, or purchase).
  - **Actions (Optional/On Hover)**: Mark as Read/Unread, Dismiss.

## Filters & Actions
- **Filters**: Buttons or tabs for "All" and "Unread".
- **Actions**:
  - "Mark All as Read" button.
  - Individual notification actions (Mark Read/Unread, Dismiss).

## Loading States
- **Initial Page Load**: Skeleton loaders for notification items.
- **Loading More**: Spinner at the bottom of the list.
- **Action Execution (Mark Read/Dismiss)**: Subtle visual feedback (e.g., temporary fade-out or loading indicator on the item).

## Error Handling
- **Toast Messages**: For errors fetching notifications or performing actions.
- **Empty State**: Message displayed if the user has no notifications ("No notifications yet.") or no unread notifications when the "Unread" filter is active.

## Mobile Adaptations
- **Layout**: Single-column list view.
- **Actions**: May be revealed via swipe gestures or accessed through a menu per notification item.

## Implementation Notes
1.  **Real-time Updates**: Consider using Supabase Realtime subscriptions to push new notifications to the client without requiring a page refresh, updating a badge indicator in the main navigation.
2.  **Notification Schema**: Design a flexible database table for notifications (e.g., `user_id`, `message`, `type`, `related_entity_id`, `related_entity_type`, `is_read`, `created_at`).
3.  **Read Status**: Efficiently update the `is_read` status both individually and in bulk.
4.  **Performance**: Ensure efficient querying, especially with potentially large numbers of notifications. Index relevant columns (`user_id`, `created_at`, `is_read`).
5.  **Cleanup**: Implement a strategy for eventually archiving or deleting very old notifications to manage database size. 