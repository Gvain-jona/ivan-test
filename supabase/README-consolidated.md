# Consolidated Supabase Schema for Ivan Prints Business Management System

This document describes the consolidated database schema for the Ivan Prints Business Management System. The consolidation was performed to clean up and standardize the database structure, ensuring it aligns with the frontend requirements.

## Consolidation Process

The consolidation process involved:

1. Analyzing the existing migration files to identify inconsistencies and redundancies
2. Examining the frontend code to understand the data requirements
3. Creating consolidated migration files that align with the frontend needs
4. Updating the seed file to work with the consolidated schema
5. Archiving outdated migration files

## Directory Structure

- `/migrations`: Contains SQL migration files for database schema setup
  - `/migrations/archive`: Contains archived migration files that are no longer used
- `/seed-consolidated.sql`: Contains consolidated seed data for initial database setup

## Database Schema

### Authentication System

The authentication system uses Supabase Auth with custom extensions:

- `profiles`: Extends Supabase Auth users with custom fields
  - PIN-based authentication (4-digit PIN)
  - Email verification with verification codes
  - Device tracking for multi-device support
  - Role-based access control (admin, manager, staff)

- `auth_sessions`: Tracks custom session data for PIN re-entry requirements

### Orders System

The orders system consists of three main tables:

- `orders`: Main table for tracking client orders
  - Includes client_type (regular, contract)
  - Tracks payment status and total amounts
  - Supports various order statuses (pending, in_progress, paused, completed, delivered, cancelled)

- `order_items`: Items included in each order
  - Includes size field (small, medium, large, custom)
  - Denormalizes item_name and category_name for performance
  - Automatically calculates total_amount based on quantity and unit_price

- `order_payments`: Payments made for each order
  - Supports various payment methods
  - Includes notes field for payment details

### Triggers and Functions

The schema includes several triggers and functions to maintain data integrity:

- `update_order_item_names()`: Updates denormalized item and category names
- `update_order_totals()`: Updates order total amounts when items change
- `update_order_payment_status()`: Updates payment status when payments change

## Setup Instructions

### 1. Apply Consolidated Migrations

```bash
# Start Supabase
npx supabase start

# Apply migrations
npx supabase db reset
```

### 2. Seed the Database

```bash
# Run the consolidated seed file
.\run-consolidated-seed.ps1
```

## Notes on Schema Changes

### Orders Table Changes

- Added `client_type` field to distinguish between regular and contract clients
- Updated `status` check constraint to include all required statuses
- Changed `balance` to be a computed column based on total_amount and amount_paid
- Added `payment_method` field for tracking the primary payment method
- Added `notes` JSONB field for storing order notes

### Order Items Table Changes

- Added `size` field to track item sizes
- Added denormalized `item_name` and `category_name` fields for performance
- Changed `total_amount` to be a computed column based on quantity and unit_price
- Added `profit_amount` and `labor_amount` fields for financial tracking

### Order Payments Table Changes

- Renamed `payment_type` to `payment_method` for consistency
- Added `notes` field for payment details
- Updated payment method options to match frontend requirements
