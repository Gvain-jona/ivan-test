# Ivan Prints Business Management System Database Documentation

This document provides a comprehensive overview of the database structure for the Ivan Prints Business Management System, focusing on the three main mechanisms: Orders, Expenses, and Material Purchases. The documentation outlines the tables, their fields, and the data collected for each mechanism.

## 1. Orders Management

The Orders Management system tracks client orders, their items, payments, and status.

### 1.1 Orders Table

The `orders` table stores information about client orders.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| id | UUID | Unique identifier for the order (Primary Key) |
| order_number | Text | Unique order number for reference |
| client_id | UUID | Reference to the client who placed the order |
| client_name | VARCHAR(255) | Name of the client (for quick reference) |
| client_type | VARCHAR(20) | Type of client (default: 'regular') |
| date | Date | Date when the order was placed |
| delivery_date | Date | Expected or actual delivery date |
| is_delivered | Boolean | Flag indicating if the order has been delivered |
| total_amount | Numeric(10,2) | Total amount of the order |
| amount_paid | Numeric(10,2) | Amount paid by the client |
| balance | Numeric(10,2) | Calculated balance (total_amount - amount_paid) |
| status | VARCHAR(50) | Current status of the order (e.g., pending, in progress, completed) |
| payment_status | VARCHAR(50) | Payment status (e.g., unpaid, partially paid, paid) |
| invoice_generated_at | Timestamp | When the invoice was generated |
| created_by | UUID | User who created the order |
| created_at | Timestamp | When the order was created |
| updated_at | Timestamp | When the order was last updated |

### 1.2 Order Items Table

The `order_items` table stores details about individual items within an order.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| id | UUID | Unique identifier for the order item (Primary Key) |
| order_id | UUID | Reference to the parent order |
| item_id | UUID | Reference to the item from the items catalog (optional) |
| category_id | UUID | Reference to the category (optional) |
| item_name | VARCHAR(255) | Name of the item |
| category_name | VARCHAR(255) | Name of the category |
| size | VARCHAR(50) | Size of the item |
| quantity | Integer | Quantity ordered |
| unit_price | Numeric(10,2) | Price per unit |
| total_amount | Numeric(10,2) | Total amount for this item (quantity * unit_price) |
| profit_amount | Numeric(10,2) | Calculated profit amount |
| labor_amount | Numeric(10,2) | Calculated labor amount |
| created_at | Timestamp | When the order item was created |
| updated_at | Timestamp | When the order item was last updated |

## 2. Expenses Management

The Expenses Management system tracks business expenses, payments, and recurring expenses.

### 2.1 Expenses Table

The `expenses` table stores information about business expenses.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| id | UUID | Unique identifier for the expense (Primary Key) |
| date | Date | Date when the expense was incurred |
| category | VARCHAR | Expense category (fixed or variable) |
| item_name | VARCHAR | Name of the expense item |
| quantity | Numeric | Quantity of items |
| unit_cost | Numeric | Cost per unit |
| total_amount | Numeric | Total amount of the expense |
| amount_paid | Numeric | Amount already paid |
| balance | Numeric | Calculated balance (total_amount - amount_paid) |
| payment_status | VARCHAR | Payment status (unpaid, partially_paid, paid) |
| responsible | VARCHAR | Person responsible for the expense |
| vat | Numeric | VAT amount if applicable |
| notes | Text | Additional notes about the expense |
| created_by | UUID | User who created the expense record |
| created_at | Timestamp | When the expense was created |
| updated_at | Timestamp | When the expense was last updated |
| is_recurring | Boolean | Whether this is a recurring expense |
| recurrence_frequency | VARCHAR | Frequency of recurrence (daily, weekly, monthly, quarterly, yearly) |
| recurrence_start_date | Date | Start date for recurring expenses |
| recurrence_end_date | Date | End date for recurring expenses |
| reminder_days | Integer | Days before due date to send reminder |
| next_occurrence_date | Date | Date of the next occurrence |
| recurrence_day_of_week | Integer | Day of week for weekly recurrences (0-6, Sunday-Saturday) |
| recurrence_day_of_month | Integer | Day of month for monthly recurrences (1-31) |
| recurrence_week_of_month | Integer | Week of month for monthly recurrences (1-5) |
| recurrence_month_of_year | Integer | Month of year for yearly recurrences |
| parent_recurring_expense_id | UUID | Reference to parent expense for recurring instances |

### 2.2 Expense Payments Table

The `expense_payments` table tracks payments made for expenses.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| id | UUID | Unique identifier for the payment (Primary Key) |
| expense_id | UUID | Reference to the expense |
| amount | Numeric(10,2) | Payment amount |
| date | Date | Date of payment |
| payment_method | VARCHAR(50) | Method of payment (e.g., cash, bank transfer) |
| notes | Text | Additional notes about the payment |
| created_by | UUID | User who recorded the payment |
| created_at | Timestamp | When the payment was recorded |
| updated_at | Timestamp | When the payment record was last updated |

### 2.3 Expense Notes Table

