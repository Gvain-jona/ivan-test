# Supabase Setup for Ivan Prints Business Management System

This directory contains all the Supabase configuration and setup files for the Ivan Prints Business Management System.

## Directory Structure

- `/migrations`: Contains SQL migration files for database schema setup
- `/seed`: Contains seed data for initial database setup
- `/functions`: Contains Supabase Edge Functions for API functionality

## Database Schema

The system uses the following main tables:

- `users`: User accounts with role-based permissions (admin, manager, employee)
- `clients`: Customer information
- `categories`: Product categories
- `items`: Products and services offered
- `suppliers`: Material suppliers
- `orders`: Customer orders
- `order_items`: Items within each order
- `order_payments`: Payments made for orders
- `expenses`: Business expenses
- `expense_payments`: Payments made for expenses
- `material_purchases`: Inventory purchases
- `material_purchase_payments`: Payments for material purchases
- `tasks`: Tasks assigned to users
- `notes`: Notes attached to orders, expenses, etc.
- `notifications`: System notifications
- `settings`: System-wide settings
- `employee_access`: Access control for employees
- `approvals`: Approval workflow for specific actions

## Edge Functions

The system uses the following edge functions:

- `get-dashboard-data.ts`: Retrieves summary data for the dashboard
- `get-orders.ts`: Retrieves order data with filtering and pagination
- `create-or-update-order.ts`: Creates or updates an order

## Setup Instructions

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Start Supabase Local Development

```bash
supabase start
```

### 3. Apply Migrations

```bash
supabase db reset
```

This will apply all migrations in the migrations directory in order.

### 4. Deploy Edge Functions

```bash
supabase functions deploy get-dashboard-data
supabase functions deploy get-orders
supabase functions deploy create-or-update-order
```

### 5. Create Environment Variables

Create a `.env.local` file in your project root with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Row Level Security (RLS) Policies

The database uses Row Level Security to ensure data access is properly controlled:

- Admins have full access to all data
- Managers have limited access to sensitive financial data
- Employees can only access data related to their assigned tasks and authorized items

## Data Backup

Regular database backups should be configured in the Supabase dashboard under:
Project Settings > Database > Backups

## Troubleshooting

If you encounter any issues:

1. Check the Supabase logs using `supabase logs`
2. Verify your connection string in the environment variables
3. Ensure all migrations have been applied successfully

For more help, refer to the [Supabase documentation](https://supabase.com/docs). 