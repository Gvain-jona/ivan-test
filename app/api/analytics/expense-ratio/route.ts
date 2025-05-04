import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/analytics/expense-ratio
 * Returns expense to revenue ratio by period
 *
 * Query parameters:
 * - period: Period type (day, week, month, year)
 * - startDate: Start date for the metrics (YYYY-MM-DD)
 * - endDate: End date for the metrics (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
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

    if (!['day', 'week', 'month', 'year'].includes(period)) {
      return NextResponse.json(
        { error: 'period must be one of: day, week, month, year' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Call the database function
    const { data, error } = await supabase.rpc('get_expense_to_revenue_ratio', {
      period_type: period,
      start_date: startDate,
      end_date: endDate
    });

    if (error) {
      console.error('Error fetching expense to revenue ratio:', error);
      return NextResponse.json(
        { error: 'Failed to fetch expense to revenue ratio' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/analytics/expense-ratio:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
