# API Architecture Documentation

*Created: April 3, 2024*

## Overview

The API service layer (`app/lib/api.ts`) provides a clean interface between the UI components and the backend data sources. It abstracts the complexity of data fetching, mutations, and error handling, allowing UI components to interact with data using strongly-typed function calls.

## API Service Design Principles

1. **Type Safety** - All API functions have proper TypeScript interfaces for parameters and return types
2. **Consistent Error Handling** - Standardized approach to error management across all API calls
3. **Abstraction** - UI components don't need to know the details of API endpoints or request formats
4. **Separation of Concerns** - Data fetching logic is separated from component rendering logic
5. **Testability** - Easy to mock API functions for unit testing components

## Error Handling

We've implemented a custom `ApiError` class that extends `Error` to provide consistent error handling:

```typescript
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
```

This allows components to handle different types of errors appropriately based on the status code.

## Request/Response Flow

The typical flow for API requests follows this pattern:

1. Component calls API function with required parameters
2. API function constructs the appropriate request
3. Request is sent to the backend with proper authentication
4. Response is validated and transformed if necessary
5. Data is returned to the component or an error is thrown

## Pagination Implementation

For paginated endpoints, we use a consistent approach:

```typescript
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

This allows components to implement pagination UI with all necessary information.

## Key API Functions

### Orders Management

- **fetchOrders** - Gets a paginated list of orders with filtering options
- **fetchOrderById** - Gets detailed information about a specific order
- **createOrder** - Creates a new order with items, payments, and notes
- **updateOrder** - Updates an existing order
- **deleteOrder** - Deletes an order by ID
- **addPayment** - Adds a payment to an order
- **addNote** - Adds a note to an order

### Tasks Management

- **fetchTasks** - Gets a paginated list of tasks with filtering options
- **fetchTaskById** - Gets detailed information about a specific task
- **createTask** - Creates a new task
- **updateTask** - Updates an existing task
- **deleteTask** - Deletes a task by ID
- **completeTask** - Marks a task as complete

### Supporting Functions

- **fetchClients** - Gets a list of clients for dropdown menus
- **fetchCategories** - Gets a list of categories for dropdown menus
- **fetchItemsByCategory** - Gets items filtered by category
- **generateInvoice** - Generates an invoice PDF for an order

## Integration with Supabase

Our API functions use Supabase as the backend, leveraging its built-in features:

- **Authentication** - API calls include the user session for authentication
- **Row-Level Security** - Backend enforces access control policies
- **Real-time** - Some endpoints use Supabase's real-time features for live updates

## Usage Examples

### Fetching Data with Filtering

```typescript
// In a component
const [orders, setOrders] = useState<Order[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const fetchOrdersData = async () => {
  setLoading(true);
  setError(null);
  try {
    const result = await fetchOrders({
      page: 1,
      pageSize: 10,
      filters: {
        status: 'pending',
        startDate: new Date('2024-01-01')
      }
    });
    setOrders(result.data);
  } catch (err) {
    setError(err instanceof ApiError ? err.message : 'An unknown error occurred');
  } finally {
    setLoading(false);
  }
};
```

### Creating or Updating Data

```typescript
// In a form submission handler
const handleSubmit = async (formData: OrderFormData) => {
  setSubmitting(true);
  try {
    if (isEditing) {
      await updateOrder(orderId, formData);
      toast.success('Order updated successfully');
    } else {
      const newOrder = await createOrder(formData);
      toast.success('Order created successfully');
      router.push(`/orders/${newOrder.id}`);
    }
  } catch (err) {
    toast.error(err instanceof ApiError ? err.message : 'An error occurred');
  } finally {
    setSubmitting(false);
  }
};
```

## Future Enhancements

1. **Caching** - Implement data caching for frequently accessed data
2. **Optimistic Updates** - Add support for optimistic UI updates
3. **Offline Support** - Add offline capabilities with local storage
4. **Batch Operations** - Support for batch operations like bulk delete
5. **Webhooks** - Integration with webhook system for external notifications 