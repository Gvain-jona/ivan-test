import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError, handleSupabaseError } from '@/lib/api/error-handler';
import { createApiResponse } from '@/lib/api/response-handler';

/**
 * GET /api/material-purchases/[id]/optimized
 * Optimized endpoint for fetching a single material purchase with all related data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 15, params is now async and needs to be awaited
    const { id } = await params;

    if (!id) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Material purchase ID is required',
        { param: 'id' }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includePayments = searchParams.get('include_payments') !== 'false';
    const includeNotes = searchParams.get('include_notes') !== 'false';
    const includeInstallments = searchParams.get('include_installments') !== 'false';

    // Create Supabase client
    const supabase = await createClient();

    // Get material purchase
    const { data: purchase, error } = await supabase
      .from('material_purchases')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    if (!purchase) {
      return handleApiError(
        'NOT_FOUND',
        'Material purchase not found',
        { param: 'id' }
      );
    }

    // Fetch related data in parallel
    const [paymentsResult, notesResult, installmentsResult] = await Promise.all([
      includePayments 
        ? supabase
            .from('material_payments')
            .select('*')
            .eq('purchase_id', id)
            .order('date', { ascending: false })
        : { data: [] },
      includeNotes
        ? supabase
            .from('material_purchase_notes')
            .select('*')
            .eq('purchase_id', id)
            .order('created_at', { ascending: false })
        : { data: [] },
      includeInstallments
        ? supabase
            .from('material_installments')
            .select('*')
            .eq('purchase_id', id)
            .order('installment_number', { ascending: true })
        : { data: [] }
    ]);

    // Combine purchase with related data
    const purchaseWithRelatedData = {
      ...purchase,
      payments: paymentsResult.data || [],
      purchase_notes: notesResult.data || [],
      installments: installmentsResult.data || []
    };

    // Return the combined results
    return createApiResponse({
      purchase: purchaseWithRelatedData
    });
  } catch (error) {
    console.error('Error in GET /api/material-purchases/[id]/optimized:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while fetching the material purchase'
    );
  }
}
