import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/analytics/materials
 * Returns material purchase metrics by supplier
 *
 * Query parameters:
 * - startDate: Start date for the metrics (YYYY-MM-DD)
 * - endDate: End date for the metrics (YYYY-MM-DD)
 * - limit: Maximum number of suppliers to return (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    // Set default dates if not provided
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);

    // Format dates as YYYY-MM-DD
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const startDate = startDateParam && startDateParam !== 'undefined'
      ? startDateParam
      : formatDate(thirtyDaysAgo);

    const endDate = endDateParam && endDateParam !== 'undefined'
      ? endDateParam
      : formatDate(today);

    if (isNaN(limit) || limit < 1) {
      return NextResponse.json(
        { error: 'limit must be a positive number' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Call the database function
    const { data, error } = await supabase.rpc('get_materials_by_supplier', {
      start_date: startDate,
      end_date: endDate,
      limit_count: limit
    });

    if (error) {
      console.error('Error fetching materials by supplier:', error);
      return NextResponse.json(
        { error: 'Failed to fetch materials by supplier' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/analytics/materials:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
