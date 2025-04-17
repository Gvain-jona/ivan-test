import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/dropdown/suppliers
 * Returns a list of suppliers for dropdown selection
 */
export async function GET() {
  try {
    const supabase = createClient();
    
    // Get suppliers from the database
    const { data, error } = await supabase
      .from('suppliers')
      .select('id, name')
      .order('name');
    
    if (error) {
      console.error('Error fetching suppliers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch suppliers' },
        { status: 500 }
      );
    }
    
    // Transform data to dropdown options format
    const options = data.map(supplier => ({
      value: supplier.id,
      label: supplier.name,
    }));
    
    return NextResponse.json(options);
  } catch (error) {
    console.error('Unexpected error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dropdown/suppliers
 * Creates a new supplier
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { label } = await request.json();
    
    if (!label) {
      return NextResponse.json(
        { error: 'Supplier name is required' },
        { status: 400 }
      );
    }
    
    // Create a new supplier
    const { data, error } = await supabase
      .from('suppliers')
      .insert({ name: label })
      .select('id, name')
      .single();
    
    if (error) {
      console.error('Error creating supplier:', error);
      return NextResponse.json(
        { error: 'Failed to create supplier' },
        { status: 500 }
      );
    }
    
    // Return the new supplier as a dropdown option
    return NextResponse.json({
      value: data.id,
      label: data.name,
    });
  } catch (error) {
    console.error('Unexpected error creating supplier:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
