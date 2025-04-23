import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

/**
 * Updates the invoice_generated_at timestamp for an order
 * This is used to track when an invoice was first generated
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    
    // Create Supabase client
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Check if the order exists
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, invoice_generated_at')
      .eq('id', orderId)
      .single();
    
    if (orderError) {
      return NextResponse.json(
        { error: 'Order not found', details: orderError.message },
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
        return NextResponse.json(
          { error: 'Failed to update invoice timestamp', details: updateError.message },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating invoice timestamp:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
