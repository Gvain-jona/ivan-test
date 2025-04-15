// Next.js API Route Handler for a specific invoice
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/invoices/[id]
 * Retrieves a specific invoice by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Get invoice with related data
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        orders:order_id (
          *,
          clients:client_id (id, name)
        ),
        profiles:created_by (id, full_name, email)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching invoice:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invoice' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in GET /api/invoices/[id]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
