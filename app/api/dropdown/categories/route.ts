import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/dropdown/categories
 * Returns a list of categories for dropdown selection
 */
export async function GET() {
  try {
    const supabase = createClient();
    
    // Get categories from the database
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
    
    // Transform data to dropdown options format
    const options = data.map(category => ({
      value: category.id,
      label: category.name,
    }));
    
    return NextResponse.json(options);
  } catch (error) {
    console.error('Unexpected error fetching categories:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dropdown/categories
 * Creates a new category
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { label } = await request.json();
    
    if (!label) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }
    
    // Create a new category
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: label })
      .select('id, name')
      .single();
    
    if (error) {
      console.error('Error creating category:', error);
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      );
    }
    
    // Return the new category as a dropdown option
    return NextResponse.json({
      value: data.id,
      label: data.name,
    });
  } catch (error) {
    console.error('Unexpected error creating category:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
