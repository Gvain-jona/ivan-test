# Data Relationships and Flow Map

This document outlines the relationships between pages and data flow throughout the Ivan Prints Business Management System.

## Core Data Entities

### 1. Users
- **Primary Data**: `id`, `name`, `email`, `role` (Admin/Manager/Employee), `pin`, `verification_code`, `code_expiry`, `is_verified`, `devices`, `failed_attempts`, `status`
- **Used By**:
  - Authentication (login, verification)
  - Settings > User Management
  - Profile Page (device management)
  - All pages (role-based access control)
  - Notifications (user-specific alerts)

### 2. Orders
- **Primary Data**: `order_id`, `client_id`, `date`, `status`, `total_amount`, `amount_paid`, `balance`, `items` (array)
- **Related Data**: 
  - `order_items`: `item_id`, `category_id`, `quantity`, `unit_price`, `total_amount`, `profit_amount`, `labor_amount`
  - `order_payments`: `payment_id`, `amount`, `date`, `type`
  - `order_notes`: `note_id`, `type`, `text`, `timestamp`
- **Used By**:
  - Orders Page (main data)
  - Home Page (summaries, pending invoices)
  - Analytics (profit calculations, trends)
  - Personal To-Do (order-related tasks)
  - Notifications (order updates)

### 3. Expenses
- **Primary Data**: `expense_id`, `date`, `category`, `total_amount`, `amount_paid`, `balance`, `installment`, `vat`
- **Related Data**:
  - `expense_payments`: `payment_id`, `amount`, `date`, `type`
  - `expense_notes`: `note_id`, `type`, `text`, `timestamp`
- **Used By**:
  - Expenses Page (main data)
  - Home Page (summaries)
  - Analytics (expense analysis)
  - Personal To-Do (expense-related tasks)
  - Notifications (expense reminders)

### 4. Material Purchases
- **Primary Data**: `purchase_id`, `date`, `supplier_id`, `item`, `quantity`, `total_amount`, `amount_paid`, `balance`, `installment`
- **Related Data**:
  - `purchase_payments`: `payment_id`, `amount`, `date`, `type`
  - `purchase_notes`: `note_id`, `type`, `text`, `timestamp`
- **Used By**:
  - Material Purchases Page (main data)
  - Home Page (summaries)
  - Analytics (purchase analysis)
  - Personal To-Do (purchase-related tasks)
  - Notifications (payment reminders)

### 5. Tasks
- **Primary Data**: `task_id`, `title`, `description`, `due_date`, `priority`, `status`, `linked_item_type` (Order/Expense/Purchase), `linked_item_id`
- **Related Data**:
  - `subtasks`: `subtask_id`, `task_id`, `title`, `due_date`, `status`
- **Used By**:
  - Personal To-Do Page (main view)
  - Orders Page (task tab)
  - Expenses Page (task tab)
  - Material Purchases Page (task tab)
  - Home Page (task summaries)
  - Notifications (task reminders)

### 6. Notifications
- **Primary Data**: `notification_id`, `user_id`, `type`, `message`, `push_message`, `data`, `status`, `snooze_until`, `created_at`
- **Used By**:
  - Notifications Page (main view)
  - All pages (notification bell)
  - Settings (notification preferences)

## Page-Specific Data Flow

### Home Page
- **Receives**:
  - Recent orders from Orders
  - Recent expenses from Expenses (Admins/Managers)
  - Recent material purchases from Material Purchases (Admins)
  - Pending tasks from Tasks
  - Pending invoices from Orders
- **Sends**:
  - Redirects to specific pages on "View" actions
  - Opens modals for "Add" actions

### Orders Page
- **Receives**:
  - Order data from Orders entity
  - Client data from Clients entity
  - Task data from Tasks entity (task tab)
- **Sends**:
  - Order updates to Analytics
  - Task creation to Tasks
  - Notifications for order events
  - Updates to Home Page summaries

### Expenses Page
- **Receives**:
  - Expense data from Expenses entity
  - Task data from Tasks entity (task tab)
- **Sends**:
  - Expense updates to Analytics
  - Task creation to Tasks
  - Notifications for expense events
  - Updates to Home Page summaries

### Material Purchases Page
- **Receives**:
  - Purchase data from Material Purchases entity
  - Supplier data from Suppliers entity
  - Task data from Tasks entity (task tab)
- **Sends**:
  - Purchase updates to Analytics
  - Task creation to Tasks
  - Notifications for purchase events
  - Updates to Home Page summaries

### Personal To-Do Page
- **Receives**:
  - Task data from Tasks entity
  - Linked item data (Orders/Expenses/Purchases)
- **Sends**:
  - Task updates to linked items
  - Notifications for task events
  - Updates to Home Page summaries

### Analytics Page (Admins/Managers)
- **Receives**:
  - Order data for profit calculations
  - Expense data for analysis
  - Purchase data for analysis
  - Task data for completion metrics
- **Sends**:
  - Export data (CSV/PDF)
  - Custom report templates to Settings

### Settings Page (Admins/Managers)
- **Receives**:
  - User data for management
  - Configuration data for all modules
  - Analytics templates
- **Sends**:
  - User updates to Authentication
  - Configuration updates to all modules
  - Notifications for system events

### Notifications Page
- **Receives**:
  - Notification data from all modules
  - User preferences from Settings
- **Sends**:
  - Status updates (read/unread)
  - Snooze settings
  - Redirects to relevant pages

### Profile Page
- **Receives**:
  - User device data
  - Role-based access settings
- **Sends**:
  - Device management updates
  - Redirects to Settings (Admins/Managers)

## Data Flow for Common Actions

### 1. Adding a New Order
1. Orders Page creates order record
2. Updates client history
3. Calculates profit using Settings configuration
4. Creates tasks if notes require follow-up
5. Sends notifications to relevant users
6. Updates Home Page summaries
7. Updates Analytics metrics

### 2. Task Completion
1. Updates task status in Tasks entity
2. Updates linked item if applicable
3. Sends notification to relevant users
4. Updates Home Page summaries
5. Updates Analytics completion metrics

### 3. Failed Login Attempt
1. Updates user's failed_attempts count
2. Generates notification for Admins/Managers
3. May trigger account lockout
4. Updates device tracking

## Real-time Updates
- Home Page summaries
- Notification counts
- Task status changes
- Order/Expense/Purchase status changes

## Caching Strategy
1. **Quick Access Data** (cached 5 minutes):
   - Home Page summaries
   - Analytics overview metrics
   - Notification counts

2. **Semi-Static Data** (cached 1 hour):
   - Client list
   - Supplier list
   - Category lists
   - User roles and permissions

3. **Configuration Data** (cached until changed):
   - Settings
   - Report templates
   - Company branding

## Data Cleanup Rules
1. **Notifications**:
   - Delete after 90 days
   - Archive read notifications after 30 days

2. **Tasks**:
   - Archive completed tasks after 30 days
   - Keep linked tasks as long as parent item exists

3. **Audit Logs**:
   - Keep for 1 year
   - Include user actions, system events, and security events

## Security Considerations
1. **Role-Based Access**:
   - Admins: Full access
   - Managers: Limited settings access
   - Employees: Restricted to assigned items

2. **Data Visibility**:
   - Financial data hidden from Employees
   - Profit metrics visible to Admins/Managers only
   - Client data visible based on order access

3. **Sensitive Data**:
   - No financial details in push notifications
   - PIN stored with encryption
   - Session management with 2-hour timeout 