# Material Purchases Database Documentation

This document provides an overview of the database schema, triggers, and functions related to material purchases in the Ivan Prints V2 application.

## Tables

### material_purchases

The main table for storing material purchase information.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| supplier_id | UUID | Foreign key to suppliers table (nullable) |
| date | DATE | Purchase date |
| total_amount | NUMERIC | Total purchase amount |
| amount_paid | NUMERIC | Amount already paid |
| balance | NUMERIC | Calculated field (total_amount - amount_paid) |
| payment_status | VARCHAR | Status of payment: 'unpaid', 'partially_paid', 'paid' |
| notes | TEXT | Additional notes about the purchase |
| created_by | UUID | User who created the purchase |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |
| supplier_name | TEXT | Name of the supplier |
| material_name | TEXT | Name of the material purchased |
| quantity | NUMERIC | Quantity of material purchased |
| installment_plan | BOOLEAN | Whether this purchase has an installment plan |
| total_installments | INTEGER | Total number of installments |
| installments_paid | INTEGER | Number of installments paid |
| next_payment_date | DATE | Date of the next payment |
| payment_frequency | VARCHAR | Frequency of payments: 'weekly', 'biweekly', 'monthly', 'quarterly' |
| reminder_days | INTEGER | Days before due date to send reminder |

### material_payments

Stores payment records for material purchases.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| purchase_id | UUID | Foreign key to material_purchases table |
| amount | NUMERIC | Payment amount |
| date | DATE | Payment date |
| payment_method | VARCHAR | Method of payment |
| created_by | UUID | User who recorded the payment |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### material_installments

Stores installment plan details for material purchases.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| purchase_id | UUID | Foreign key to material_purchases table |
| installment_number | INTEGER | Sequential number of the installment |
| amount | NUMERIC | Amount due for this installment |
| due_date | DATE | Date when this installment is due |
| status | VARCHAR | Status of the installment: 'pending', 'paid', 'overdue' |
| payment_id | UUID | Foreign key to material_payments table (if paid) |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### material_purchase_notes

Stores notes related to material purchases.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| purchase_id | UUID | Foreign key to material_purchases table |
| type | VARCHAR | Type of note (default: 'note') |
| text | TEXT | Content of the note |
| created_by | UUID | User who created the note |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

## Triggers and Functions

### update_material_purchase_payment_status

**Trigger**: Executes after INSERT, UPDATE, or DELETE on material_payments table.

**Purpose**: Updates the payment status and amount_paid in the material_purchases table based on the total payments made.

**Logic**:
1. Calculates the total amount paid for a material purchase
2. Updates the material_purchase record with:
   - The new amount_paid value
   - The appropriate payment_status ('unpaid', 'partially_paid', or 'paid')
   - Updated timestamp

### update_material_purchase_payment_balance

**Trigger**: Executes before INSERT or UPDATE on material_purchases table.

**Purpose**: Ensures the balance field is correctly calculated.

**Logic**:
1. Sets the balance field to total_amount - amount_paid
2. Updates the payment_status based on the balance

### update_material_purchase_notes_updated_at

**Trigger**: Executes before UPDATE on material_purchase_notes table.

**Purpose**: Updates the updated_at timestamp whenever a note is modified.

**Logic**:
1. Sets the updated_at field to the current timestamp

### create_installment_plan

**Function**: Creates an installment plan for a material purchase.

**Parameters**:
- p_purchase_id: UUID of the material purchase
- p_installments: Array of installment objects
- p_total_installments: Total number of installments
- p_payment_frequency: Frequency of payments
- p_next_payment_date: Date of the first payment
- p_reminder_days: Days before due date to send reminder

**Logic**:
1. Updates the material_purchase record to mark it as an installment plan
2. Inserts the installments into the material_installments table
3. Returns a JSON object with the result

## Row Level Security (RLS) Policies

The following RLS policies are applied to material purchase related tables:

### material_purchases

- **material_purchases_select_policy**: Allows staff and above to view material purchases
- **material_purchases_insert_policy**: Allows authenticated users to insert material purchases
- **material_purchases_update_policy**: Allows staff and above to update material purchases
- **material_purchases_delete_policy**: Allows managers and admins to delete material purchases

### material_payments

- **material_payments_select_policy**: Allows staff and above to view material payments
- **material_payments_insert_policy**: Allows authenticated users to insert material payments
- **material_payments_update_policy**: Allows staff and above to update material payments
- **material_payments_delete_policy**: Allows managers and admins to delete material payments

### material_purchase_notes

- **material_purchase_notes_select_policy**: Allows staff and above to view material purchase notes
- **material_purchase_notes_insert_policy**: Allows authenticated users to insert material purchase notes
- **material_purchase_notes_update_policy**: Allows staff and above to update material purchase notes
- **material_purchase_notes_delete_policy**: Allows managers and admins to delete material purchase notes

### material_installments

- **material_installments_select_policy**: Allows staff and above to view material installments
- **material_installments_insert_policy**: Allows authenticated users to insert material installments
- **material_installments_update_policy**: Allows staff and above to update material installments
- **material_installments_delete_policy**: Allows managers and admins to delete material installments

## Helper Functions

### is_staff_or_above()

Returns true if the current user has a role of 'staff', 'manager', or 'admin'.

### is_manager_or_admin()

Returns true if the current user has a role of 'manager' or 'admin'.
