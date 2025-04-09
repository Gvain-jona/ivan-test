# Mock Data Scripts for Ivan Prints Business Management System

This directory contains scripts to populate the database with mock data for testing purposes.

## Prerequisites

Before running these scripts, you need to have:

1. A Supabase project set up
2. The database schema created (run the migration files)
3. **At least one user created in the auth.users table**

## Creating a User

You need to create a user before running these scripts. You can do this through:

1. The Supabase dashboard:
   - Go to Authentication > Users
   - Click "Add User"
   - Enter an email and password
   - Click "Create User"

2. Or using the Supabase Auth API in your application

## Scripts Overview

The scripts should be run in the following order:

1. **profiles_mock_data.sql**: Creates profiles for existing auth users
2. **clients_mock_data.sql**: Creates mock clients
3. **orders_mock_data.sql**: Creates mock orders, items, payments, etc.

## Running the Scripts

### Option 1: Run All Scripts in Order

Use the PowerShell script:

```
.\run-all-mock-data.ps1
```

This will run all the scripts in the correct order.

### Option 2: Run Individual Scripts

Run each script individually in the correct order:

```
.\run-profiles-mock-data.ps1
.\run-clients-mock-data.ps1
.\run-orders-mock-data.ps1
```

### Option 3: Run in SQL Editor

You can also run the SQL files directly in the Supabase SQL Editor:

1. Open the Supabase SQL Editor
2. Copy and paste the contents of each SQL file
3. Run them in the correct order

## What the Scripts Do

### profiles_mock_data.sql

- Creates a profile for an existing auth user
- Sets up auth sessions for the user

### clients_mock_data.sql

- Creates 10 mock clients with varied profiles
- Links them to the admin user

### orders_mock_data.sql

- Drops the payment_method column from the orders table
- Creates 5 categories and 15 items
- Creates 20 orders with varied statuses
- Adds 1-3 items to each order
- Creates payments for orders
- Adds notes for some orders

## Troubleshooting

If you encounter errors:

1. **No users in auth.users table**: Create a user as described above
2. **No profiles found**: Run the profiles_mock_data.sql script first
3. **No clients found**: Run the clients_mock_data.sql script before orders_mock_data.sql

## Notes

- The scripts are designed to be idempotent, meaning you can run them multiple times without creating duplicate data
- They check for existing data and handle it appropriately
- The orders_mock_data.sql script drops the payment_method column from the orders table as requested
