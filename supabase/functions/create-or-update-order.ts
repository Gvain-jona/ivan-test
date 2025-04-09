import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface OrderItem {
  item_id: string;
  category_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  profit_amount: number;
  labor_amount: number;
}

interface OrderPayment {
  amount: number;
  payment_date: string;
  payment_type: 'cash' | 'bank_transfer' | 'mobile_payment' | 'cheque';
}

interface OrderData {
  id?: string;
  client_id: string;
  date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled' | 'paused';
  payment_status: 'unpaid' | 'partially_paid' | 'paid';
  total_amount: number;
  amount_paid: number;
  balance: number;
  order_items: OrderItem[];
  payments?: OrderPayment[];
}

serve(async (req) => {
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 405,
        }
      )
    }

    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Create client with Auth context of the user that called the function.
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user who called this function
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError) {
      return new Response(JSON.stringify({ error: userError.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Parse request body
    const orderData: OrderData = await req.json();
    
    // Validate required fields
    if (!orderData.client_id || !orderData.date || !orderData.status || !orderData.payment_status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Begin transaction
    const { data: transaction, error: transactionError } = await supabaseClient.rpc('begin_transaction');
    
    if (transactionError) {
      return new Response(
        JSON.stringify({ error: transactionError.message }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    try {
      let orderId = orderData.id;
      let isNewOrder = !orderId;

      // Create or update order
      if (isNewOrder) {
        // Create new order
        const { data: newOrder, error: newOrderError } = await supabaseClient
          .from('orders')
          .insert({
            client_id: orderData.client_id,
            date: orderData.date,
            status: orderData.status,
            payment_status: orderData.payment_status,
            total_amount: orderData.total_amount,
            amount_paid: orderData.amount_paid,
            balance: orderData.balance,
            created_by: user.id
          })
          .select('id')
          .single();

        if (newOrderError) {
          throw new Error(`Error creating order: ${newOrderError.message}`);
        }

        orderId = newOrder.id;
      } else {
        // Update existing order
        const { error: updateOrderError } = await supabaseClient
          .from('orders')
          .update({
            client_id: orderData.client_id,
            date: orderData.date,
            status: orderData.status,
            payment_status: orderData.payment_status,
            total_amount: orderData.total_amount,
            amount_paid: orderData.amount_paid,
            balance: orderData.balance,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (updateOrderError) {
          throw new Error(`Error updating order: ${updateOrderError.message}`);
        }

        // Delete existing order items for update
        const { error: deleteItemsError } = await supabaseClient
          .from('order_items')
          .delete()
          .eq('order_id', orderId);

        if (deleteItemsError) {
          throw new Error(`Error deleting order items: ${deleteItemsError.message}`);
        }
      }

      // Insert order items
      if (orderData.order_items && orderData.order_items.length > 0) {
        const orderItemsWithOrderId = orderData.order_items.map(item => ({
          ...item,
          order_id: orderId
        }));

        const { error: insertItemsError } = await supabaseClient
          .from('order_items')
          .insert(orderItemsWithOrderId);

        if (insertItemsError) {
          throw new Error(`Error inserting order items: ${insertItemsError.message}`);
        }
      }

      // Handle payments (if any)
      if (orderData.payments && orderData.payments.length > 0) {
        const paymentsWithOrderId = orderData.payments.map(payment => ({
          ...payment,
          order_id: orderId
        }));

        const { error: insertPaymentsError } = await supabaseClient
          .from('order_payments')
          .insert(paymentsWithOrderId);

        if (insertPaymentsError) {
          throw new Error(`Error inserting payments: ${insertPaymentsError.message}`);
        }
      }

      // Commit transaction
      const { error: commitError } = await supabaseClient.rpc('commit_transaction');
      
      if (commitError) {
        throw new Error(`Error committing transaction: ${commitError.message}`);
      }

      // Create a notification for a new order
      if (isNewOrder) {
        const { data: clientData, error: clientError } = await supabaseClient
          .from('clients')
          .select('name')
          .eq('id', orderData.client_id)
          .single();

        if (!clientError && clientData) {
          const clientName = clientData.name;
          const message = `New order added, Client: ${clientName}, ${orderData.order_items.length} item(s)`;
          
          // Get admin and manager users to notify
          const { data: usersToNotify, error: usersError } = await supabaseClient
            .from('users')
            .select('id')
            .in('role', ['admin', 'manager']);

          if (!usersError && usersToNotify) {
            const notifications = usersToNotify.map(notifyUser => ({
              user_id: notifyUser.id,
              type: 'new_order',
              message,
              push_message: message,
              data: JSON.stringify({ order_id: orderId }),
              status: user.id === notifyUser.id ? 'read' : 'unread'
            }));

            // Insert notifications (don't throw error if this fails)
            await supabaseClient
              .from('notifications')
              .insert(notifications);
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          id: orderId, 
          message: isNewOrder ? 'Order created successfully' : 'Order updated successfully'
        }),
        { headers: { 'Content-Type': 'application/json' } },
      )
    } catch (error) {
      // Rollback transaction on error
      await supabaseClient.rpc('rollback_transaction');
      
      throw error;
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500
      },
    )
  }
}) 