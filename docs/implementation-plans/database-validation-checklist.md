# Database Schema Validation Checklist

## Purpose
This document provides a checklist for validating the database schema for the Ivan Prints Business Management System. The goal is to ensure that all tables, relationships, constraints, indexes, and RLS policies are correctly defined before integrating the database with the frontend.

## Schema Validation

### Tables Structure

- [x] **users**
  - Primary Key: `id` (UUID)
  - Required fields: `name`, `email`, `password`, `role`, `status`
  - Constraints: `role` CHECK constraint, `status` CHECK constraint

- [x] **clients**
  - Primary Key: `id` (UUID)
  - Required fields: `name`

- [x] **categories**
  - Primary Key: `id` (UUID)
  - Required fields: `name`

- [x] **items**
  - Primary Key: `id` (UUID)
  - Required fields: `name`
  - Foreign Keys: `category_id` → categories(id)

- [x] **orders**
  - Primary Key: `id` (UUID)
  - Required fields: `client_id`, `created_by`, `date`, `total_amount`, `status`, `payment_status`
  - Foreign Keys: `client_id` → clients(id), `created_by` → users(id)
  - Constraints: `status` CHECK constraint, `payment_status` CHECK constraint

- [x] **order_items**
  - Primary Key: `id` (UUID)
  - Required fields: `order_id`, `item_id`, `category_id`, `quantity`, `unit_price`, `total_amount`
  - Foreign Keys: `order_id` → orders(id), `item_id` → items(id), `category_id` → categories(id)

- [x] **order_payments**
  - Primary Key: `id` (UUID)
  - Required fields: `order_id`, `amount`, `payment_date`, `payment_type`
  - Foreign Keys: `order_id` → orders(id)
  - Constraints: `payment_type` CHECK constraint

- [x] **suppliers**
  - Primary Key: `id` (UUID)
  - Required fields: `name`

- [x] **expenses**
  - Primary Key: `id` (UUID)
  - Required fields: `category`, `description`, `amount`, `total_amount`, `date`
  - Foreign Keys: `created_by` → users(id)

- [x] **expense_payments**
  - Primary Key: `id` (UUID)
  - Required fields: `expense_id`, `amount`, `payment_date`, `payment_type`
  - Foreign Keys: `expense_id` → expenses(id)
  - Constraints: `payment_type` CHECK constraint

- [x] **material_purchases**
  - Primary Key: `id` (UUID)
  - Required fields: `supplier_id`, `date`, `description`, `quantity`, `total_amount`
  - Foreign Keys: `supplier_id` → suppliers(id), `created_by` → users(id)

- [x] **material_purchase_payments**
  - Primary Key: `id` (UUID)
  - Required fields: `material_purchase_id`, `amount`, `payment_date`, `payment_type`
  - Foreign Keys: `material_purchase_id` → material_purchases(id)
  - Constraints: `payment_type` CHECK constraint

- [x] **tasks**
  - Primary Key: `id` (UUID)
  - Required fields: `title`, `priority`, `status`
  - Foreign Keys: `assigned_to` → users(id), `created_by` → users(id)
  - Constraints: `priority` CHECK constraint, `status` CHECK constraint

- [x] **notes**
  - Primary Key: `id` (UUID)
  - Required fields: `type`, `text`
  - Foreign Keys: `created_by` → users(id)

- [x] **notifications**
  - Primary Key: `id` (UUID)
  - Required fields: `user_id`, `type`, `message`, `status`
  - Foreign Keys: `user_id` → users(id)
  - Constraints: `status` CHECK constraint

- [x] **settings**
  - Primary Key: `id` (UUID)
  - Required fields: `key`, `value`
  - Constraints: `key` UNIQUE constraint

- [x] **approvals**
  - Primary Key: `id` (UUID)
  - Required fields: `requester_id`, `action`, `item_type`, `item_id`, `status`
  - Foreign Keys: `requester_id` → users(id), `approver_id` → users(id)
  - Constraints: `status` CHECK constraint

- [x] **sessions**
  - Primary Key: `id` (UUID)
  - Required fields: `user_id`, `expires_at`
  - Foreign Keys: `user_id` → users(id)

### Indexes

- [x] **users_email_idx** on users(email)
- [x] **orders_created_by_idx** on orders(created_by)
- [x] **tasks_assigned_to_idx** on tasks(assigned_to)
- [x] **material_purchases_supplier_id_idx** on material_purchases(supplier_id)
- [x] **expenses_created_by_idx** on expenses(created_by)
- [x] **items_category_id_idx** on items(category_id)

