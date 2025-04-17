import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/dropdown/items
 * Returns a list of items for dropdown selection
 * Query parameters:
 * - categoryId: Filter items by category ID
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    
    // Build the query
    let query = supabase
      .from('items')
      .select('id, name, category_id');
    
    // Apply category filter if provided
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    // Execute the query
    const { data, error } = await query.order('name');
    
    if (error) {
      console.error('Error fetching items:', error);
      return NextResponse.json(
        { error: 'Failed to fetch items' },
        { status: 500 }
      );
    }
    
    // Transform data to dropdown options format
    const options = data.map(item => ({
      value: item.id,
      label: item.name,
      categoryId: item.category_id,
    }));
    
    return NextResponse.json(options);
  } catch (error) {
    console.error('Unexpected error fetching items:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dropdown/items
 * Creates a new item
 * Body parameters:
 * - label: Item name
 * - parentId: Category ID
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { label, parentId } = await request.json();
    
    if (!label) {
      return NextResponse.json(
        { error: 'Item name is required' },
        { status: 400 }
      );
    }
    
    if (!parentId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }
    
    // Create a new item
    const { data, error } = await supabase
      .from('items')
      .insert({ 
        name: label,
        category_id: parentId
      })
      .select('id, name, category_id')
      .single();
    
    if (error) {
      console.error('Error creating item:', error);
      return NextResponse.json(
        { error: 'Failed to create item' },
        { status: 500 }
      );
    }
    
    // Return the new item as a dropdown option
    return NextResponse.json({
      value: data.id,
      label: data.name,
      categoryId: data.category_id,
    });
  } catch (error) {
    console.error('Unexpected error creating item:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
