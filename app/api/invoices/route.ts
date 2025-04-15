// Next.js API Route Handler for invoices
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/invoices
 * Retrieves a list of invoices with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const orderId = searchParams.get('orderId') || null;
    const startDate = searchParams.get('startDate') || null;
    const endDate = searchParams.get('endDate') || null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Create Supabase client
    const supabase = await createClient();

    // Start building the query
    let query = supabase
      .from('invoices')
      .select(`
        *,
        orders:order_id (
          id,
          clients:client_id (id, name)
        ),
        profiles:created_by (id, full_name, email)
      `, { count: 'exact' });

    // Apply filters
    if (orderId) {
      query = query.eq('order_id', orderId);
    }

    if (startDate) {
      query = query.gte('invoice_date', startDate);
    }

    if (endDate) {
      query = query.lte('invoice_date', endDate);
    }

    // Apply pagination
    query = query
      .order('invoice_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Execute the query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching invoices:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invoices' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      count,
      limit,
      offset
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/invoices:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
