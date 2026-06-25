import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { handleApiError } from '@/lib/api/error-handler';

/**
 * GET /api/expenses/recurring/[id]
 * Retrieves a single recurring expense occurrence
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
        'Occurrence ID is required',
        { param: 'id' }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    // Get occurrence
    const { data: occurrence, error } = await supabase
      .from('recurring_expense_occurrences')
      .select('created_at, id, occurrence_date, parent_expense_id, status, updated_at, expense:parent_expense_id(amount_paid, balance, category, created_at, created_by, date, description, id, is_recurring, item_name, next_occurrence_date, notes, payment_status, quantity, recurrence_end_date, recurrence_frequency, recurrence_start_date, reminder_days, responsible, total_amount, unit_cost, updated_at, vat)')
      .eq('id', id)
      .single();

    if (error) {
      return handleApiError(
        'DATABASE_ERROR',
        'Failed to fetch recurring expense occurrence',
        { details: error.message }
      );
    }

    return NextResponse.json({ occurrence });
  } catch (error) {
    return handleApiError(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * PATCH /api/expenses/recurring/[id]
 * Updates the status of a recurring expense occurrence
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 15, params is now async and needs to be awaited
    const { id } = await params;

    if (!id) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Occurrence ID is required',
        { param: 'id' }
      );
    }

    // Parse request body
    const body = await request.json();
    const { status } = body;

    if (!status || !['pending', 'completed', 'skipped'].includes(status)) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Valid status is required (pending, completed, skipped)',
        { param: 'status' }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    // Update occurrence status
    const { data: updatedOccurrence, error } = await supabase
      .from('recurring_expense_occurrences')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return handleApiError(
        'DATABASE_ERROR',
        'Failed to update occurrence status',
        { details: error.message }
      );
    }

    // If marked as completed, create an actual expense record
    if (status === 'completed') {
      // Get the parent expense details
      const { data: parentExpense, error: parentError } = await supabase
        .from('expenses')
        .select('amount_paid, balance, category, created_at, created_by, date, description, id, is_recurring, item_name, next_occurrence_date, notes, payment_status, quantity, recurrence_end_date, recurrence_frequency, recurrence_start_date, reminder_days, responsible, total_amount, unit_cost, updated_at, vat')
        .eq('id', updatedOccurrence.parent_expense_id ?? '')
        .single();

      if (parentError) {
        return handleApiError(
          'DATABASE_ERROR',
          'Failed to fetch parent expense',
          { details: parentError.message }
        );
      }

      // Create a new expense based on the parent with payment_status set to paid
      const { data: newExpense, error: createError } = await supabase
        .from('expenses')
        .insert({
          category: parentExpense.category,
          item_name: parentExpense.item_name,
          description: parentExpense.description,
          quantity: parentExpense.quantity,
          unit_cost: parentExpense.unit_cost,
          total_amount: parentExpense.total_amount,
          amount_paid: parentExpense.total_amount, // Set amount_paid to total_amount
          payment_status: 'paid', // Mark as paid
          date: updatedOccurrence.occurrence_date,
          created_by: parentExpense.created_by,
          is_recurring: false, // This is a one-time expense generated from a recurring one
          generated_from_recurring: true, // Flag to indicate this was generated from a recurring expense
          parent_recurring_expense_id: parentExpense.id // Link back to parent recurring expense
        })
        .select()
        .single();

      if (createError) {
        return handleApiError(
          'DATABASE_ERROR',
          'Failed to create expense from occurrence',
          { details: createError.message }
        );
      }

      // Create a payment record for this expense
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('expense_payments')
        .insert({
          expense_id: newExpense.id,
          amount: newExpense.total_amount,
          date: new Date().toISOString(), // Using 'date' instead of 'payment_date'
          payment_method: 'auto_payment', // Using 'payment_method' instead of 'payment_type'
          notes: `Automatically created payment for recurring expense: ${parentExpense.item_name}`,
          created_by: parentExpense.created_by // Add created_by field
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Failed to create payment record:', paymentError);
        // Continue even if payment record creation fails
      }

      // Update the occurrence with the created expense ID and completed_date
      const { error: linkError } = await supabase
        .from('recurring_expense_occurrences')
        .update({
          linked_expense_id: newExpense.id,
          completed_date: new Date().toISOString()
        } as never)
        .eq('id', id);

      if (linkError) {
        console.error('Failed to link occurrence to created expense:', linkError);
      }

      return NextResponse.json({
        success: true,
        occurrence: updatedOccurrence,
        expense: newExpense,
        payment: paymentRecord || null,
        message: 'Expense occurrence completed and regular expense created'
      });
    }

    return NextResponse.json({
      success: true,
      occurrence: updatedOccurrence,
      message: `Expense occurrence marked as ${status}`
    });
  } catch (error) {
    return handleApiError(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
