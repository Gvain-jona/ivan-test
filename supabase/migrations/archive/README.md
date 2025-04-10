# Archived Migration Files

This directory contains migration files that have been archived as part of the database schema consolidation process. These files are kept for reference but are no longer used in the active migration process.

## Archived Files

### Orders-Related Files

- `20250331000000_initial_schema.sql`: Initial schema definition that has been replaced by the consolidated schema
- `20250410000001_update_orders_schema.sql`: Updates to the orders table schema
- `20250410000002_update_order_items_schema.sql`: Updates to the order_items table schema
- `20250410000003_update_order_payments_schema.sql`: Updates to the order_payments table schema
- `20250410000004_create_order_notes_table.sql`: Creation of the order_notes table (now using notes table with type)
- `20250410000005_seed_orders_data.sql`: Seed data for orders (replaced by consolidated seed file)

### Auth-Related Files

- `20250407000001_auth_system_updates.sql`: Updates to the authentication system
- `20250407141458_clean_auth_setup.sql`: Clean auth setup with allowed emails
- `20250501000000_auth_system_consolidation.sql`: Initial consolidation of the authentication system
- `20250502000000_migrate_users_to_profiles.sql`: Migration of users to the profiles table
- `20250599000005_consolidated_auth_schema.sql`: Previous consolidated auth schema with custom extensions
- `20250700000000_fix_rls_policies.sql`: Fixes for RLS policies

## Consolidation Process

These files have been consolidated into the following main migration files:

1. `20250600000000_consolidated_orders_schema.sql`: Consolidated schema for orders, order_items, and order_payments
2. `20250800000000_supabase_auth_migration.sql`: New consolidated schema for the Supabase-based authentication system

The consolidation process involved:

1. Analyzing the existing migration files to identify inconsistencies and redundancies
2. Examining the frontend code to understand the data requirements
3. Creating consolidated migration files that align with the frontend needs
4. Updating the seed file to work with the consolidated schema
5. Archiving outdated migration files

## Notes

- The archived files are kept for reference and historical purposes
- The consolidated files should be used for all new development
- If you need to understand the evolution of the schema, these archived files provide that history
