# Guide: Connecting UI Components to the API

*Created: April 3, 2024*

This guide provides step-by-step instructions for connecting React components in our application to the API service layer. It covers best practices for data fetching, state management, and error handling.

## Prerequisites

- Familiarity with React hooks (useState, useEffect, useCallback)
- Understanding of async/await patterns
- Basic knowledge of TypeScript

## Step 1: Import API Functions and Types

First, import the necessary API functions and types in your component file:

```typescript
import { 
  fetchOrders, 
  createOrder, 
  updateOrder, 
  deleteOrder,
  ApiError 
} from '@/app/lib/api';
import type { 
  Order, 
  OrderFilters, 
  PaginatedResponse, 
  PaginationParams 
} from '@/app/types/orders';
```

## Step 2: Set Up Component State

Define state variables for data, loading state, errors, and pagination:

```typescript
// Data state
const [orders, setOrders] = useState<Order[]>([]);
const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

// UI state
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [modalOpen, setModalOpen] = useState(false);

// Pagination state
const [pagination, setPagination] = useState<PaginationParams>({
  page: 1,
  pageSize: 10
});
const [totalItems, setTotalItems] = useState(0);

// Filters state
const [filters, setFilters] = useState<OrderFilters>({
  status: undefined,
  startDate: undefined,
  endDate: undefined,
  client: undefined,
  paymentStatus: undefined
});
```

## Step 3: Create Data Fetching Function

Implement a function to fetch data from the API:

```typescript
const fetchData = useCallback(async () => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await fetchOrders({
      ...pagination,
      filters
    });
    
    setOrders(response.data);
    setTotalItems(response.total);
  } catch (err) {
    console.error('Error fetching orders:', err);
    setError(err instanceof ApiError 
      ? err.message 
      : 'An unexpected error occurred while fetching orders');
  } finally {
    setLoading(false);
  }
}, [pagination, filters]);
```

## Step 4: Call the API on Component Mount and When Dependencies Change

Use the `useEffect` hook to fetch data when the component mounts or when pagination or filters change:

```typescript
useEffect(() => {
  fetchData();
}, [fetchData]);
```

## Step 5: Implement Pagination Handler

Add a function to handle pagination changes:

```typescript
const handlePageChange = (newPage: number) => {
  setPagination(prev => ({
    ...prev,
    page: newPage
  }));
};

const handlePageSizeChange = (newPageSize: number) => {
  setPagination(prev => ({
    ...prev,
    page: 1, // Reset to first page when changing page size
    pageSize: newPageSize
  }));
};
```

## Step 6: Implement Filter Handlers

Add functions to manage filters:

```typescript
const handleFilterChange = (key: keyof OrderFilters, value: any) => {
  setFilters(prev => ({
    ...prev,
    [key]: value
  }));
  
  // Reset to first page when filters change
  setPagination(prev => ({
    ...prev,
    page: 1
  }));
};

const handleResetFilters = () => {
  setFilters({});
  setPagination(prev => ({
    ...prev,
    page: 1
  }));
};
```

## Step 7: Implement CRUD Operations

### Create

```typescript
const handleCreateOrder = async (orderData: OrderFormData) => {
  setLoading(true);
  try {
    await createOrder(orderData);
    setModalOpen(false);
    // Refresh data
    fetchData();
    toast.success('Order created successfully');
  } catch (err) {
    console.error('Error creating order:', err);
    toast.error(err instanceof ApiError 
      ? err.message 
      : 'An error occurred while creating the order');
  } finally {
    setLoading(false);
  }
};
```

### Update

```typescript
const handleUpdateOrder = async (id: string, orderData: OrderFormData) => {
  setLoading(true);
  try {
    await updateOrder(id, orderData);
    setModalOpen(false);
    // Refresh data
    fetchData();
    toast.success('Order updated successfully');
  } catch (err) {
    console.error('Error updating order:', err);
    toast.error(err instanceof ApiError 
      ? err.message 
      : 'An error occurred while updating the order');
  } finally {
    setLoading(false);
  }
};
```

### Delete

```typescript
const handleDeleteOrder = async (id: string) => {
  if (!confirm('Are you sure you want to delete this order?')) {
    return;
  }
  
  setLoading(true);
  try {
    await deleteOrder(id);
    // Refresh data
    fetchData();
    toast.success('Order deleted successfully');
  } catch (err) {
    console.error('Error deleting order:', err);
    toast.error(err instanceof ApiError 
      ? err.message 
      : 'An error occurred while deleting the order');
  } finally {
    setLoading(false);
  }
};
```

## Step 8: Handle Loading and Error States in the UI

```tsx
// Loading state
if (loading && orders.length === 0) {
  return <OrdersTableSkeleton />;
}

// Error state
if (error && orders.length === 0) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
      <p>Error: {error}</p>
      <Button onClick={fetchData}>Retry</Button>
    </div>
  );
}

// Empty state
if (!loading && orders.length === 0) {
  return (
    <div className="text-center py-10">
      <p className="text-gray-500 mb-4">No orders found</p>
      <Button onClick={() => setModalOpen(true)}>Create New Order</Button>
    </div>
  );
}
```

