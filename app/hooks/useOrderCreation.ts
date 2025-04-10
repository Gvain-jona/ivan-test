'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Order, OrderItem, OrderPayment } from '@/types/orders';
import { createClient } from '@/lib/supabase/client';
import { useOrdersPage } from '@/app/dashboard/orders/_context/OrdersPageContext';

interface UseOrderCreationProps {
  onSuccess?: (orderId: string) => void;
}

export const useOrderCreation = ({ onSuccess }: UseOrderCreationProps = {}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Get the handleLoadMore function from the OrdersPage context to refresh the orders list
  // We use a try-catch because this hook might be used outside the OrdersPage context
  let handleLoadMore: (() => Promise<void>) | undefined;
  try {
    const ordersPageContext = useOrdersPage();
    handleLoadMore = ordersPageContext.handleLoadMore;
  } catch (error) {
    // The hook is being used outside the OrdersPage context, which is fine
    console.log('useOrderCreation used outside OrdersPage context');
  }

  /**
   * Create a new order using the create_complete_order database function
   */
  const createOrder = useCallback(async (order: Partial<Order>) => {
    try {
      setLoading(true);

      // Create Supabase client
      const supabase = createClient();

      // Validate required fields
      if (!order.client_id) {
        throw new Error('Client is required');
      }

      if (!order.items || order.items.length === 0) {
        throw new Error('At least one item is required');
      }

      // Validate each item has the required fields
      order.items.forEach((item, index) => {
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
      });

      // Prepare items for the function
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
          item_id: item.item_id,
          category_id: item.category_id,
          item_name: item.item_name,
          category_name: item.category_name,
          size: size,
          quantity: item.quantity,
          unit_price: item.unit_price
        };
      });

      // Prepare payments for the function
      const payments = ((order as any).payments || []).map((payment: OrderPayment) => {
        // Ensure we have a payment_date for the database function
        // The database function expects payment_date but our OrderPayment type uses date
        const payment_date = payment.date || new Date().toISOString().split('T')[0];

        console.log('Processing payment for database:', {
          original: payment,
          mapped_date: payment_date
        });

        // The database function expects payment_date in the JSON but inserts into the date column
        return {
          amount: payment.amount,
          payment_date: payment_date, // This matches what the database function expects
          payment_method: payment.payment_method
        };
      });

      console.log('Final payments array for database function:', payments);

      // Call the database function
      const { data, error } = await supabase.rpc('create_complete_order', {
        p_client_id: order.client_id,
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
        toast({
          title: 'Error',
          description: `Failed to create order: ${error.message}`,
          variant: 'destructive'
        });
        return null;
      }

      // Check if the function returned success
      if (!data.success) {
        console.error('Error creating order:', data.error);
        toast({
          title: 'Error',
          description: data.error || 'Failed to create order',
          variant: 'destructive'
        });
        return null;
      }

      // Create a notification for the new order
      try {
        console.log('Creating notification for order:', data.order_id);

        // Get client name for the notification
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('name')
          .eq('id', order.client_id)
          .single();

        console.log('Client data for notification:', clientData, 'Error:', clientError);

        if (!clientError && clientData) {
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
              message: `New order created for ${clientData.name} with ${items.length} item(s)`,
              data: JSON.stringify({ order_id: data.order_id, client_name: clientData.name }), // Convert to string as required by schema
              status: 'unread'
            })
            .select();

          if (notificationError) {
            console.error('Error inserting notification:', notificationError);
          } else {
            console.log('Notification created successfully:', notificationData);

            // Show a toast notification to the user
            toast({
              title: "Order Created",
              description: `New order for ${clientData.name} has been created successfully.`,
              variant: "default",
            });
          }
        } else {
          console.error('Could not get client data for notification:', clientError);

          // Show a generic toast notification
          toast({
            title: "Order Created",
            description: `New order has been created successfully.`,
            variant: "default",
          });
        }
      } catch (notificationError) {
        // Don't fail the order creation if notification fails
        console.error('Error creating notification:', notificationError);

        // Show a generic toast notification
        toast({
          title: "Order Created",
          description: `New order has been created successfully.`,
          variant: "default",
        });
      }

      // Refresh the orders list if we have access to the handleLoadMore function
      if (handleLoadMore) {
        try {
          await handleLoadMore();
        } catch (error) {
          console.error('Error refreshing orders after creation:', error);
        }
      }

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

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, onSuccess]);

  return {
    createOrder,
    loading
  };
};

export default useOrderCreation;
