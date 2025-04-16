'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Order, OrderItem, OrderPayment } from '@/types/orders';
import { createClient } from '@/lib/supabase/client';
import { useOrdersPage } from '@/app/dashboard/orders/_context/OrdersPageContext';
import { showNotification, requestNotificationPermission } from '@/utils/push-notifications';

interface UseOrderCreationProps {
  onSuccess?: (orderId: string) => void;
}

export const useOrderCreation = ({ onSuccess }: UseOrderCreationProps = {}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
   * Create a new order using the create_complete_order database function
   */
  const createOrder = useCallback(async (order: Partial<Order>) => {
    try {
      setLoading(true);

      // Create Supabase client
      const supabase = createClient();

      // Validate required fields
      if (!order.client_id && !order.client_name) {
        throw new Error('Client is required');
      }

      // If we have client_name but no client_id, find or create the client
      if (!order.client_id && order.client_name) {
        console.log('Finding or creating client by name:', order.client_name);

        // First, try to find an existing client with this name
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .ilike('name', order.client_name.trim())
          .limit(1)
          .single();

        if (existingClient) {
          console.log('Found existing client:', existingClient);
          order.client_id = existingClient.id;
        } else {
          // If not found, create a new client
          const { data: newClient, error } = await supabase
            .from('clients')
            .insert({ name: order.client_name.trim() })
            .select('id')
            .single();

          if (error) {
            console.error('Error creating client:', error);
            throw new Error(`Failed to create client: ${error.message}`);
          }

          console.log('Created new client:', newClient);
          order.client_id = newClient.id;
        }
      }

      if (!order.items || order.items.length === 0) {
        throw new Error('At least one item is required');
      }

      // Process each item to ensure it has the required fields
      // and find or create items/categories as needed
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

        // If we have category_name but no category_id, find or create the category
        if (!item.category_id && item.category_name) {
          console.log(`Finding or creating category for item #${index + 1}:`, item.category_name);

          // First, try to find an existing category with this name
          const { data: existingCategory } = await supabase
            .from('categories')
            .select('id')
            .ilike('name', item.category_name.trim())
            .limit(1)
            .single();

          if (existingCategory) {
            console.log('Found existing category:', existingCategory);
            item.category_id = existingCategory.id;
          } else {
            // If not found, create a new category
            const { data: newCategory, error } = await supabase
              .from('categories')
              .insert({ name: item.category_name.trim() })
              .select('id')
              .single();

            if (error) {
              console.error('Error creating category:', error);
              throw new Error(`Failed to create category: ${error.message}`);
            }

            console.log('Created new category:', newCategory);
            item.category_id = newCategory.id;
          }
        }

        // If we have item_name but no item_id, find or create the item
        if (!item.item_id && item.item_name && item.category_id) {
          console.log(`Finding or creating item #${index + 1}:`, item.item_name);

          // First, try to find an existing item with this name and category
          const { data: existingItem } = await supabase
            .from('items')
            .select('id')
            .ilike('name', item.item_name.trim())
            .eq('category_id', item.category_id)
            .limit(1)
            .single();

          if (existingItem) {
            console.log('Found existing item:', existingItem);
            item.item_id = existingItem.id;
          } else {
            // If not found, create a new item
            const { data: newItem, error } = await supabase
              .from('items')
              .insert({
                name: item.item_name.trim(),
                category_id: item.category_id
              })
              .select('id')
              .single();

            if (error) {
              console.error('Error creating item:', error);
              throw new Error(`Failed to create item: ${error.message}`);
            }

            console.log('Created new item:', newItem);
            item.item_id = newItem.id;
          }
        }
      }

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
      const payments = ((order as any).payments || []).map((payment: any) => {
        // Ensure we have a payment_date for the database function
        // The database function expects payment_date but our form might use different field names
        const payment_date = payment.payment_date || payment.date || new Date().toISOString().split('T')[0];

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

            // Don't show a toast here - it will be shown by the OrderFormSheet component
            console.log('Order created successfully for', clientData.name);

            // Show a push notification if permission is granted
            if (Notification.permission === 'granted') {
              showNotification('New Order Created', {
                body: `New order created for ${clientData.name} with ${items.length} item(s)`,
                data: {
                  url: `/dashboard/orders?id=${data.order_id}`,
                  orderId: data.order_id,
                  clientName: clientData.name
                }
              });
            } else if (Notification.permission !== 'denied') {
              // Request permission if not already denied
              requestNotificationPermission().then(permission => {
                if (permission === 'granted') {
                  showNotification('New Order Created', {
                    body: `New order created for ${clientData.name} with ${items.length} item(s)`,
                    data: {
                      url: `/dashboard/orders?id=${data.order_id}`,
                      orderId: data.order_id,
                      clientName: clientData.name
                    }
                  });
                }
              });
            }
          }
        } else {
          console.error('Could not get client data for notification:', clientError);

          // Don't show a toast here - it will be shown by the OrderFormSheet component
          console.log('Order created successfully (generic)');
        }
      } catch (notificationError) {
        // Don't fail the order creation if notification fails
        console.error('Error creating notification:', notificationError);

        // Don't show a toast here - it will be shown by the OrderFormSheet component
        console.log('Order created successfully (fallback)');
      }

      // Refresh the orders list if we have access to the handleLoadMore function
      if (handleLoadMore) {
        try {
          console.log('Refreshing orders after creation');
          // Add a small delay to ensure the database has time to process the new order
          setTimeout(async () => {
            try {
              await handleLoadMore(false);
              console.log('Orders refreshed successfully after creation');
            } catch (refreshError) {
              console.error('Error in delayed refresh:', refreshError);
            }
          }, 500);

          // Also try an immediate refresh without showing a toast
          await handleLoadMore(false);
        } catch (error) {
          console.error('Error refreshing orders after creation:', error);
          // Try one more time after a delay
          setTimeout(async () => {
            try {
              await handleLoadMore(false);
              console.log('Orders refreshed successfully on retry');
            } catch (retryError) {
              console.error('Error in retry refresh:', retryError);
            }
          }, 1000);
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
  }, [toast, onSuccess, handleLoadMore]);

  return {
    createOrder,
    loading
  };
};

export default useOrderCreation;
