import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/analytics/delinquency
 * Returns installment delinquency rate
 *
 * Query parameters:
 * - asOfDate: Date to calculate delinquency as of (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const asOfDateParam = searchParams.get('asOfDate');

    // Set default date if not provided
    const today = new Date();

    // Format date as YYYY-MM-DD
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const asOfDate = asOfDateParam && asOfDateParam !== 'undefined'
      ? asOfDateParam
      : formatDate(today);

    // Create Supabase client
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    // Call the database function
    const { data, error } = await supabase.rpc('get_installment_delinquency_rate', {
      as_of_date: asOfDate
    });

    if (error) {
      console.error('Error fetching installment delinquency rate:', error);
      return NextResponse.json(
        { error: 'Failed to fetch installment delinquency rate' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/analytics/delinquency:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
