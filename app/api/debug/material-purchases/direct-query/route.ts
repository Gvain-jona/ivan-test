import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createApiResponse, handleApiError, handleSupabaseError } from '@/lib/api-utils';

/**
 * GET /api/debug/material-purchases/direct-query
 * Debug endpoint to directly query material purchases with unpaid or partially paid status
 */
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient();

    // Get material purchases with unpaid or partially paid status
    const { data: unpaidPurchases, error: unpaidError } = await supabase
      .from('material_purchases')
      .select('*')
      .in('payment_status', ['unpaid', 'partially_paid']);

    if (unpaidError) {
      return handleSupabaseError(unpaidError);
    }

    // Return the results
    return createApiResponse({
      unpaidPurchases: unpaidPurchases || [],
      count: unpaidPurchases?.length || 0
    });
  } catch (error: any) {
    console.error('Error in GET /api/debug/material-purchases/direct-query:', error);
    return handleApiError(
      'SERVER_ERROR',
      error.message || 'An error occurred while fetching debug information'
    );
  }
}
