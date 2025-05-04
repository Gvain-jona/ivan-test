import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/analytics/summary
 * Returns summary metrics for the analytics dashboard
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

    // Calculate previous period
    const currentStart = new Date(startDate);
    const currentEnd = new Date(endDate);
    const daysDiff = Math.floor((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));

    const prevEnd = new Date(currentStart);
    prevEnd.setDate(prevEnd.getDate() - 1);

    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - daysDiff);

    // Call the database function
    const { data, error } = await supabase.rpc('get_analytics_summary', {
      start_date: startDate,
      end_date: endDate,
      prev_start_date: prevStart.toISOString().split('T')[0],
      prev_end_date: prevEnd.toISOString().split('T')[0]
    });

    if (error) {
      console.error('Error fetching summary metrics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch summary metrics' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/analytics/summary:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
