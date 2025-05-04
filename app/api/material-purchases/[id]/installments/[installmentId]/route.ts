import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-utils';
import { handleApiError, handleSupabaseError } from '@/lib/api/error-handler';
import { createApiResponse } from '@/lib/api/response-handler';

/**
 * GET /api/material-purchases/:id/installments/:installmentId
 * Get a specific installment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; installmentId: string }> }
) {
  // In Next.js 15, params is now async and needs to be awaited
  const { id, installmentId } = await params;

  try {
    // Create Supabase client
    const supabase = await createClient();

    // Get authenticated user
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        console.error('Error getting authenticated user:', error);
        return handleApiError(
          'AUTHENTICATION_ERROR',
          'Authentication required to view installment'
        );
      }
    } catch (authError) {
      console.error('Exception getting authenticated user:', authError);
      return handleApiError(
        'AUTHENTICATION_ERROR',
        'Authentication required to view installment'
      );
    }

    // Get the installment
    const { data: installment, error } = await supabase
      .from('material_installments')
      .select('*')
      .eq('id', installmentId)
      .eq('purchase_id', id)
      .single();

    if (error) {
      console.error('Error fetching installment:', error);
      return handleSupabaseError(error);
    }

    return createApiResponse({ installment });
  } catch (error: any) {
    console.error('Error in GET /api/material-purchases/:id/installments/:installmentId:', error);
    return handleApiError(
      'SERVER_ERROR',
      error.message || 'An error occurred while fetching the installment'
    );
  }
}

/**
 * PUT /api/material-purchases/:id/installments/:installmentId
 * Update a specific installment
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; installmentId: string }> }
) {
  // In Next.js 15, params is now async and needs to be awaited
  const { id, installmentId } = await params;

  try {
    // Create Supabase client
    const supabase = await createClient();

    // Get authenticated user
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        console.error('Error getting authenticated user:', error);
        return handleApiError(
          'AUTHENTICATION_ERROR',
          'Authentication required to update installment'
        );
      }
    } catch (authError) {
      console.error('Exception getting authenticated user:', authError);
      return handleApiError(
        'AUTHENTICATION_ERROR',
        'Authentication required to update installment'
      );
    }

    // Parse request body
    const body = await request.json();
    const { amount, due_date, status, payment_id } = body;

    // Update the installment
    const { data: installment, error } = await supabase
      .from('material_installments')
      .update({
        amount: amount,
        due_date: due_date,
        status: status,
        payment_id: payment_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', installmentId)
      .eq('purchase_id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating installment:', error);
      return handleSupabaseError(error);
    }

    return createApiResponse({
      message: 'Installment updated successfully',
      installment
    });
  } catch (error: any) {
    console.error('Error in PUT /api/material-purchases/:id/installments/:installmentId:', error);
    return handleApiError(
      'SERVER_ERROR',
      error.message || 'An error occurred while updating the installment'
    );
  }
}

/**
 * DELETE /api/material-purchases/:id/installments/:installmentId
 * Delete a specific installment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; installmentId: string }> }
) {
  // In Next.js 15, params is now async and needs to be awaited
  const { id, installmentId } = await params;

  try {
    // Create Supabase client
    const supabase = await createClient();

    // Get authenticated user
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        console.error('Error getting authenticated user:', error);
        return handleApiError(
          'AUTHENTICATION_ERROR',
          'Authentication required to delete installment'
        );
      }
    } catch (authError) {
      console.error('Exception getting authenticated user:', authError);
      return handleApiError(
        'AUTHENTICATION_ERROR',
        'Authentication required to delete installment'
      );
    }

    // Delete the installment
    const { error } = await supabase
      .from('material_installments')
      .delete()
      .eq('id', installmentId)
      .eq('purchase_id', id);

    if (error) {
      console.error('Error deleting installment:', error);
      return handleSupabaseError(error);
    }

    return createApiResponse({
      message: 'Installment deleted successfully'
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/material-purchases/:id/installments/:installmentId:', error);
    return handleApiError(
      'SERVER_ERROR',
      error.message || 'An error occurred while deleting the installment'
    );
  }
}
