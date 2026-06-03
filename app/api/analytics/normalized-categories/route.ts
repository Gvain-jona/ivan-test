import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { parseAnalyticsDates } from '@/lib/cache/analytics-cache';

/**
 * GET /api/analytics/normalized-categories
 * Returns normalized category performance metrics
 *
 * Query parameters:
 * - startDate: Start date for the metrics (YYYY-MM-DD)
 * - endDate: End date for the metrics (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);

    const { startDate, endDate } = parseAnalyticsDates(searchParams);

    // Create Supabase client
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    // Call the database function
    const { data, error } = await supabase.rpc('get_normalized_category_performance', {
      start_date: startDate,
      end_date: endDate
    });

    if (error) {
      console.error('Error fetching normalized category performance:', error);
      return NextResponse.json(
        { error: 'Failed to fetch normalized category performance' },
        { status: 500 }
      );
    }

    type CategoryRow = { total_revenue: number | string; [key: string]: unknown };
    const rows = data as CategoryRow[];
    // Calculate total revenue for percentage calculations
    const totalRevenue = rows.reduce((sum: number, category: CategoryRow) => sum + Number(category.total_revenue), 0);

    // Add percentage of total revenue to each category
    const categoriesWithPercentage = rows.map((category: CategoryRow) => ({
      ...category,
      percentage: totalRevenue > 0 ? (Number(category.total_revenue) / totalRevenue) * 100 : 0
    }));

    return NextResponse.json(categoriesWithPercentage);
  } catch (error) {
    console.error('Unexpected error in GET /api/analytics/normalized-categories:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
