# Expenses Table Cleanup

## Overview

The expenses table had redundant fields that were causing confusion and potential data inconsistencies. This document explains the changes made to clean up the table while maintaining backward compatibility.

## Redundant Fields

1. **category** and **expense_type** - These fields were storing the same data. The frontend form uses "category" while the database schema uses "expense_type" as the primary field.

2. **description** - This field has been replaced by **item_name** in newer code, but was still present in the database.

## Changes Made

### 1. Database Triggers

Two triggers were created to keep the redundant fields in sync:

- **sync_expense_type_category_trigger**: This trigger runs BEFORE UPDATE and ensures that if either `category` or `expense_type` is updated, the other field is updated to match.

- **set_category_from_expense_type_trigger**: This trigger runs BEFORE INSERT and ensures that both `category` and `expense_type` are set, using one to set the other if either is missing.

### 2. Column Comments

Comments were added to the redundant columns to indicate that they are deprecated:

- **category**: "DEPRECATED: This column is redundant with expense_type but is kept for backward compatibility."

- **description**: "DEPRECATED: Use item_name instead. This column is kept for backward compatibility but will be removed in a future update."

### 3. API Route Updates

The API routes were updated to handle the deprecated fields more explicitly:

- **POST /api/expenses**: Sets both `category` and `description` fields for backward compatibility.

- **PUT /api/expenses**: Updates `description` from `item_name` if `description` is not provided.

### 4. Database Function Fixes

Several database functions were fixed to avoid ambiguous column references:

- **update_expense_payment_status_new**: Renamed variables to avoid ambiguity with column names (`expense_id` → `expense_id_var`, `total_amount` → `total_amount_var`).

- **update_expense_payment_total**: Added table aliases (`ep` for expense_payments and `e` for expenses) and qualified column references.

- **expense_payment_balance_trigger**: Removed this trigger as it was trying to update the `balance` column, which is a generated column.

## Future Improvements

In a future update, these redundant fields could be removed entirely:

1. Update the frontend to use `expense_type` directly instead of `category`.
2. Remove the `description` field from the database schema.
3. Remove the `category` field from the database schema.
4. Review and simplify the database triggers and functions to reduce complexity.

However, this would require more extensive changes to the frontend code and would break backward compatibility with any external systems that might be using these fields.
