# Database-Frontend Integration Guide

This document provides guidelines for ensuring proper integration between frontend forms and database structures, based on lessons learned from troubleshooting field name mismatches.

## Common Issues

1. **Field Name Mismatches**: Frontend form fields using different names than database columns
2. **Database Function Inconsistencies**: Database functions using incorrect column names in SQL statements
3. **Data Type Mismatches**: Frontend sending data in formats incompatible with database expectations
4. **Missing Required Fields**: Required database fields not being properly validated or populated in frontend
5. **Inconsistent Naming Conventions**: Mixing naming conventions (camelCase vs snake_case) across the stack

## Best Practices

### 1. Database Schema First Approach

- **Always check the database schema first** before implementing frontend forms
- Document the exact column names, data types, and constraints
- Use database schema as the source of truth for field names when possible

```sql
-- Example: Check column names and types
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'your_table_name' 
ORDER BY ordinal_position;
```

### 2. Database Function Review

- **Examine database functions carefully** for field name inconsistencies
- Pay special attention to INSERT and UPDATE statements
- Ensure function parameters match the expected column names

```sql
-- Example: Check database function definition
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'your_function_name';
```

### 3. Consistent Field Mapping

- Implement clear mapping between frontend field names and database column names
- Document any mappings that can't be made consistent
- Use TypeScript interfaces to define the shape of data at different stages

```typescript
// Example: Define clear interfaces for form data and database data
interface OrderPaymentFormValues {
  amount: number;
  payment_date: string;  // Form field name
  payment_method: string;
}

interface OrderPaymentDatabaseValues {
  amount: number;
  date: string;  // Database column name
  payment_method: string;
}

// Example: Implement clear mapping function
function mapFormToDatabase(formData: OrderPaymentFormValues): OrderPaymentDatabaseValues {
  return {
    amount: formData.amount,
    date: formData.payment_date,  // Map form field to database column
    payment_method: formData.payment_method
  };
}
```

### 4. Comprehensive Logging

- Add detailed logging at each step of data transformation
- Log both input and output of mapping functions
- Include field names and values in logs to help diagnose issues

```typescript
// Example: Detailed logging
console.log('Original form data:', JSON.stringify(formData));
const mappedData = mapFormToDatabase(formData);
console.log('Mapped database data:', JSON.stringify(mappedData));
```

### 5. Robust Validation and Fallbacks

- Implement validation at multiple levels (form, API, database)
- Provide fallback values for required fields
- Use default values in database schema when appropriate

```typescript
// Example: Form validation with fallbacks
const payment_date = formData.payment_date || new Date().toISOString().split('T')[0];

// Example: Database schema with defaults
// CREATE TABLE order_payments (
//   ...
//   date DATE NOT NULL DEFAULT CURRENT_DATE,
//   ...
// );
```

### 6. End-to-End Testing

- Test the entire flow from form submission to database storage
- Verify that data is correctly transformed at each step
- Include edge cases like empty or partial form submissions

## Troubleshooting Guide

### When Encountering Field Name Errors:

1. **Check Database Schema**:
   - Verify the actual column names in the database table
   - Confirm data types and constraints

2. **Examine Database Functions**:
   - Look for mismatches between function parameters and column names
   - Check INSERT and UPDATE statements for correct column references

3. **Review Frontend Code**:
   - Identify how form fields are mapped to API requests
   - Check for inconsistent field naming

4. **Add Diagnostic Logging**:
   - Log form data before submission
   - Log data at each transformation step
   - Log database function inputs

5. **Fix Inconsistencies**:
   - Update database functions to use correct column names
   - Implement proper mapping in frontend code
   - Add validation and fallbacks for required fields

## Example: Fixing a Field Name Mismatch

### Problem:
Frontend form uses `payment_date` but database table has a column named `date`.

### Solution:

1. **Database Function Fix**:
```sql
-- Update INSERT statement to use correct column name
INSERT INTO order_payments (
  order_id,
  amount,
  date,  -- Correct column name
  payment_method
)
VALUES (
  v_order_id,
  (v_payment->>'amount')::NUMERIC,
  (v_payment->>'payment_date')::DATE,  -- Still using payment_date from input
  v_payment->>'payment_method'
);
```

2. **Frontend Mapping Fix**:
```typescript
// Map form field to database column
const newPayment = {
  id: paymentId,
  order_id: existingPayment?.order_id || '',
  date: formData.payment_date,  // Map payment_date to date
  payment_method: formData.payment_method,
  amount: amount
};
```

3. **Add Fallback Mechanism**:
```typescript
// Ensure payment_date is always set
const payment_date = formData.payment_date || new Date().toISOString().split('T')[0];
```

## Conclusion

Proper integration between frontend forms and database structures requires careful attention to field names, data types, and transformations. By following these best practices, you can avoid common pitfalls and create more robust applications.

Remember: **Always check the database schema first** and maintain clear documentation of any field mappings between frontend and backend.
