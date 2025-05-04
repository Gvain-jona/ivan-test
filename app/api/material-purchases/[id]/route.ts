import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { handleApiError, handleSupabaseError } from '@/lib/api/error-handler';
import { createApiResponse } from '@/lib/api/response-handler';

/**
 * GET /api/material-purchases/[id]
 * Retrieves a single material purchase with all related details
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

    // Create Supabase client
    const supabase = await createClient();

    // Get material purchase
    const { data, error } = await supabase
      .from('material_purchases')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    if (!data) {
      return handleApiError(
        'NOT_FOUND',
        'Material purchase not found',
        { param: 'id' }
      );
    }

    // Fetch all related data in parallel for better performance
    const [paymentsResult, notesResult, installmentsResult] = await Promise.all([
      supabase
        .from('material_payments')
        .select('*')
        .eq('purchase_id', id)
        .order('date', { ascending: false }),
      supabase
        .from('material_purchase_notes')
        .select('*')
        .eq('purchase_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('material_installments')
        .select('*')
        .eq('purchase_id', id)
        .order('installment_number', { ascending: true })
    ]);

    // Log any errors but continue with the data we have
    if (paymentsResult.error) {
      console.error('Error fetching material payments:', paymentsResult.error);
    }
    if (notesResult.error) {
      console.error('Error fetching material purchase notes:', notesResult.error);
    }
    if (installmentsResult.error) {
      console.error('Error fetching material installments:', installmentsResult.error);
    }

    // Return the purchase with all related data
    return createApiResponse({
      purchase: {
        ...data,
        payments: paymentsResult.data || [],
        purchase_notes: notesResult.data || [],
        installments: installmentsResult.data || []
      }
    });
  } catch (error) {
    console.error('Error in GET /api/material-purchases/[id]:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while fetching the material purchase'
    );
  }
}

/**
 * PUT /api/material-purchases/[id]
 * Updates an existing material purchase
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 15, params is now async and needs to be awaited
    const { id } = await params;
    const body = await request.json();
    const {
      supplier_name,
      material_name,
      date,
      quantity,
      unit, // Add unit field
      unit_price,
      total_amount,
      amount_paid,
      notes
    } = body;

    if (!id) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Material purchase ID is required',
        { param: 'id' }
      );
    }

    // Validate required fields
    if (!supplier_name) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Supplier name is required',
        { param: 'supplier_name' }
      );
    }

    if (!material_name) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Material name is required',
        { param: 'material_name' }
      );
    }

    if (!date) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Date is required',
        { param: 'date' }
      );
    }

    if (!total_amount || isNaN(Number(total_amount)) || Number(total_amount) <= 0) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Total amount must be a positive number',
        { param: 'total_amount' }
      );
    }

    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Quantity must be a positive number',
        { param: 'quantity' }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Check if the purchase exists
    const { data: existingPurchase, error: checkError } = await supabase
      .from('material_purchases')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingPurchase) {
      return handleApiError(
        'NOT_FOUND',
        'Material purchase not found',
        { param: 'id' }
      );
    }

    // Determine payment status
    const numericTotalAmount = Number(total_amount);
    const numericAmountPaid = Number(amount_paid || 0);
    let payment_status = 'unpaid';

    if (numericAmountPaid >= numericTotalAmount) {
      payment_status = 'paid';
    } else if (numericAmountPaid > 0) {
      payment_status = 'partially_paid';
    }

    // Update the purchase
    const { data: updatedPurchase, error: updateError } = await supabase
      .from('material_purchases')
      .update({
        supplier_name,
        material_name,
        date,
        quantity,
        unit, // Add unit field
        unit_price: unit_price || (quantity > 0 ? numericTotalAmount / Number(quantity) : 0),
        total_amount: numericTotalAmount,
        amount_paid: numericAmountPaid,
        payment_status,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating material purchase:', updateError);
      return handleSupabaseError(updateError);
    }

    return createApiResponse({
      purchase: updatedPurchase,
      message: 'Material purchase updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /api/material-purchases/[id]:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while updating the material purchase'
    );
  }
}

/**
 * DELETE /api/material-purchases/[id]
 * Deletes a material purchase
 */
export async function DELETE(
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

    // Create Supabase client
    const supabase = await createClient();

    // Check if the purchase exists
    const { data: existingPurchase, error: checkError } = await supabase
      .from('material_purchases')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingPurchase) {
      return handleApiError(
        'NOT_FOUND',
        'Material purchase not found',
        { param: 'id' }
      );
    }

    // Delete the purchase (this will cascade delete payments due to foreign key constraint)
    const { error: deleteError } = await supabase
      .from('material_purchases')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting material purchase:', deleteError);
      return handleSupabaseError(deleteError);
    }

    return createApiResponse({
      message: 'Material purchase deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/material-purchases/[id]:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while deleting the material purchase'
    );
  }
}