### Row Level Security (RLS)

- [x] RLS enabled on all tables
- [x] **users**
  - Admin can do anything with users
  - Users can see themselves
  - Managers can see all users but can only modify employees

- [x] **clients**
  - Admin and managers can do anything with clients
  - Employees can only view clients

- [x] **categories** and **items**
  - Admin and managers can do anything
  - Employees can only view

- [x] **suppliers**
  - Admin and managers can do anything
  - Employees can only view

- [x] **orders**, **order_items**, and **order_payments**
  - Admin and managers have full access
  - Employees can view all orders but only modify those they created

- [x] **expenses** and **expense_payments**
  - Admin and managers have full access
  - Employees can only view expenses

- [x] **material_purchases** and **material_purchase_payments**
  - Admin have full access
  - Managers have limited access
  - Employees can only view

- [x] **tasks**
  - Admin and managers can see all tasks
  - Employees can see tasks assigned to them
  - Task creators can modify their own tasks

- [x] **notes**
  - Admin and managers can see all notes
  - Employees can see notes related to their items
  - Note creators can modify their own notes

- [x] **notifications**
  - Users can only see their own notifications

- [x] **settings**
  - Only admin can manage settings

- [x] **approvals**
  - Admin can see all approvals
  - Managers can see approvals related to their team
  - Employees can see their own requests

## Database Functions

- [x] **begin_transaction**, **commit_transaction**, **rollback_transaction** for transaction management
- [x] **update_order_totals** for automatically calculating order amounts
- [x] **update_expense_totals** for automatically calculating expense amounts
- [x] **update_material_purchase_totals** for automatically calculating purchase amounts
- [x] **create_notification** for generating user notifications

## Migration Order Verification

- [x] Migration 1: Initial schema (`20250331000000_initial_schema.sql`)
- [x] Migration 2: Database functions (`20250331000001_database_functions.sql`)
- [x] Migration 3: Material payments schema (`20250331000002_create_material_payments.sql`)
- [x] Migration 4: Additional database functions (`20250331000003_database_functions.sql`)
- [x] Migration 5: Row level security policies (`20250331000004_row_level_security.sql`)
- [x] Migration 6: Order functions (`20250403081629_orders_functions.sql`)
- [x] Migration 7: Order indexes (`20250403081630_orders_indexes.sql`)

## Seed Data Verification

- [x] Seed data includes sample entries for all tables
- [x] Referential integrity is maintained in the seed data
- [x] Different user roles are represented in the seed data
- [x] Various statuses and types are represented to test all features

## Testing Queries

### Users and Authentication
```sql
-- Test user authentication
SELECT * FROM users WHERE email = 'gavinjona1@gmail.com' AND password = '$2a$10$Vl4MG7iZ.wLpZJqHF7qXI.HZq6M0CoM1xDUl1UUejLMo.zH3RUk.G' LIMIT 1;

-- Test user permissions
SELECT * FROM users WHERE role = 'admin';
```

### Orders and Related Data
```sql
-- Test retrieving an order with related data
SELECT o.*, c.name as client_name
FROM orders o
JOIN clients c ON o.client_id = c.id
WHERE o.id = 'e1111111-1111-1111-1111-111111111111';

-- Test retrieving order items
SELECT oi.*, i.name as item_name, cat.name as category_name
FROM order_items oi
JOIN items i ON oi.item_id = i.id
JOIN categories cat ON oi.category_id = cat.id
WHERE oi.order_id = 'e1111111-1111-1111-1111-111111111111';

-- Test order payments
SELECT * FROM order_payments WHERE order_id = 'e1111111-1111-1111-1111-111111111111';
```

### Tasks
```sql
-- Test retrieving tasks with assigned users
SELECT t.*, u.name as assigned_user_name
FROM tasks t
LEFT JOIN users u ON t.assigned_to = u.id
WHERE t.status = 'pending'
ORDER BY t.due_date ASC;
```

## Next Steps

1. Run all migrations on a fresh database to verify they apply cleanly
2. Verify all Row Level Security policies work as expected with different user roles
3. Test all database functions to ensure they execute correctly
4. Validate all foreign key constraints with sample data
5. Test complicated queries to ensure performance is acceptable

By completing this checklist, we ensure that the database schema is ready for integration with the frontend application. 