import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-utils';
import { handleApiError, handleSupabaseError } from '@/lib/api/error-handler';
import { createApiResponse } from '@/lib/api/response-handler';
import { addDays, addWeeks, addMonths } from 'date-fns';

/**
 * GET /api/material-purchases/:id/installments
 * Get all installments for a material purchase
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // In Next.js 15, params is now async and needs to be awaited
  const { id } = await params;

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
          'Authentication required to view installments'
        );
      }
    } catch (authError) {
      console.error('Exception getting authenticated user:', authError);
      return handleApiError(
        'AUTHENTICATION_ERROR',
        'Authentication required to view installments'
      );
    }

    console.log(`Fetching installments for purchase ID: ${id}`);

    // Get installments for the material purchase
    const { data: installments, error } = await supabase
      .from('material_installments')
      .select('*')
      .eq('purchase_id', id)
      .order('installment_number', { ascending: true });

    if (error) {
      console.error('Error fetching installments:', error);
      return handleSupabaseError(error);
    }

    console.log(`Found ${installments?.length || 0} installments for purchase ID: ${id}`);

    return createApiResponse({ installments });
  } catch (error: any) {
    console.error('Error in GET /api/material-purchases/:id/installments:', error);
    return handleApiError(
      'SERVER_ERROR',
      error.message || 'An error occurred while fetching installments'
    );
  }
}

/**
 * POST /api/material-purchases/:id/installments
 * Create an installment plan for a material purchase
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // In Next.js 15, params is now async and needs to be awaited
  const { id } = await params;

  try {
    // Create Supabase client
    const supabase = await createClient();

    // Get authenticated user
    let user;
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        console.error('Error getting authenticated user:', error);
        return handleApiError(
          'AUTHENTICATION_ERROR',
          'Authentication required to create installment plan'
        );
      }

      user = data.user;
    } catch (authError) {
      console.error('Exception getting authenticated user:', authError);
      return handleApiError(
        'AUTHENTICATION_ERROR',
        'Authentication required to create installment plan'
      );
    }

    // Parse request body
    const body = await request.json();
    const { total_installments, payment_frequency, first_payment_date, reminder_days = 3 } = body;

    // Validate required fields
    if (!total_installments || !payment_frequency || !first_payment_date) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Missing required fields',
        { fields: ['total_installments', 'payment_frequency', 'first_payment_date'] }
      );
    }

    // Supabase client already created above

    // Get the material purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('material_purchases')
      .select('*')
      .eq('id', id)
      .single();

    if (purchaseError) {
      console.error('Error fetching material purchase:', purchaseError);
      return handleSupabaseError(purchaseError);
    }

    // Calculate installment amount
    const remainingBalance = purchase.total_amount - purchase.amount_paid;
    const installmentAmount = parseFloat((remainingBalance / total_installments).toFixed(2));

    // Generate installment dates based on frequency
    const installments = [];
    let currentDate = new Date(first_payment_date);

    for (let i = 0; i < total_installments; i++) {
      // For the last installment, adjust the amount to account for rounding errors
      const amount = i === total_installments - 1
        ? remainingBalance - (installmentAmount * (total_installments - 1))
        : installmentAmount;

      installments.push({
        purchase_id: id,
        installment_number: i + 1,
        amount,
        due_date: currentDate.toISOString().split('T')[0],
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Calculate next date based on frequency
      switch (payment_frequency) {
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'biweekly':
          currentDate = addWeeks(currentDate, 2);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
        case 'quarterly':
          currentDate = addMonths(currentDate, 3);
          break;
        default:
          currentDate = addMonths(currentDate, 1); // Default to monthly
      }
    }

    console.log('Creating installment plan with data:', {
      p_purchase_id: id,
      p_installments: installments,
      p_total_installments: total_installments,
      p_payment_frequency: payment_frequency,
      p_next_payment_date: first_payment_date,
      p_reminder_days: reminder_days
    });

    // Begin transaction
    const { data, error } = await supabase.rpc('create_installment_plan', {
      p_purchase_id: id,
      p_installments: installments,
      p_total_installments: total_installments,
      p_payment_frequency: payment_frequency,
      p_next_payment_date: first_payment_date,
      p_reminder_days: reminder_days
    });

    if (error) {
      console.error('Error creating installment plan:', error);
      return handleSupabaseError(error);
    }

    console.log('Installment plan creation result:', data);

    // Get the created installments
    const { data: createdInstallments, error: installmentsError } = await supabase
      .from('material_installments')
      .select('*')
      .eq('purchase_id', id)
      .order('installment_number', { ascending: true });

    if (installmentsError) {
      console.error('Error fetching created installments:', installmentsError);
      return handleSupabaseError(installmentsError);
    }

    return createApiResponse({
      message: 'Installment plan created successfully',
      installments: createdInstallments
    });
  } catch (error: any) {
    console.error('Error in POST /api/material-purchases/:id/installments:', error);
    return handleApiError(
      'SERVER_ERROR',
      error.message || 'An error occurred while creating installment plan'
    );
  }
}
