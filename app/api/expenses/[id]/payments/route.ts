import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
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
    // In Next.js 15, params is now async and needs to be awaited
    const { id } = await params;

    if (!id) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Expense ID is required',
        { param: 'id' }
      );
    }

    // Create Supabase client - await it since it's now async
    const cookieStore = await cookies();
    const supabase = await createClient();

    // Get payments for the expense
    const { data, error } = await supabase
      .from('expense_payments')
      .select('*')
      .eq('expense_id', id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching expense payments:', error);
      return handleSupabaseError(error);
    }

    return createApiResponse({
      payments: data || []
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/expenses/[id]/payments:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while fetching expense payments'
    );
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
    // In Next.js 15, params is now async and needs to be awaited
    const { id } = await params;
    const body = await request.json();
    const { payment } = body;

    if (!id) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Expense ID is required',
        { param: 'id' }
      );
    }

    // Check for required fields
    if (!payment.amount || !payment.date || !payment.payment_method) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Amount, payment date, and payment method are required',
        { param: 'payment' }
      );
    }

    // Create Supabase client - await it since it's now async
    const cookieStore = await cookies();
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return handleApiError(
        'AUTHENTICATION_ERROR',
        'Authentication required to add a payment'
      );
    }

    // Add the payment
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

    if (paymentError) {
      console.error('Error adding expense payment:', paymentError);
      return handleSupabaseError(paymentError);
    }

    // Get the updated expense
    const { data: updatedExpense, error: expenseError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (expenseError) {
      console.error('Error fetching updated expense:', expenseError);
      return handleSupabaseError(expenseError);
    }

    // Get all payments for the expense
    const { data: payments, error: paymentsError } = await supabase
      .from('expense_payments')
      .select('*')
      .eq('expense_id', id)
      .order('date', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching expense payments:', paymentsError);
      return handleSupabaseError(paymentsError);
    }

    return createApiResponse({
      payment: newPayment,
      expense: updatedExpense,
      payments: payments || []
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/expenses/[id]/payments:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while adding the payment'
    );
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
    // In Next.js 15, params is now async and needs to be awaited
    const { id } = await params;
    const body = await request.json();
    const { payment, paymentId } = body;

    if (!id || !paymentId) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Expense ID and Payment ID are required',
        { param: 'id' }
      );
    }

    // Check for required fields
    if (!payment.amount || !payment.date || !payment.payment_method) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Amount, payment date, and payment method are required',
        { param: 'payment' }
      );
    }

    // Create Supabase client - await it since it's now async
    const cookieStore = await cookies();
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return handleApiError(
        'AUTHENTICATION_ERROR',
        'Authentication required to update a payment'
      );
    }

    // Update the payment
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

    if (paymentError) {
      console.error('Error updating expense payment:', paymentError);
      return handleSupabaseError(paymentError);
    }

    // Get the updated expense
    const { data: updatedExpense, error: expenseError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (expenseError) {
      console.error('Error fetching updated expense:', expenseError);
      return handleSupabaseError(expenseError);
    }

    // Get all payments for the expense
    const { data: payments, error: paymentsError } = await supabase
      .from('expense_payments')
      .select('*')
      .eq('expense_id', id)
      .order('date', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching expense payments:', paymentsError);
      return handleSupabaseError(paymentsError);
    }

    return createApiResponse({
      payment: updatedPayment,
      expense: updatedExpense,
      payments: payments || []
    });
  } catch (error) {
    console.error('Unexpected error in PUT /api/expenses/[id]/payments:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while updating the payment'
    );
  }
}

/**
 * DELETE /api/expenses/[id]/payments
 * Deletes a payment from an expense
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 15, params is now async and needs to be awaited
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!id || !paymentId) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Expense ID and Payment ID are required',
        { param: 'id' }
      );
    }

    // Create Supabase client - await it since it's now async
    const cookieStore = await cookies();
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return handleApiError(
        'AUTHENTICATION_ERROR',
        'Authentication required to delete a payment'
      );
    }

    // Check if the user is an admin or manager
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      return handleApiError(
        'AUTHORIZATION_ERROR',
        'Only admins and managers can delete payments'
      );
    }

    // Delete the payment
    const { error: deleteError } = await supabase
      .from('expense_payments')
      .delete()
      .eq('id', paymentId)
      .eq('expense_id', id);

    if (deleteError) {
      console.error('Error deleting expense payment:', deleteError);
      return handleSupabaseError(deleteError);
    }

    // Get the updated expense
    const { data: updatedExpense, error: expenseError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (expenseError) {
      console.error('Error fetching updated expense:', expenseError);
      return handleSupabaseError(expenseError);
    }

    // Get all payments for the expense
    const { data: payments, error: paymentsError } = await supabase
      .from('expense_payments')
      .select('*')
      .eq('expense_id', id)
      .order('date', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching expense payments:', paymentsError);
      return handleSupabaseError(paymentsError);
    }

    return createApiResponse({
      success: true,
      message: 'Payment deleted successfully',
      expense: updatedExpense,
      payments: payments || []
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/expenses/[id]/payments:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while deleting the payment'
    );
  }
}
