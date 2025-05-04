import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

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

    // Create Supabase client
    const supabase = await createClient();

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

    // Calculate total revenue for percentage calculations
    const totalRevenue = data.reduce((sum, category) => sum + Number(category.total_revenue), 0);

    // Add percentage of total revenue to each category
    const categoriesWithPercentage = data.map(category => ({
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
