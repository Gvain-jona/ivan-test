import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

/**
 * GET /api/categories
 * Returns a list of categories for dropdowns
 */
export async function GET() {
  try {
    // Create Supabase client
    const supabase = await createClient();
    
    // Fetch categories
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');
    
    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }
    
    // Transform data for combobox format
    const categories = data.map(category => ({
      value: category.id,
      label: category.name
    }));
    
    // Create response with cache headers
    const response = NextResponse.json(categories);
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=600');
    
    return response;
  } catch (error) {
    console.error('Unexpected error in GET /api/categories:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
