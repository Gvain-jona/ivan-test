import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { parseAnalyticsDates } from '@/lib/cache/analytics-cache';

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
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    const { startDate, endDate } = parseAnalyticsDates(searchParams);

    if (isNaN(limit) || limit < 1) {
      return NextResponse.json(
        { error: 'limit must be a positive number' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


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
