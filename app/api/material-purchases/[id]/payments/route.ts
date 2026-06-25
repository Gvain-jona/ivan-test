import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { handleApiError, handleSupabaseError, handleUnexpectedError } from '@/lib/api/error-handler';
import { createApiResponse } from '@/lib/api/response-handler';
import { PaymentMethodSchema } from '@/lib/orders/validators';

const PaymentInputSchema = z.object({
  amount: z.number().nonnegative('Amount cannot be negative'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  payment_method: PaymentMethodSchema,
  notes: z.string().max(500).optional(),
});

/**
 * GET /api/material-purchases/[id]/payments
 * Retrieves all payments for a specific material purchase
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return handleApiError('VALIDATION_ERROR', 'Material purchase ID is required');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { data, error } = await supabase
      .from('material_payments')
      .select('amount, created_at, created_by, date, id, payment_method, purchase_id, updated_at')
      .eq('purchase_id', id)
      .order('date', { ascending: false });

    if (error) return handleSupabaseError(error);
    return createApiResponse({ payments: data || [] });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

/**
 * POST /api/material-purchases/[id]/payments
 * Adds a new payment to a material purchase
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 15, params is now async and needs to be awaited
    const { id } = await params;
    const body = await request.json();

    if (!id) return handleApiError('VALIDATION_ERROR', 'Material purchase ID is required');

    const parsed = PaymentInputSchema.safeParse(body?.payment);
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid payment data', parsed.error.flatten());
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    // Check if the material purchase exists
    const { data: purchase, error: purchaseError } = await supabase
      .from('material_purchases')
      .select('id, total_amount, amount_paid')
      .eq('id', id)
      .single();

    if (purchaseError || !purchase) {
      return handleApiError(
        'NOT_FOUND',
        'Material purchase not found',
        { param: 'id' }
      );
    }

    const { data: newPayment, error: paymentError } = await supabase
      .from('material_payments')
      .insert({
        purchase_id: id,
        amount: parsed.data.amount,
        date: parsed.data.date,
        payment_method: parsed.data.payment_method,
        notes: parsed.data.notes ?? null,
        created_by: user.id,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error adding material payment:', paymentError);
      return handleSupabaseError(paymentError);
    }

    const newAmountPaid = Number(purchase.amount_paid) + Number(parsed.data.amount);
    const totalAmount = Number(purchase.total_amount);

    // Determine payment status
    let payment_status = 'unpaid';
    if (newAmountPaid >= totalAmount) {
      payment_status = 'paid';
    } else if (newAmountPaid > 0) {
      payment_status = 'partially_paid';
    }

    const { data: updatedPurchase, error: updateError } = await supabase
      .from('material_purchases')
      .update({
        amount_paid: newAmountPaid,
        payment_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      // Rollback: remove the payment we just inserted to keep amount_paid consistent
      await supabase.from('material_payments').delete().eq('id', newPayment.id);
      return handleSupabaseError(updateError);
    }

    return createApiResponse({
      payment: newPayment,
      purchase: updatedPurchase || null,
      message: 'Payment added successfully'
    });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

/**
 * DELETE /api/material-purchases/[id]/payments
 * Deletes a payment from a material purchase
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
        'Material purchase ID and Payment ID are required',
        { param: 'id' }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Get the payment to be deleted
    const { data: payment, error: paymentError } = await supabase
      .from('material_payments')
      .select('amount')
      .eq('id', paymentId)
      .eq('purchase_id', id)
      .single();

    if (paymentError || !payment) {
      return handleApiError(
        'NOT_FOUND',
        'Payment not found',
        { param: 'paymentId' }
      );
    }

    // Get the material purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('material_purchases')
      .select('total_amount, amount_paid')
      .eq('id', id)
      .single();

    if (purchaseError || !purchase) {
      return handleApiError(
        'NOT_FOUND',
        'Material purchase not found',
        { param: 'id' }
      );
    }

    // Update the purchase total BEFORE deleting the payment.
    // This order ensures that if the update fails, the payment still exists and
    // state remains consistent. A failed delete after a successful update is
    // recoverable on retry; a failed update after a successful delete is not.
    const newAmountPaid = Math.max(0, Number(purchase.amount_paid) - Number(payment.amount));
    const totalAmount = Number(purchase.total_amount);

    let payment_status = 'unpaid';
    if (newAmountPaid >= totalAmount) {
      payment_status = 'paid';
    } else if (newAmountPaid > 0) {
      payment_status = 'partially_paid';
    }

    const { data: updatedPurchase, error: updateError } = await supabase
      .from('material_purchases')
      .update({
        amount_paid: newAmountPaid,
        payment_status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) return handleSupabaseError(updateError);

    // Delete the payment only after the purchase total is successfully updated
    const { error: deleteError } = await supabase
      .from('material_payments')
      .delete()
      .eq('id', paymentId)
      .eq('purchase_id', id);

    if (deleteError) return handleSupabaseError(deleteError);

    return createApiResponse({
      message: 'Payment deleted successfully',
      purchase: updatedPurchase,
    });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
