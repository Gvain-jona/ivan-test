# Settings Page Implementation Guide

## Overview
The Settings Page allows users to configure various aspects of the application and their profile. Available settings depend on the user's role.

## Layout Structure
- **Header**: Page Title ("Settings").
- **Navigation**: Vertical navigation menu on the left (Desktop) or accessible via a dropdown/menu icon (Mobile).
- **Content Area**: Displays the forms and options for the selected settings category.

## Settings Categories & Role-Based Access

### 1. Profile Settings (All Roles)
- **Fields**:
  - Name (View Only - managed by Admin)
  - Email (View Only - managed by Admin)
  - Change Password (Requires current password, new password, confirm new password).
- **Actions**: Save Changes (for password).

### 2. Application Settings (Admin Only)
- **Sub-categories**:
  - **General**:
    - Business Name
    - Business Address
    - Currency Symbol (e.g., UGX)
  - **Order Management**:
    - Default Payment Terms (Dropdown: Net 30, Net 15, Due on Receipt)
    - Order Number Prefix (e.g., "INV-")
  - **Notification Preferences**:
    - Toggle switches for various system notifications (e.g., New Order, Overdue Task, Low Material Stock - *future*).
- **Actions**: Save Changes for each sub-category.

### 3. User Management (Admin Only)
- **View**: Table displaying all users.
  - Columns: Name, Email, Role, Status (Active/Invited/Inactive).
  - Actions per Row: Edit Role, Deactivate/Reactivate User, Resend Invitation.
- **Actions**: Invite New User (Button opens modal).
- **Invite New User Modal**:
  - Fields: Email, Role (Dropdown: Manager, Employee).
  - Action: Send Invitation.

### 4. Data Management (Admin Only)
- **Sections**:
  - **Categories**: Manage categories for Expenses (Add, Edit, Delete).
  - **Items/Services**: Manage standard items/services for Orders (Add, Edit, Delete - includes Name, Default Price).
  - **Suppliers**: Manage supplier information (Add, Edit, Delete - includes Name, Contact Info).
  - **Materials**: Manage material types for Purchases (Add, Edit, Delete).
- **UI**: Each section likely uses a simple table with Add/Edit/Delete actions opening modals.
- **Actions**: Add New (Button for each section), Edit/Delete (per item).

## Form Handling
- **Saving**: Changes are saved per section/category using a dedicated "Save Changes" button.
- **Feedback**: Toast notifications confirm successful saves or report errors.
- **Validation**: Inline validation for required fields, password complexity, email format, etc.

## Loading States
- **Initial Page Load**: Skeleton loader for the navigation menu and content area.
- **Switching Categories**: Spinner overlay on the content area.
- **Saving Changes**: Loading indicator on the "Save Changes" button.
- **User/Data Table Load**: Skeleton loaders for table rows.

## Error Handling
- **Toast Messages**: For save errors, invitation errors, general failures.
- **Inline Form Errors**: For validation issues within settings forms.
- **Confirmation Dialogs**: For critical actions like Deactivating Users or Deleting Data Categories.

## Mobile Adaptations
- **Navigation**: Collapsed into a menu icon or dropdown.
- **Forms**: Stacked vertically, full width.
- **Tables (User/Data Management)**: May switch to a card-based list view or require horizontal scrolling.

## Implementation Notes
1.  **Security**: All settings changes must be validated server-side, especially role changes and user management actions.
2.  **Password Change**: Implement secure password hashing and verification.
3.  **User Invitations**: Use a secure token-based invitation system with expiration.
4.  **Data Deletion**: Consider soft deletes for categories/items to avoid breaking historical records. Provide clear warnings before permanent deletion.
5.  **Configuration Storage**: Store application settings in a dedicated configuration table or structure. 