import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createApiResponse, handleApiError, handleSupabaseError } from '@/lib/api-utils';

/**
 * GET /api/debug/material-purchases
 * Debug endpoint to check material purchases with installment plans
 */
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient();

    // Get all material purchases
    const { data: allPurchases, error: allError } = await supabase
      .from('material_purchases')
      .select('*');

    if (allError) {
      return handleSupabaseError(allError);
    }

    // Get material purchases with installment plans
    const { data: installmentPurchases, error: installmentError } = await supabase
      .from('material_purchases')
      .select('*')
      .eq('installment_plan', true);

    if (installmentError) {
      return handleSupabaseError(installmentError);
    }

    // Get material purchases with next payment date
    const { data: nextPaymentPurchases, error: nextPaymentError } = await supabase
      .from('material_purchases')
      .select('*')
      .not('next_payment_date', 'is', null);

    if (nextPaymentError) {
      return handleSupabaseError(nextPaymentError);
    }

    // Get material purchases with unpaid or partially paid status
    const { data: unpaidPurchases, error: unpaidError } = await supabase
      .from('material_purchases')
      .select('*')
      .in('payment_status', ['unpaid', 'partially_paid']);

    if (unpaidError) {
      return handleSupabaseError(unpaidError);
    }

    // Get installments
    const { data: installments, error: installmentsError } = await supabase
      .from('material_installments')
      .select('*');

    if (installmentsError) {
      return handleSupabaseError(installmentsError);
    }

    // Return the results
    return createApiResponse({
      debug: {
        allPurchasesCount: allPurchases?.length || 0,
        installmentPurchasesCount: installmentPurchases?.length || 0,
        nextPaymentPurchasesCount: nextPaymentPurchases?.length || 0,
        unpaidPurchasesCount: unpaidPurchases?.length || 0,
        installmentsCount: installments?.length || 0,
        installmentPurchases: installmentPurchases || [],
        nextPaymentPurchases: nextPaymentPurchases || [],
        installments: installments || []
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/debug/material-purchases:', error);
    return handleApiError(
      'SERVER_ERROR',
      error.message || 'An error occurred while fetching debug information'
    );
  }
}
