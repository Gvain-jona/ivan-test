import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

/**
 * GET /api/clients
 * Returns a list of clients for dropdowns
 */
export async function GET() {
  try {
    // Create Supabase client
    const supabase = await createClient();
    
    // Fetch clients
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
    
    // Transform data for combobox format
    const clients = data.map(client => ({
      value: client.id,
      label: client.name
    }));
    
    // Create response with cache headers
    const response = NextResponse.json(clients);
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=600');
    
    return response;
  } catch (error) {
    console.error('Unexpected error in GET /api/clients:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
