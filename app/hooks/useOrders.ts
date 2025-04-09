import { useCallback, useState } from 'react';
import { Order, OrdersResponse, OrdersTableFilters, PaginationParams } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';

/**
 * Custom hook to fetch and manage orders
 */
export function useOrders() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  
  /**
   * Fetch orders with optional filtering and pagination
   */
  const fetchOrders = useCallback(async (
    filters?: OrdersTableFilters,
    pagination?: PaginationParams
  ) => {
    try {
      setLoading(true);
      
      // Build query string
      const queryParams = new URLSearchParams();
      
      // Add filters
      if (filters) {
        if (filters.status?.length) {
          filters.status.forEach(status => queryParams.append('status', status));
        }
        
        if (filters.paymentStatus?.length) {
          filters.paymentStatus.forEach(status => queryParams.append('paymentStatus', status));
        }
        
        if (filters.startDate) {
          queryParams.append('startDate', filters.startDate);
        }
        
        if (filters.endDate) {
          queryParams.append('endDate', filters.endDate);
        }
        
        if (filters.search) {
          queryParams.append('search', filters.search);
        }
      }
      
      // Add pagination
      if (pagination) {
        const limit = pagination.pageSize;
        const offset = (pagination.page - 1) * pagination.pageSize;
        queryParams.append('limit', limit.toString());
        queryParams.append('offset', offset.toString());
      }
      
      // Make API request
      const response = await fetch(`/api/orders?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data: OrdersResponse = await response.json();
      
      setOrders(data.orders);
      setTotalCount(data.totalCount);
      setPageCount(data.pageCount);
      
      return data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch orders',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  /**
   * Fetch a single order by ID
   */
  const fetchOrderById = useCallback(async (orderId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to fetch order details',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  /**
   * Create a new order
   */
  const createOrder = useCallback(async (orderData: Partial<Order>) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create order');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Success',
        description: 'Order created successfully'
      });
      
      return data.id;
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to create order',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  /**
   * Update an existing order
   */
  const updateOrder = useCallback(async (orderId: string, orderData: Partial<Order>) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: orderId,
          ...orderData
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update order');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Success',
        description: 'Order updated successfully'
      });
      
      return true;
    } catch (error) {
      console.error(`Error updating order ${orderId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to update order',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  /**
   * Update the status of an order
   */
  const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
      
      toast({
        title: 'Success',
        description: `Order status updated to ${status}`
      });
      
      return true;
    } catch (error) {
      console.error(`Error updating order ${orderId} status:`, error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  /**
   * Delete an order
   */
  const deleteOrder = useCallback(async (orderId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/orders?id=${orderId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete order');
      }
      
      toast({
        title: 'Success',
        description: 'Order deleted successfully'
      });
      
      return true;
    } catch (error) {
      console.error(`Error deleting order ${orderId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to delete order',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  return {
    loading,
    orders,
    totalCount,
    pageCount,
    fetchOrders,
    fetchOrderById,
    createOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder
  };
} 