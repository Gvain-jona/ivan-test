import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Updates the invoice_generated_at timestamp for an order
 * This is used to track when an invoice was first generated
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params as required by Next.js 15
    const { id: orderId } = await params;

    // Create Supabase client (async in Next.js 15)
    const supabase = await createClient();
    
    // Check if the order exists
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, invoice_generated_at')
      .eq('id', orderId)
      .single();
    
    if (orderError) {
      console.error('Error fetching order for invoice timestamp:', orderError);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Only update if invoice_generated_at is null
    if (!order.invoice_generated_at) {
      // Update the invoice_generated_at timestamp
      const { error: updateError } = await supabase
        .from('orders')
        .update({ invoice_generated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating invoice timestamp:', updateError);
        return NextResponse.json(
          { error: 'Failed to update invoice timestamp' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating invoice timestamp:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
