import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/analytics/retention
 * Returns client retention rate
 *
 * Query parameters:
 * - currentStartDate: Start date for current period (YYYY-MM-DD)
 * - currentEndDate: End date for current period (YYYY-MM-DD)
 * - previousStartDate: Start date for previous period (YYYY-MM-DD)
 * - previousEndDate: End date for previous period (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const currentStartDateParam = searchParams.get('currentStartDate');
    const currentEndDateParam = searchParams.get('currentEndDate');
    const previousStartDateParam = searchParams.get('previousStartDate');
    const previousEndDateParam = searchParams.get('previousEndDate');

    // Set default dates if not provided
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);

    const sixtyDaysAgo = new Date(thirtyDaysAgo);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 30);

    const ninetyDaysAgo = new Date(sixtyDaysAgo);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 30);

    // Format dates as YYYY-MM-DD
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const currentStartDate = currentStartDateParam && currentStartDateParam !== 'undefined'
      ? currentStartDateParam
      : formatDate(thirtyDaysAgo);

    const currentEndDate = currentEndDateParam && currentEndDateParam !== 'undefined'
      ? currentEndDateParam
      : formatDate(today);

    const previousStartDate = previousStartDateParam && previousStartDateParam !== 'undefined'
      ? previousStartDateParam
      : formatDate(ninetyDaysAgo);

    const previousEndDate = previousEndDateParam && previousEndDateParam !== 'undefined'
      ? previousEndDateParam
      : formatDate(sixtyDaysAgo);

    // Create Supabase client
    const supabase = await createClient();

    // Call the database function
    const { data, error } = await supabase.rpc('get_client_retention_rate', {
      start_date: currentStartDate,
      end_date: currentEndDate,
      previous_start_date: previousStartDate,
      previous_end_date: previousEndDate
    });

    if (error) {
      console.error('Error fetching client retention rate:', error);
      return NextResponse.json(
        { error: 'Failed to fetch client retention rate' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/analytics/retention:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
