// Next.js API Route Handler for generating and retrieving invoices for an order
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/orders/[id]/invoice
 * Retrieves all invoices for a specific order
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

    // Get invoices for the order
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('order_id', id)
      .order('invoice_date', { ascending: false });

    if (error) {
      console.error('Error fetching order invoices:', error);
      return NextResponse.json(
        { error: 'Failed to fetch order invoices' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in GET /api/orders/[id]/invoice:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders/[id]/invoice
 * Creates a new invoice record for an order
 * Note: This doesn't generate the PDF, it just records the metadata
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { fileUrl, storagePath, settings, isProforma, createdBy } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!fileUrl || !storagePath || !createdBy) {
      return NextResponse.json(
        { error: 'File URL, storage path, and creator are required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Check if order exists
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', id)
      .single();

    if (orderError || !orderData) {
      console.error('Error checking order:', orderError);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Create invoice record
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        order_id: id,
        file_url: fileUrl,
        storage_path: storagePath,
        settings: settings || {},
        is_proforma: isProforma || false,
        created_by: createdBy
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invoice record:', error);
      return NextResponse.json(
        { error: 'Failed to create invoice record' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/orders/[id]/invoice:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
