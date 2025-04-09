'use client';

import { useState, useCallback } from 'react';
import { Order, OrderStatus, PaymentStatus } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';
import { SAMPLE_ORDERS } from '@/app/dashboard/orders/_data/sample-orders';

interface OrdersResponse {
  orders: Order[];
  totalCount: number;
  pageCount: number;
}

interface OrdersFilters {
  status?: OrderStatus[];
  paymentStatus?: PaymentStatus[];
  startDate?: string;
  endDate?: string;
  search?: string;
}

interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Custom hook to fetch and manage orders from the real database
 */
export function useRealOrders() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  /**
   * Fetch orders with optional filtering and pagination
   */
  const fetchOrders = useCallback(async (
    filters?: OrdersFilters,
    pagination?: PaginationParams
  ) => {
    try {
      setLoading(true);

      // Use sample data instead of making API request
      console.log('Using sample orders data instead of API');

      // Filter the sample data based on the filters
      let filteredOrders = [...SAMPLE_ORDERS];

      if (filters) {
        if (filters.status?.length) {
          filteredOrders = filteredOrders.filter(order =>
            filters.status?.includes(order.status as OrderStatus)
          );
        }

        if (filters.paymentStatus?.length) {
          filteredOrders = filteredOrders.filter(order =>
            filters.paymentStatus?.includes(order.payment_status as PaymentStatus)
          );
        }

        if (filters.startDate) {
          filteredOrders = filteredOrders.filter(order =>
            new Date(order.date) >= new Date(filters.startDate!)
          );
        }

        if (filters.endDate) {
          filteredOrders = filteredOrders.filter(order =>
            new Date(order.date) <= new Date(filters.endDate!)
          );
        }

        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredOrders = filteredOrders.filter(order =>
            order.id.toLowerCase().includes(searchLower) ||
            order.client_name.toLowerCase().includes(searchLower)
          );
        }
      }

      // Apply pagination
      const totalCount = filteredOrders.length;
      let paginatedOrders = filteredOrders;

      if (pagination) {
        const startIndex = (pagination.page - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        paginatedOrders = filteredOrders.slice(startIndex, endIndex);
      }

      // Create mock response
      const data: OrdersResponse = {
        orders: paginatedOrders,
        totalCount: totalCount,
        pageCount: Math.ceil(totalCount / (pagination?.pageSize || 10))
      };

      setOrders(paginatedOrders);
      setTotalCount(totalCount);
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
   * Get an order by ID
   */
  const getOrderById = useCallback(async (id: string) => {
    try {
      setLoading(true);

      // Use sample data instead of making API request
      console.log('Using sample orders data instead of API for getOrderById');

      const order = SAMPLE_ORDERS.find(order => order.id === id);

      if (!order) {
        throw new Error('Order not found');
      }

      return order;
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch order',
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
  const createOrder = useCallback(async (order: Partial<Order>) => {
    try {
      setLoading(true);

      // Use mock data instead of making API request
      console.log('Using mock data instead of API for createOrder');

      // Create a new order with a unique ID
      const newOrder: Order = {
        id: `ORD${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`,
        client_id: order.client_id || 'client1',
        client_name: order.client_name || 'New Client',
        client_type: order.client_type || 'regular',
        date: order.date || new Date().toISOString().split('T')[0],
        status: order.status || 'draft',
        payment_status: order.payment_status || 'unpaid',
        total_amount: order.total_amount || 0,
        amount_paid: order.amount_paid || 0,
        balance: order.balance || 0,
        created_by: 'user1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: order.items || [],
        notes: order.notes || [],
      };

      // Add the new order to the sample data (in a real app, this would be saved to the database)
      SAMPLE_ORDERS.push(newOrder);

      // Refresh orders
      fetchOrders();

      return { order: newOrder, success: true };
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
  }, [fetchOrders, toast]);

  /**
   * Update an order
   */
  const updateOrder = useCallback(async (id: string, order: Partial<Order>) => {
    try {
      setLoading(true);

      // Use mock data instead of making API request
      console.log('Using mock data instead of API for updateOrder');

      // Find the order to update
      const orderIndex = SAMPLE_ORDERS.findIndex(o => o.id === id);

      if (orderIndex === -1) {
        throw new Error('Order not found');
      }

      // Update the order
      SAMPLE_ORDERS[orderIndex] = {
        ...SAMPLE_ORDERS[orderIndex],
        ...order,
        updated_at: new Date().toISOString()
      };

      // Refresh orders
      fetchOrders();

      return { order: SAMPLE_ORDERS[orderIndex], success: true };
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchOrders, toast]);

  /**
   * Delete an order
   */
  const deleteOrder = useCallback(async (id: string) => {
    try {
      setLoading(true);

      // Use mock data instead of making API request
      console.log('Using mock data instead of API for deleteOrder');

      // Find the order to delete
      const orderIndex = SAMPLE_ORDERS.findIndex(o => o.id === id);

      if (orderIndex === -1) {
        throw new Error('Order not found');
      }

      // Delete the order
      const deletedOrder = SAMPLE_ORDERS.splice(orderIndex, 1)[0];

      // Refresh orders
      fetchOrders();

      return { order: deletedOrder, success: true };
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete order',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchOrders, toast]);

  /**
   * Update order status
   */
  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus) => {
    try {
      setLoading(true);

      // Use mock data instead of making API request
      console.log('Using mock data instead of API for updateOrderStatus');

      // Find the order to update
      const orderIndex = SAMPLE_ORDERS.findIndex(o => o.id === id);

      if (orderIndex === -1) {
        throw new Error('Order not found');
      }

      // Update the order status
      SAMPLE_ORDERS[orderIndex] = {
        ...SAMPLE_ORDERS[orderIndex],
        status,
        updated_at: new Date().toISOString()
      };

      // Refresh orders
      fetchOrders();

      return { order: SAMPLE_ORDERS[orderIndex], success: true };
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchOrders, toast]);

  return {
    orders,
    totalCount,
    pageCount,
    loading,
    fetchOrders,
    getOrderById,
    createOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus,
  };
}
