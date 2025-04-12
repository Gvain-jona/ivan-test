# Orders Management System

This directory contains utilities and functions for managing orders in the Ivan Prints application.

## Key Components

### Calculations (`calculations.ts`)

Centralized utility functions for order calculations:

- `calculateOrderTotal`: Calculates the total amount for an order based on its items
- `calculateAmountPaid`: Calculates the total amount paid for an order based on its payments
- `calculateOrderBalance`: Calculates the remaining balance for an order
- `getPaymentStatus`: Determines the payment status based on total amount and amount paid
- `updateOrderCalculations`: Updates all calculations for an order

### API Error Handling (`/lib/api/error-handler.ts`)

Standardized error handling for API routes:

- `handleApiError`: Handles API errors in a standardized way
- `handleSupabaseError`: Handles Supabase errors in API routes
- `handleUnexpectedError`: Handles unexpected errors in API routes

### API Response Handling (`/lib/api/response-handler.ts`)

Standardized response handling for API routes:

- `createApiResponse`: Creates a standardized API success response
- `createCreatedResponse`: Creates a standardized API created response
- `createNoContentResponse`: Creates a standardized API no content response

## Hooks

### `useOrderCalculations`

Custom hook for calculating order totals, balances, and payment status.

```typescript
const {
  calculateTotal,
  calculateAmountPaid,
  calculateBalance,
  getPaymentStatus,
  updateOrderCalculations
} = useOrderCalculations();
```

### `useOrderForm`

Custom hook for managing order form state.

```typescript
const {
  order,
  updateOrderField,
  updateOrderFields,
  resetOrder,
  recalculateOrder,
  isDirty
} = useOrderForm({ initialOrder });
```

### `useOrderFiltering`

Custom hook for managing order filtering functionality.

```typescript
const {
  filters,
  filteredOrders,
  searchTerm,
  showFilters,
  handleFilterChange,
  handleSearch,
  resetFilters,
  toggleFilters,
  filterByStatus
} = useOrderFiltering(orders);
```

## API Routes

### `/api/orders`

- `GET`: Retrieves a list of orders with optional filtering and pagination
- `POST`: Creates a new order with items
- `PUT`: Updates an existing order
- `DELETE`: Deletes an order by ID

### `/api/orders/[id]`

- `GET`: Retrieves a single order with all related details (items, payments, notes)

## Database Structure

The orders system uses the following tables:

- `orders`: Main orders table
- `order_items`: Items associated with orders
- `order_payments`: Payments associated with orders
- `notes`: Notes associated with orders (linked via `linked_item_id` and `linked_item_type`)

## Recent Improvements

1. **Standardized Error Handling**: Implemented consistent error handling across all API routes
2. **Standardized Response Handling**: Implemented consistent response handling across all API routes
3. **Centralized Calculations**: Moved all order calculations to a central utility file
4. **Optimized Filtering**: Improved performance of order filtering with early returns and more efficient comparisons
5. **Enhanced API Routes**: Added better validation and error handling to API routes
6. **Improved Hooks**: Updated hooks to use centralized utility functions
