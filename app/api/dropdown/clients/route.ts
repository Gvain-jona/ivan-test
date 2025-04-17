import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/dropdown/clients
 * Returns a list of clients for dropdown selection
 */
export async function GET() {
  try {
    const supabase = createClient();
    
    // Get clients from the database
    const { data, error } = await supabase
      .from('clients')
      .select('id, name')
      .order('name');
    
    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json(
        { error: 'Failed to fetch clients' },
        { status: 500 }
      );
    }
    
    // Transform data to dropdown options format
    const options = data.map(client => ({
      value: client.id,
      label: client.name,
    }));
    
    return NextResponse.json(options);
  } catch (error) {
    console.error('Unexpected error fetching clients:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dropdown/clients
 * Creates a new client
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { label } = await request.json();
    
    if (!label) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 }
      );
    }
    
    // Create a new client
    const { data, error } = await supabase
      .from('clients')
      .insert({ name: label })
      .select('id, name')
      .single();
    
    if (error) {
      console.error('Error creating client:', error);
      return NextResponse.json(
        { error: 'Failed to create client' },
        { status: 500 }
      );
    }
    
    // Return the new client as a dropdown option
    return NextResponse.json({
      value: data.id,
      label: data.name,
    });
  } catch (error) {
    console.error('Unexpected error creating client:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
