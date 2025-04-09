// Next.js API Route Handler for order payments
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

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
      .order('payment_date', { ascending: false });

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
    const { id } = params;
    const body = await request.json();
    const { amount, paymentDate, paymentType } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!amount || !paymentDate || !paymentType) {
      return NextResponse.json(
        { error: 'Amount, payment date, and payment type are required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Call the database function to add payment
    const { data, error } = await supabase.rpc('add_order_payment', {
      p_order_id: id,
      p_amount: amount,
      p_payment_date: paymentDate,
      p_payment_type: paymentType
    });

    if (error) {
      console.error('Error adding order payment:', error);
      return NextResponse.json(
        { error: 'Failed to add order payment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data,
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