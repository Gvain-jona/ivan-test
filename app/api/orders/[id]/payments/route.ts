// Next.js API Route Handler for order payments
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

// Import the updateOrderTotals function from the items route
async function updateOrderTotals(supabase: any, orderId: string) {
  console.log('[API:updateOrderTotals] Starting update for order ID:', orderId);
  try {
    // Calculate the total amount from order items
    console.log('[API:updateOrderTotals] Fetching order items');
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('total_amount')
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('[API:updateOrderTotals] Error fetching order items:', itemsError);
      return;
    }

    console.log('[API:updateOrderTotals] Order items fetched:', items);

    // Calculate the total amount
    const totalAmount = items.reduce((sum: number, item: any) => sum + (parseFloat(item.total_amount) || 0), 0);
    console.log('[API:updateOrderTotals] Calculated total amount:', totalAmount);

    // Calculate the amount paid from order payments
    console.log('[API:updateOrderTotals] Fetching order payments');
    const { data: payments, error: paymentsError } = await supabase
      .from('order_payments')
      .select('amount')
      .eq('order_id', orderId);

    if (paymentsError) {
      console.error('[API:updateOrderTotals] Error fetching order payments:', paymentsError);
      return;
    }

    console.log('[API:updateOrderTotals] Order payments fetched:', payments);

    // Calculate the amount paid
    const amountPaid = payments.reduce((sum: number, payment: any) => sum + (parseFloat(payment.amount) || 0), 0);
    console.log('[API:updateOrderTotals] Calculated amount paid:', amountPaid);

    // Calculate the balance
    const balance = totalAmount - amountPaid;
    console.log('[API:updateOrderTotals] Calculated balance:', balance);

    // Determine the payment status
    let paymentStatus = 'unpaid';
    if (totalAmount === 0) {
      paymentStatus = 'unpaid';
    } else if (amountPaid >= totalAmount) {
      paymentStatus = 'paid';
    } else if (amountPaid > 0) {
      paymentStatus = 'partially_paid';
    }
    console.log('[API:updateOrderTotals] Determined payment status:', paymentStatus);

    // Update the order
    console.log('[API:updateOrderTotals] Updating order with new totals');
    // Don't include balance as it's a generated column
    const updateData = {
      total_amount: totalAmount,
      amount_paid: amountPaid,
      payment_status: paymentStatus,
      updated_at: new Date().toISOString()
    };
    console.log('[API:updateOrderTotals] Update data:', updateData);

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('[API:updateOrderTotals] Error updating order totals:', updateError);
    } else {
      console.log('[API:updateOrderTotals] Order totals updated successfully');
    }
  } catch (error) {
    console.error('[API:updateOrderTotals] Error in updateOrderTotals:', error);
  }
}

/**
 * GET /api/orders/[id]/payments
 * Retrieves all payments for a specific order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Get payments for the order
    const { data, error } = await supabase
      .from('order_payments')
      .select('*')
      .eq('order_id', id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching order payments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch order payments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ payments: data });
  } catch (error) {
    console.error('Unexpected error in GET /api/orders/[id]/payments:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders/[id]/payments
 * Adds a new payment to an order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Await params before accessing its properties
    const { id } = await params;
    const body = await request.json();
    const { payment } = body;

    // Extract payment details
    const { amount, date, payment_method } = payment;

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Check for required fields
    if (!amount || !date || !payment_method) {
      return NextResponse.json(
        { error: 'Amount, payment date, and payment method are required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Insert the payment directly into the order_payments table
    const { data, error } = await supabase
      .from('order_payments')
      .insert({
        order_id: id,
        amount: amount,
        date: date,
        payment_method: payment_method,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding order payment:', error);
      return NextResponse.json(
        { error: 'Failed to add order payment' },
        { status: 500 }
      );
    }

    // Update the order totals
    console.log('[API] Updating order totals for order ID:', id);
    await updateOrderTotals(supabase, id);
    console.log('[API] Order totals updated successfully');

    return NextResponse.json({
      payment: data,
      message: 'Payment added successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/orders/[id]/payments:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orders/[id]/payments/[paymentId]
 * Deletes a payment from an order
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!id || !paymentId) {
      return NextResponse.json(
        { error: 'Order ID and Payment ID are required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Delete the payment
    const { error } = await supabase
      .from('order_payments')
      .delete()
      .eq('id', paymentId)
      .eq('order_id', id);

    if (error) {
      console.error('Error deleting order payment:', error);
      return NextResponse.json(
        { error: 'Failed to delete order payment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/orders/[id]/payments:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}