The `expense_notes` table stores notes related to expenses.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| id | UUID | Unique identifier for the note (Primary Key) |
| expense_id | UUID | Reference to the expense |
| type | VARCHAR | Type of note (info, follow_up, urgent, internal) |
| text | Text | Content of the note |
| created_by | UUID | User who created the note |
| created_at | Timestamp | When the note was created |
| updated_at | Timestamp | When the note was last updated |

### 2.4 Recurring Expense Occurrences Table

The `recurring_expense_occurrences` table tracks individual occurrences of recurring expenses.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| id | UUID | Unique identifier for the occurrence (Primary Key) |
| parent_expense_id | UUID | Reference to the parent recurring expense |
| occurrence_date | Date | Date of this occurrence |
| status | VARCHAR | Status of this occurrence (pending, completed) |
| linked_expense_id | UUID | Reference to the actual expense record created for this occurrence |
| completed_date | Timestamp | When this occurrence was completed |
| created_at | Timestamp | When this occurrence record was created |
| updated_at | Timestamp | When this occurrence record was last updated |

## 3. Material Purchases Management

The Material Purchases Management system tracks purchases of materials, payments, and installment plans.

### 3.1 Material Purchases Table

The `material_purchases` table stores information about material purchases.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| id | UUID | Unique identifier for the purchase (Primary Key) |
| supplier_id | UUID | Reference to the supplier (optional) |
| supplier_name | Text | Name of the supplier |
| date | Date | Date of purchase |
| material_name | Text | Name of the material purchased |
| quantity | Numeric(10,2) | Quantity purchased |
| unit | VARCHAR(50) | Unit of measurement (e.g., kg, m, pieces) |
| unit_price | Numeric(10,2) | Price per unit |
| total_amount | Numeric(10,2) | Total amount of the purchase |
| amount_paid | Numeric(10,2) | Amount already paid |
| balance | Numeric(10,2) | Calculated balance (total_amount - amount_paid) |
| payment_status | VARCHAR(50) | Payment status (unpaid, partially_paid, paid) |
| installment_plan | Boolean | Whether this purchase has an installment payment plan |
| total_installments | Integer | Total number of installments |
| installments_paid | Integer | Number of installments already paid |
| payment_frequency | VARCHAR(20) | Frequency of installment payments |
| next_payment_date | Date | Date of the next payment |
| reminder_days | Integer | Days before due date to send reminder |
| notes | Text | Additional notes about the purchase |
| created_by | UUID | User who created the purchase record |
| created_at | Timestamp | When the purchase was recorded |
| updated_at | Timestamp | When the purchase record was last updated |

### 3.2 Material Payments Table

The `material_payments` table tracks payments made for material purchases.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| id | UUID | Unique identifier for the payment (Primary Key) |
| purchase_id | UUID | Reference to the material purchase |
| amount | Numeric(10,2) | Payment amount |
| date | Date | Date of payment |
| payment_method | VARCHAR(50) | Method of payment (e.g., cash, bank transfer) |
| notes | Text | Additional notes about the payment |
| created_by | UUID | User who recorded the payment |
| created_at | Timestamp | When the payment was recorded |
| updated_at | Timestamp | When the payment record was last updated |

### 3.3 Material Installments Table

The `material_installments` table tracks installment schedules for material purchases.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| id | UUID | Unique identifier for the installment (Primary Key) |
| purchase_id | UUID | Reference to the material purchase |
| installment_number | Integer | Sequential number of the installment |
| amount | Numeric | Amount due for this installment |
| due_date | Date | Date when this installment is due |
| status | VARCHAR | Status of the installment (pending, paid, overdue) |
| payment_id | UUID | Reference to the payment if this installment has been paid |
| created_at | Timestamp | When the installment was created |
| updated_at | Timestamp | When the installment was last updated |

### 3.4 Material Purchase Notes Table

The `material_purchase_notes` table stores notes related to material purchases.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| id | UUID | Unique identifier for the note (Primary Key) |
| purchase_id | UUID | Reference to the material purchase |
| type | VARCHAR | Type of note (e.g., note, comment, reminder) |
| text | Text | Content of the note |
| created_by | UUID | User who created the note |
| created_at | Timestamp | When the note was created |
| updated_at | Timestamp | When the note was last updated |

## 4. Supporting Tables

### 4.1 Clients Table

The `clients` table stores information about clients.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| id | UUID | Unique identifier for the client (Primary Key) |
| name | VARCHAR | Client name (individual or company) |
| email | VARCHAR | Client email address |
| phone | VARCHAR | Client phone number |
| address | Text | Client physical address |
| notes | Text | Additional notes about the client |
| client_type | VARCHAR | Type of client (default: 'regular') |
| status | VARCHAR | Client status (active, inactive) |
| created_by | UUID | User who created the client record |
| created_at | Timestamp | When the client was added |
| updated_at | Timestamp | When the client record was last updated |

### 4.2 Categories Table

