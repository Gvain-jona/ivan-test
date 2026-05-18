import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { handleApiError, handleSupabaseError } from '@/lib/api/error-handler';
import { createApiResponse } from '@/lib/api/response-handler';

/**
 * GET /api/expenses/[id]/payments
 * Retrieves all payments for a specific expense
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return handleApiError('VALIDATION_ERROR', 'Expense ID is required', { param: 'id' });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { data, error } = await supabase
      .from('expense_payments')
      .select('*')
      .eq('expense_id', id)
      .order('date', { ascending: false });

    if (error) return handleSupabaseError(error);

    return createApiResponse({ payments: data || [] });
  } catch (error) {
    return handleApiError('SERVER_ERROR', 'An unexpected error occurred while fetching expense payments');
  }
}

/**
 * POST /api/expenses/[id]/payments
 * Adds a new payment to an expense
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { payment } = body;

    if (!id) {
      return handleApiError('VALIDATION_ERROR', 'Expense ID is required', { param: 'id' });
    }

    if (!payment.amount || !payment.date || !payment.payment_method) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Amount, payment date, and payment method are required',
        { param: 'payment' }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return handleApiError('AUTHENTICATION_ERROR', 'Authentication required to add a payment');
    }

    const { data: newPayment, error: paymentError } = await supabase
      .from('expense_payments')
      .insert({
        expense_id: id,
        amount: payment.amount,
        date: payment.date,
        payment_method: payment.payment_method,
        created_by: user.id
      })
      .select()
      .single();

    if (paymentError) return handleSupabaseError(paymentError);

    return createApiResponse({ payment: newPayment });
  } catch (error) {
    return handleApiError('SERVER_ERROR', 'An unexpected error occurred while adding the payment');
  }
}

/**
 * PUT /api/expenses/[id]/payments
 * Updates an existing payment
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { payment, paymentId } = body;

    if (!id || !paymentId) {
      return handleApiError('VALIDATION_ERROR', 'Expense ID and Payment ID are required', { param: 'id' });
    }

    if (!payment.amount || !payment.date || !payment.payment_method) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Amount, payment date, and payment method are required',
        { param: 'payment' }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return handleApiError('AUTHENTICATION_ERROR', 'Authentication required to update a payment');
    }

    const { data: updatedPayment, error: paymentError } = await supabase
      .from('expense_payments')
      .update({
        amount: payment.amount,
        date: payment.date,
        payment_method: payment.payment_method,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .eq('expense_id', id)
      .select()
      .single();

    if (paymentError) return handleSupabaseError(paymentError);

    return createApiResponse({ payment: updatedPayment });
  } catch (error) {
    return handleApiError('SERVER_ERROR', 'An unexpected error occurred while updating the payment');
  }
}

/**
 * DELETE /api/expenses/[id]/payments
 * Deletes a payment from an expense (admin/manager only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!id || !paymentId) {
      return handleApiError('VALIDATION_ERROR', 'Expense ID and Payment ID are required', { param: 'id' });
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return handleApiError('AUTHENTICATION_ERROR', 'Authentication required to delete a payment');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      return handleApiError('AUTHORIZATION_ERROR', 'Only admins and managers can delete payments');
    }

    const { error: deleteError } = await supabase
      .from('expense_payments')
      .delete()
      .eq('id', paymentId)
      .eq('expense_id', id);

    if (deleteError) return handleSupabaseError(deleteError);

    return createApiResponse({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    return handleApiError('SERVER_ERROR', 'An unexpected error occurred while deleting the payment');
  }
}
