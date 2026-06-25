import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { handleApiError, handleSupabaseError, handleUnexpectedError } from '@/lib/api/error-handler';
import { updateOrderTotals } from '@/lib/orders/db';
import { AddOrderPaymentSchema } from '@/lib/orders/validators';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) return handleApiError('VALIDATION_ERROR', 'Order ID is required');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { data, error } = await supabase
      .from('order_payments')
      .select('id, order_id, amount, date, payment_method, created_at, updated_at')
      .eq('order_id', id)
      .order('date', { ascending: false });

    if (error) return handleSupabaseError(error);

    return NextResponse.json({ payments: data ?? [] });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) return handleApiError('VALIDATION_ERROR', 'Order ID is required');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const body = await request.json();
    const parsed = AddOrderPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid payment data', parsed.error.flatten());
    }

    const { payment } = parsed.data;

    const { data, error } = await supabase
      .from('order_payments')
      .insert({
        order_id: id,
        amount: payment.amount,
        date: payment.date,
        payment_method: payment.payment_method,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return handleSupabaseError(error);

    await updateOrderTotals(supabase, id);

    return NextResponse.json({ payment: data }, { status: 201 });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!id || !paymentId) {
      return handleApiError('VALIDATION_ERROR', 'Order ID and Payment ID are required');
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { error } = await supabase
      .from('order_payments')
      .delete()
      .eq('id', paymentId)
      .eq('order_id', id);

    if (error) return handleSupabaseError(error);

    await updateOrderTotals(supabase, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
