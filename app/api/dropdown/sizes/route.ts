import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/dropdown/sizes
 * Returns a list of sizes for dropdown selection
 */
export async function GET() {
  try {
    const supabase = createClient();
    
    // Get sizes from the database
    const { data, error } = await supabase
      .from('sizes')
      .select('id, name')
      .order('name');
    
    if (error) {
      console.error('Error fetching sizes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sizes' },
        { status: 500 }
      );
    }
    
    // Transform data to dropdown options format
    const options = data.map(size => ({
      value: size.id,
      label: size.name,
    }));
    
    return NextResponse.json(options);
  } catch (error) {
    console.error('Unexpected error fetching sizes:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dropdown/sizes
 * Creates a new size
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { label } = await request.json();
    
    if (!label) {
      return NextResponse.json(
        { error: 'Size name is required' },
        { status: 400 }
      );
    }
    
    // Create a new size
    const { data, error } = await supabase
      .from('sizes')
      .insert({ name: label })
      .select('id, name')
      .single();
    
    if (error) {
      console.error('Error creating size:', error);
      return NextResponse.json(
        { error: 'Failed to create size' },
        { status: 500 }
      );
    }
    
    // Return the new size as a dropdown option
    return NextResponse.json({
      value: data.id,
      label: data.name,
    });
  } catch (error) {
    console.error('Unexpected error creating size:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
