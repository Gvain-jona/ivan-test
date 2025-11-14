# Seed.sql Fix Notes

## Issues Fixed

1. **Table References**: The main issue was that the seed.sql file was trying to truncate and insert data into tables that don't exist in the database schema:
   - `order_notes` table doesn't exist - the system uses the general `notes` table with a type/linked_item_type instead
   - `subtasks` table doesn't exist
   - `material_payments` table is actually named `material_purchase_payments`

2. **Column Names**: Several column names didn't match the schema:
   - In `order_payments`, it's `payment_date` and `payment_type` (not `date` and `type`)
   - Similar issues in other payment tables
   - Orders table was missing the `payment_status` column in the INSERT statement

3. **Enum Values**: Some enum values didn't match the schema constraints:
   - Order status values should be: 'pending', 'completed', 'canceled'
   - Task status values should be: 'pending', 'in-progress', 'completed'
   - Payment types should be: 'cash', 'bank_transfer', 'mobile_payment', 'cheque'

4. **Missing Tables/Fields**: The seed was trying to reference missing tables/fields:
   - Added proper references to `categories` and `items` tables for order items
   - Added proper table structure for expenses (including the `amount` field)

## Running the Seed File

To run the seed file manually, you can use:

```sql
-- In your SQL client, connect to your Supabase database and run:
\i /path/to/supabase/seed.sql
```

Or, if using the Supabase dashboard:

1. Open SQL Editor
2. Copy and paste the contents of the seed.sql file
3. Run the script

## Other Notes

- Make sure you have at least one admin user in your database before running this seed script
- The script uses a placeholder admin user ID: `11111111-1111-1111-1111-111111111111`. You should replace this with a real user ID from your database.
- This script performs cascading truncation, which will delete all related data. Make sure you're running this in a development environment. 