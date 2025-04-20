'use client';

import { useState, useCallback } from 'react';
import { useNotifications } from '@/components/ui/notification';
import { Order, OrderItem, OrderPayment } from '@/types/orders';
import { createClient } from '@/lib/supabase/client';
import { useOrdersPage } from '@/app/dashboard/orders/_context/OrdersPageContext';
import { showNotification, requestNotificationPermission } from '@/utils/push-notifications';
import { mutate } from 'swr';

interface UseOrderCreationProps {
  onSuccess?: (orderId: string) => void;
}

export const useOrderCreation = ({ onSuccess }: UseOrderCreationProps = {}) => {
  const [loading, setLoading] = useState(false);
  const { success: showSuccess, error: showError } = useNotifications();

  // Get the handleLoadMore function from the OrdersPage context to refresh the orders list
  // We use a try-catch because this hook might be used outside the OrdersPage context
  let handleLoadMore: ((showToast?: boolean) => Promise<void>) | undefined;
  try {
    const ordersPageContext = useOrdersPage();
    // Convert the handleLoadMore function to a Promise if it's not already
    handleLoadMore = async (showToast: boolean = true) => {
      await Promise.resolve(ordersPageContext.handleLoadMore(showToast));
    };
  } catch (error) {
    // The hook is being used outside the OrdersPage context, which is fine
    console.log('useOrderCreation used outside OrdersPage context');
  }

  /**
   * Create a new order using the optimized create_complete_order database function
   * This version prioritizes performance by not checking for existing items/categories
   */
  const createOrder = useCallback(async (order: Partial<Order>) => {
    try {
      setLoading(true);

      // Create Supabase client
      const supabase = createClient();

      // Validate required fields
      if (!order.client_name) {
        throw new Error('Client name is required');
      }

      if (!order.items || order.items.length === 0) {
        throw new Error('At least one item is required');
      }

      // Generate a client ID if not provided
      const clientId = order.client_id || crypto.randomUUID();

      // Validate items
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        const index = i;

        // Validate required fields
        if (!item.item_name) {
          throw new Error(`Item #${index + 1} is missing a name`);
        }
        if (!item.category_name) {
          throw new Error(`Item #${index + 1} is missing a category`);
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error(`Item #${index + 1} must have a quantity greater than 0`);
        }
        if (item.unit_price === undefined || item.unit_price === null) {
          throw new Error(`Item #${index + 1} must have a unit price`);
        }

        // Generate UUIDs for item_id and category_id if not provided
        if (!item.item_id) {
          item.item_id = crypto.randomUUID();
        }
        if (!item.category_id) {
          item.category_id = crypto.randomUUID();
        }
      }

      // Prepare items for the function - more efficient with less processing
      const items = (order.items || []).map((item: OrderItem) => {
        // Ensure size is a string
        let size = item.size;
        if (typeof size === 'object' && size !== null) {
          // If size is an object (like from a dropdown), try to extract the value
          size = (size as any).value || (size as any).id || 'Standard';
        } else if (!size) {
          size = 'Standard';
        }

        return {
          item_id: item.item_id, // Already generated if missing
          category_id: item.category_id, // Already generated if missing
          item_name: item.item_name,
          category_name: item.category_name,
          size: size,
          quantity: item.quantity,
          unit_price: item.unit_price
        };
      });

      // Prepare payments for the function
      const payments = ((order as any).payments || []).map((payment: any) => {
        // Ensure we have a payment_date for the database function
        const payment_date = payment.payment_date || payment.date || new Date().toISOString().split('T')[0];

        // The database function expects payment_date in the JSON but inserts into the date column
        return {
          amount: payment.amount,
          payment_date: payment_date,
          payment_method: payment.payment_method
        };
      });

      // Call the optimized database function with client_name parameter
      const { data, error } = await supabase.rpc('create_complete_order', {
        p_client_id: clientId,
        p_client_name: order.client_name, // Pass client name for reference
        p_date: order.date || new Date().toISOString().split('T')[0],
        p_status: order.status || 'pending',
        p_payment_status: order.payment_status || 'unpaid',
        p_client_type: order.client_type || 'regular',
        p_items: items,
        p_payments: payments,
        p_notes: order.notes || []
      });

      if (error) {
        console.error('Error creating order:', error);
        showError(`Failed to create order: ${error.message}`, 'Error');
        return null;
      }

      // Check if the function returned success
      if (!data.success) {
        console.error('Error creating order:', data.error);
        showError(data.error || 'Failed to create order', 'Error');
        return null;
      }

      // Create a notification for the new order - simplified approach
      try {
        console.log('Creating notification for order:', data.order_id);

        // Use the client name we already have instead of fetching it again
        const clientName = order.client_name;

        if (clientName) {
          // Get the current user's ID
          const { data: { user } } = await supabase.auth.getUser();

          if (!user) {
            console.error('No authenticated user found for notification');
            throw new Error('No authenticated user found');
          }

          // Create a notification directly in the notifications table
          // This is more reliable than using the RPC function
          const { data: notificationData, error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: user.id, // Add the required user_id field
              type: 'new_order',
              title: 'New Order Created',
              message: `New order created for ${clientName} with ${items.length} item(s)`,
              data: JSON.stringify({ order_id: data.order_id, client_name: clientName }), // Convert to string as required by schema
              status: 'unread'
            })
            .select();

          if (notificationError) {
            console.error('Error inserting notification:', notificationError);
          } else {
            console.log('Notification created successfully:', notificationData);

            // Don't show a toast here - it will be shown by the OrderFormSheet component
            console.log('Order created successfully for', clientName);

            // Show a push notification if permission is granted
            if (Notification.permission === 'granted') {
              showNotification('New Order Created', {
                body: `New order created for ${clientName} with ${items.length} item(s)`,
                data: {
                  url: `/dashboard/orders?id=${data.order_id}`,
                  orderId: data.order_id,
                  clientName: clientName
                }
              });
            } else if (Notification.permission !== 'denied') {
              // Request permission if not already denied
              requestNotificationPermission().then(permission => {
                if (permission === 'granted') {
                  showNotification('New Order Created', {
                    body: `New order created for ${clientName} with ${items.length} item(s)`,
                    data: {
                      url: `/dashboard/orders?id=${data.order_id}`,
                      orderId: data.order_id,
                      clientName: clientName
                    }
                  });
                }
              });
            }
          }
        } else {
          console.error('No client name available for notification');

          // Don't show a toast here - it will be shown by the OrderFormSheet component
          console.log('Order created successfully (generic)');
        }
      } catch (notificationError) {
        // Don't fail the order creation if notification fails
        console.error('Error creating notification:', notificationError);

        // Don't show a toast here - it will be shown by the OrderFormSheet component
        console.log('Order created successfully (fallback)');
      }

      // Use SWR's mutate to update the cache with the new order
      // This is more efficient than refetching all orders
      mutate(
        '/api/orders',
        async (cachedData: any) => {
          // If we don't have cached data, just refresh
          if (!cachedData) {
            if (handleLoadMore) {
              await handleLoadMore(false);
            }
            return cachedData;
          }

          // Create a new order object with the data we have
          const newOrder = {
            id: data.order_id,
            order_number: data.order_number,
            client_id: clientId,
            client_name: order.client_name,
            client_type: order.client_type || 'regular',
            date: order.date,
            status: order.status || 'pending',
            payment_status: order.payment_status || 'unpaid',
            total_amount: items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0),
            amount_paid: payments.reduce((sum, payment) => sum + payment.amount, 0),
            balance: items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) -
                     payments.reduce((sum, payment) => sum + payment.amount, 0),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            items: items,
            notes: order.notes || []
          };

          // Add the new order to the cached data
          return {
            ...cachedData,
            orders: [newOrder, ...(cachedData.orders || [])],
            totalCount: (cachedData.totalCount || 0) + 1,
            pageCount: Math.ceil((cachedData.totalCount + 1) / (cachedData.orders?.length || 10))
          };
        },
        { revalidate: true } // Revalidate after updating the cache
      );

      // Call the onSuccess callback if provided
      if (onSuccess && data.order_id) {
        onSuccess(data.order_id);
      }

      return { orderId: data.order_id, success: true };
    } catch (error) {
      console.error('Error creating order:', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to create order';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Try to extract error message from Supabase error object
        errorMessage = (error as any).message || (error as any).error || JSON.stringify(error);
      }

      showError(errorMessage, 'Error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError, onSuccess, handleLoadMore]);

  return {
    createOrder,
    loading
  };
};

export default useOrderCreation;
