import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { handleApiError, handleSupabaseError } from '@/lib/api/error-handler';
import { createApiResponse } from '@/lib/api/response-handler';

/**
 * GET /api/material-purchases/[id]/payments
 * Retrieves all payments for a specific material purchase
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

    // Get payments for the material purchase
    const { data, error } = await supabase
      .from('material_payments')
      .select('*')
      .eq('purchase_id', id)
      .order('date', { ascending: false });

    if (error) {
      return handleSupabaseError(error);
    }

    return createApiResponse({
      payments: data || []
    });
  } catch (error) {
    console.error('Error in GET /api/material-purchases/[id]/payments:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while fetching material payments'
    );
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
    const { payment } = body;

    if (!id) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Material purchase ID is required',
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

    // Create Supabase client
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return handleApiError(
        'AUTHENTICATION_ERROR',
        'Authentication required to add a payment'
      );
    }

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

    // Add the payment
    const { data: newPayment, error: paymentError } = await supabase
      .from('material_payments')
      .insert({
        purchase_id: id,
        amount: payment.amount,
        date: payment.date,
        payment_method: payment.payment_method,
        notes: payment.notes || null,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error adding material payment:', paymentError);
      return handleSupabaseError(paymentError);
    }

    // Update the material purchase with the new amount paid
    const newAmountPaid = Number(purchase.amount_paid) + Number(payment.amount);
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
      console.error('Error updating material purchase:', updateError);
      // Continue even if update fails, we'll return the payment
    }

    return createApiResponse({
      payment: newPayment,
      purchase: updatedPurchase || null,
      message: 'Payment added successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/material-purchases/[id]/payments:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while adding the payment'
    );
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

    // Delete the payment
    const { error: deleteError } = await supabase
      .from('material_payments')
      .delete()
      .eq('id', paymentId)
      .eq('purchase_id', id);

    if (deleteError) {
      console.error('Error deleting payment:', deleteError);
      return handleSupabaseError(deleteError);
    }

    // Update the material purchase with the new amount paid
    const newAmountPaid = Math.max(0, Number(purchase.amount_paid) - Number(payment.amount));
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
      console.error('Error updating material purchase:', updateError);
      // Continue even if update fails
    }

    return createApiResponse({
      message: 'Payment deleted successfully',
      purchase: updatedPurchase || null
    });
  } catch (error) {
    console.error('Error in DELETE /api/material-purchases/[id]/payments:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while deleting the payment'
    );
  }
}