## Step 9: Render Data and UI Components

```tsx
return (
  <div>
    {/* Filters */}
    <OrderFilters 
      filters={filters} 
      onFilterChange={handleFilterChange}
      onResetFilters={handleResetFilters}
    />
    
    {/* Actions */}
    <div className="flex justify-between my-4">
      <Button onClick={() => setModalOpen(true)}>
        Add New Order
      </Button>
      {/* Other actions */}
    </div>
    
    {/* Table */}
    <OrdersTable 
      orders={orders}
      loading={loading}
      onEdit={(order) => {
        setSelectedOrder(order);
        setModalOpen(true);
      }}
      onDelete={handleDeleteOrder}
    />
    
    {/* Pagination */}
    <Pagination
      currentPage={pagination.page}
      pageSize={pagination.pageSize}
      totalItems={totalItems}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
    />
    
    {/* Modal */}
    <OrderFormModal
      open={modalOpen}
      onOpenChange={setModalOpen}
      initialOrder={selectedOrder}
      onSave={selectedOrder 
        ? (data) => handleUpdateOrder(selectedOrder.id, data)
        : handleCreateOrder
      }
      isEditing={!!selectedOrder}
      title={selectedOrder ? "Edit Order" : "Create Order"}
    />
  </div>
);
```

## Best Practices

1. **Separate Data and UI Concerns**: Keep data fetching logic separate from UI rendering
2. **Use Loading States**: Always show loading indicators during API calls
3. **Handle Errors Gracefully**: Display user-friendly error messages
4. **Implement Optimistic Updates**: Update UI before API call completes for better UX
5. **Debounce Search Inputs**: Prevent excessive API calls for search fields
6. **Reset to First Page**: When filters change, reset to the first page
7. **Confirm Destructive Actions**: Always ask for confirmation before delete operations
8. **Use Toast Notifications**: Provide feedback for successful/failed operations

## Example: Connecting OrdersTable Component

Here's a complete example of connecting the OrdersTable component to the API:

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { fetchOrders, deleteOrder, ApiError } from '@/app/lib/api';
import type { Order, OrderFilters, PaginationParams } from '@/app/types/orders';
import { OrdersTable } from '@/app/components/orders/OrdersTable';
import { OrderFilters } from '@/app/components/orders/OrderFilters';
import { Pagination } from '@/app/components/ui/pagination';
import { OrderFormModal } from '@/app/components/orders/OrderFormModal';
import { OrdersTableSkeleton } from '@/app/components/skeletons/OrdersTableSkeleton';
import { Button } from '@/app/components/ui/button';

export default function OrdersPage() {
  // State management
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Pagination
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    pageSize: 10
  });
  const [totalItems, setTotalItems] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState<OrderFilters>({});

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchOrders({
        ...pagination,
        filters
      });
      
      setOrders(response.data);
      setTotalItems(response.total);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof ApiError 
        ? err.message 
        : 'An unexpected error occurred while fetching orders');
    } finally {
      setLoading(false);
    }
  }, [pagination, filters]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Handle filters
  const handleFilterChange = (key: keyof OrderFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Reset to first page when filters change
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  // Handle delete
  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this order?')) {
      return;
    }
    
    try {
      await deleteOrder(id);
      // Refresh data
      fetchData();
      toast.success('Order deleted successfully');
    } catch (err) {
      console.error('Error deleting order:', err);
      toast.error(err instanceof ApiError 
        ? err.message 
        : 'An error occurred while deleting the order');
    }
  };

  // Render
  if (loading && orders.length === 0) {
    return <OrdersTableSkeleton />;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      
      <OrderFilters 
        filters={filters} 
        onFilterChange={handleFilterChange}
      />
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error: {error}</p>
          <Button onClick={fetchData} variant="outline" className="mt-2">
            Retry
          </Button>
        </div>
      )}
      
      <div className="flex justify-between my-4">
        <Button onClick={() => {
          setSelectedOrder(null);
          setModalOpen(true);
        }}>
          Add New Order
        </Button>
      </div>
      
      {orders.length === 0 && !loading ? (
        <div className="text-center py-10 border rounded-lg">
          <p className="text-gray-500 mb-4">No orders found</p>
          <Button onClick={() => {
            setSelectedOrder(null);
            setModalOpen(true);
          }}>
            Create New Order
          </Button>
        </div>
      ) : (
        <>
          <OrdersTable 
            orders={orders}
            onEdit={(order) => {
              setSelectedOrder(order);
              setModalOpen(true);
            }}
            onView={(order) => {
              // Handle view action
            }}
            onDelete={handleDeleteOrder}
          />
          
          <Pagination
            currentPage={pagination.page}
            pageSize={pagination.pageSize}
            totalItems={totalItems}
            onPageChange={handlePageChange}
          />
        </>
      )}
      
      <OrderFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialOrder={selectedOrder}
        onSave={() => {
          // Handle save
          fetchData();
        }}
        isEditing={!!selectedOrder}
        title={selectedOrder ? "Edit Order" : "Create Order"}
      />
    </div>
  );
} 