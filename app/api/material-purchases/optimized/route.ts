import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError, handleSupabaseError } from '@/lib/api/error-handler';
import { createApiResponse } from '@/lib/api/response-handler';

/**
 * GET /api/material-purchases/optimized
 * Optimized endpoint for fetching material purchases with all related data
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const supplier = searchParams.get('supplier');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const paymentStatus = searchParams.get('payment_status');
    const includePayments = searchParams.get('include_payments') === 'true';
    const includeNotes = searchParams.get('include_notes') === 'true';
    const includeInstallments = searchParams.get('include_installments') === 'true';

    // Calculate offset
    const offset = (page - 1) * limit;

    // Create Supabase client
    const supabase = await createClient();

    // Fetch purchases with pagination and filtering
    let query = supabase
      .from('material_purchases')
      .select('*', { count: 'exact' });

    // Apply filters if provided
    if (supplier) {
      query = query.ilike('supplier_name', `%${supplier}%`);
    }
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('date', { ascending: false });

    // Execute the query
    const { data: purchases, error, count } = await query;

    if (error) {
      return handleSupabaseError(error);
    }

    // If no purchases found, return empty results
    if (!purchases || purchases.length === 0) {
      return createApiResponse({
        purchases: [],
        total: 0,
        page,
        limit
      });
    }

    // Extract purchase IDs for related data queries
    const purchaseIds = purchases.map(purchase => purchase.id);

    // Fetch related data in parallel if requested
    const [paymentsResult, notesResult, installmentsResult] = await Promise.all([
      includePayments 
        ? supabase
            .from('material_payments')
            .select('*')
            .in('purchase_id', purchaseIds)
            .order('date', { ascending: false })
        : { data: [] },
      includeNotes
        ? supabase
            .from('material_purchase_notes')
            .select('*')
            .in('purchase_id', purchaseIds)
            .order('created_at', { ascending: false })
        : { data: [] },
      includeInstallments
        ? supabase
            .from('material_installments')
            .select('*')
            .in('purchase_id', purchaseIds)
            .order('installment_number', { ascending: true })
        : { data: [] }
    ]);

    // Group related data by purchase ID for efficient lookup
    const paymentsByPurchaseId = new Map();
    const notesByPurchaseId = new Map();
    const installmentsByPurchaseId = new Map();

    // Process payments
    if (paymentsResult.data) {
      paymentsResult.data.forEach(payment => {
        if (!paymentsByPurchaseId.has(payment.purchase_id)) {
          paymentsByPurchaseId.set(payment.purchase_id, []);
        }
        paymentsByPurchaseId.get(payment.purchase_id).push(payment);
      });
    }

    // Process notes
    if (notesResult.data) {
      notesResult.data.forEach(note => {
        if (!notesByPurchaseId.has(note.purchase_id)) {
          notesByPurchaseId.set(note.purchase_id, []);
        }
        notesByPurchaseId.get(note.purchase_id).push(note);
      });
    }

    // Process installments
    if (installmentsResult.data) {
      installmentsResult.data.forEach(installment => {
        if (!installmentsByPurchaseId.has(installment.purchase_id)) {
          installmentsByPurchaseId.set(installment.purchase_id, []);
        }
        installmentsByPurchaseId.get(installment.purchase_id).push(installment);
      });
    }

    // Combine purchases with their related data
    const purchasesWithRelatedData = purchases.map(purchase => ({
      ...purchase,
      payments: paymentsByPurchaseId.get(purchase.id) || [],
      purchase_notes: notesByPurchaseId.get(purchase.id) || [],
      installments: installmentsByPurchaseId.get(purchase.id) || []
    }));

    // Return the combined results
    return createApiResponse({
      purchases: purchasesWithRelatedData,
      total: count || 0,
      page,
      limit
    });
  } catch (error) {
    console.error('Error in GET /api/material-purchases/optimized:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while fetching material purchases'
    );
  }
}