The `categories` table stores product categories.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| id | UUID | Unique identifier for the category (Primary Key) |
| name | VARCHAR | Category name |
| description | Text | Category description |
| status | VARCHAR | Category status (active, inactive) |
| created_by | UUID | User who created the category |
| created_at | Timestamp | When the category was created |
| updated_at | Timestamp | When the category was last updated |

### 4.3 Items Table

The `items` table stores products and services offered.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| id | UUID | Unique identifier for the item (Primary Key) |
| name | VARCHAR | Item name |
| description | Text | Item description |
| category_id | UUID | Reference to the category this item belongs to |
| price | Numeric | Standard selling price |
| cost | Numeric | Standard cost price |
| status | VARCHAR | Item status (active, inactive) |
| created_by | UUID | User who created the item |
| created_at | Timestamp | When the item was created |
| updated_at | Timestamp | When the item was last updated |

### 4.4 Suppliers Table

The `suppliers` table stores information about suppliers.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| id | UUID | Unique identifier for the supplier (Primary Key) |
| name | VARCHAR | Supplier company name |
| contact_person | VARCHAR | Primary contact person at the supplier |
| phone | VARCHAR | Supplier phone number |
| email | VARCHAR | Supplier email address |
| address | Text | Supplier physical address |
| notes | Text | Additional notes about the supplier |
| created_by | UUID | User who created the supplier record |
| created_at | Timestamp | When the supplier was added |
| updated_at | Timestamp | When the supplier record was last updated |

### 4.5 Accounts Table

The `accounts` table stores financial accounts for tracking.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| id | UUID | Unique identifier for the account (Primary Key) |
| name | VARCHAR | Account name |
| type | VARCHAR | Account type |
| description | Text | Account description |
| balance | Numeric | Current balance |
| is_active | Boolean | Whether the account is active |
| created_at | Timestamp | When the account was created |
| updated_at | Timestamp | When the account was last updated |

### 4.6 Account Transactions Table

The `account_transactions` table tracks financial transactions.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| id | UUID | Unique identifier for the transaction (Primary Key) |
| account_id | UUID | Reference to the account |
| amount | Numeric | Transaction amount |
| transaction_type | VARCHAR | Type of transaction |
| source_type | VARCHAR | Source of the transaction |
| source_id | UUID | Reference to the source entity |
| description | Text | Transaction description |
| created_at | Timestamp | When the transaction was recorded |
| updated_at | Timestamp | When the transaction record was last updated |

### 4.7 Profit Settings Table

The `profit_settings` table stores profit calculation settings.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| id | Integer | Unique identifier for the settings (Primary Key) |
| calculation_basis | Text | Basis for profit calculation (unit_price, total_cost) |
| default_profit_percentage | Numeric | Default profit percentage |
| include_labor | Boolean | Whether to include labor costs |
| labor_percentage | Numeric | Default labor percentage |
| enabled | Boolean | Whether profit calculations are enabled |
| created_at | Timestamp | When the settings were created |
| updated_at | Timestamp | When the settings were last updated |

### 4.8 App Settings Table

The `app_settings` table stores application-wide settings.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| id | Integer | Unique identifier for the settings (Primary Key) |
| settings | JSONB | JSON object containing various application settings |
| profit_settings_id | Integer | Reference to profit settings |
| created_at | Timestamp | When the settings were created |
| updated_at | Timestamp | When the settings were last updated |

## 5. Data Relationships and Flow

### 5.1 Orders Flow
1. Client information is stored in the `clients` table
2. Order details are stored in the `orders` table with reference to the client
3. Individual items within the order are stored in the `order_items` table
4. Payments for orders update the `amount_paid` and `balance` fields in the `orders` table
5. Order status and payment status are updated as the order progresses

### 5.2 Expenses Flow
1. Expense details are stored in the `expenses` table
2. Payments for expenses are recorded in the `expense_payments` table
3. Notes related to expenses are stored in the `expense_notes` table
4. For recurring expenses, the recurrence pattern is stored in the `expenses` table
5. Individual occurrences of recurring expenses are tracked in the `recurring_expense_occurrences` table

### 5.3 Material Purchases Flow
1. Supplier information is stored in the `suppliers` table
2. Material purchase details are stored in the `material_purchases` table
3. Payments for material purchases are recorded in the `material_payments` table
4. For installment plans, the schedule is stored in the `material_installments` table
5. Notes related to material purchases are stored in the `material_purchase_notes` table

## 6. Summary

The Ivan Prints Business Management System database is designed to comprehensively track and manage three main business processes:

1. **Orders Management**: Tracks client orders, items, payments, and delivery status
2. **Expenses Management**: Tracks business expenses, payments, and recurring expenses
3. **Material Purchases Management**: Tracks material purchases, payments, and installment plans

The database structure supports various business operations including:
- Client management
- Product and service catalog
- Order processing and tracking
- Expense tracking and management
- Supplier management
- Material purchase tracking
- Payment tracking for all transactions
- Installment payment plans
- Recurring expense management
- Profit calculation and tracking
- Financial account management

This comprehensive data collection enables the business to effectively manage its operations, track financial performance, and make informed business decisions.
