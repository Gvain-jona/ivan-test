import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

/**
 * GET /api/test-db
 * Test endpoint to check database schema and data
 */
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient();

    // Get database schema for orders table
    const { data: ordersSchema, error: ordersSchemaError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);

    if (ordersSchemaError) {
      console.error('Error fetching orders schema:', ordersSchemaError);
      return NextResponse.json(
        { error: 'Failed to fetch orders schema' },
        { status: 500 }
      );
    }

    // Get database schema for clients table
    const { data: clientsSchema, error: clientsSchemaError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);

    if (clientsSchemaError) {
      console.error('Error fetching clients schema:', clientsSchemaError);
      return NextResponse.json(
        { error: 'Failed to fetch clients schema' },
        { status: 500 }
      );
    }

    // Get database schema for order_items table
    const { data: orderItemsSchema, error: orderItemsSchemaError } = await supabase
      .from('order_items')
      .select('*')
      .limit(1);

    if (orderItemsSchemaError) {
      console.error('Error fetching order_items schema:', orderItemsSchemaError);
      return NextResponse.json(
        { error: 'Failed to fetch order_items schema' },
        { status: 500 }
      );
    }

    // Get database schema for order_payments table
    const { data: orderPaymentsSchema, error: orderPaymentsSchemaError } = await supabase
      .from('order_payments')
      .select('*')
      .limit(1);

    if (orderPaymentsSchemaError) {
      console.error('Error fetching order_payments schema:', orderPaymentsSchemaError);
      return NextResponse.json(
        { error: 'Failed to fetch order_payments schema' },
        { status: 500 }
      );
    }

    // Get database schema for invoice_settings table
    const { data: invoiceSettingsSchema, error: invoiceSettingsSchemaError } = await supabase
      .from('invoice_settings')
      .select('*')
      .limit(1);

    if (invoiceSettingsSchemaError) {
      console.error('Error fetching invoice_settings schema:', invoiceSettingsSchemaError);
      // Don't return an error, just log it
    }

    // Get all tables in the database
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables');

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      return NextResponse.json(
        { error: 'Failed to fetch tables' },
        { status: 500 }
      );
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Error fetching user:', userError);
    }

    return NextResponse.json({
      tables,
      ordersSchema: ordersSchema ? Object.keys(ordersSchema[0]) : [],
      clientsSchema: clientsSchema ? Object.keys(clientsSchema[0]) : [],
      orderItemsSchema: orderItemsSchema ? Object.keys(orderItemsSchema[0]) : [],
      orderPaymentsSchema: orderPaymentsSchema ? Object.keys(orderPaymentsSchema[0]) : [],
      invoiceSettingsSchema: invoiceSettingsSchema ? Object.keys(invoiceSettingsSchema[0]) : [],
      user: user ? { id: user.id, email: user.email } : null,
    });
  } catch (error) {
    console.error('Error in test-db API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
