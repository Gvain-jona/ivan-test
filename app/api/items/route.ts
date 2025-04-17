import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

/**
 * GET /api/items
 * Returns a list of items for dropdowns
 * Optional query parameter: categoryId
 */
export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Start building the query
    let query = supabase
      .from('items')
      .select('id, name, category_id')
      .order('name');
    
    // Filter by category if provided
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching items:', error);
      return NextResponse.json(
        { error: 'Failed to fetch items' },
        { status: 500 }
      );
    }
    
    // Transform data for combobox format
    const items = data.map(item => ({
      value: item.id,
      label: item.name,
      categoryId: item.category_id
    }));
    
    // Create response with cache headers
    const response = NextResponse.json(items);
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=600');
    
    return response;
  } catch (error) {
    console.error('Unexpected error in GET /api/items:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
