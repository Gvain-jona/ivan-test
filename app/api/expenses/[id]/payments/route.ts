import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { handleApiError, handleSupabaseError, handleUnexpectedError } from '@/lib/api/error-handler';
import { createApiResponse } from '@/lib/api/response-handler';
import { PaymentMethodSchema } from '@/lib/orders/validators';

const PaymentInputSchema = z.object({
  amount: z.number().nonnegative('Amount cannot be negative'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  payment_method: PaymentMethodSchema,
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return handleApiError('VALIDATION_ERROR', 'Expense ID is required');

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
    return handleUnexpectedError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return handleApiError('VALIDATION_ERROR', 'Expense ID is required');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const body = await request.json();
    const parsed = PaymentInputSchema.safeParse(body?.payment);
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid payment data', parsed.error.flatten());
    }

    const { data: newPayment, error: paymentError } = await supabase
      .from('expense_payments')
      .insert({
        expense_id: id,
        amount: parsed.data.amount,
        date: parsed.data.date,
        payment_method: parsed.data.payment_method,
        created_by: user.id,
      })
      .select()
      .single();

    if (paymentError) return handleSupabaseError(paymentError);
    return createApiResponse({ payment: newPayment });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return handleApiError('VALIDATION_ERROR', 'Expense ID is required');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const body = await request.json();
    const { paymentId } = body;
    if (!paymentId) return handleApiError('VALIDATION_ERROR', 'Payment ID is required');

    const parsed = PaymentInputSchema.safeParse(body?.payment);
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid payment data', parsed.error.flatten());
    }

    const { data: updatedPayment, error: paymentError } = await supabase
      .from('expense_payments')
      .update({
        amount: parsed.data.amount,
        date: parsed.data.date,
        payment_method: parsed.data.payment_method,
      })
      .eq('id', paymentId)
      .eq('expense_id', id)
      .select()
      .single();

    if (paymentError) return handleSupabaseError(paymentError);
    return createApiResponse({ payment: updatedPayment });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!id || !paymentId) {
      return handleApiError('VALIDATION_ERROR', 'Expense ID and Payment ID are required');
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return handleApiError('FORBIDDEN', 'Only admins and managers can delete payments');
    }

    const { error: deleteError } = await supabase
      .from('expense_payments')
      .delete()
      .eq('id', paymentId)
      .eq('expense_id', id);

    if (deleteError) return handleSupabaseError(deleteError);
    return createApiResponse({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
