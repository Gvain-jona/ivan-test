import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { handleApiError, handleSupabaseError } from '@/lib/api/error-handler';
import { createApiResponse } from '@/lib/api/response-handler';

/**
 * GET /api/expenses/[id]
 * Retrieves a single expense with all related details (payments, notes)
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
      .from('expenses')
      .select('amount_paid, balance, category, created_at, created_by, date, description, id, is_recurring, item_name, next_occurrence_date, notes, payment_status, quantity, recurrence_end_date, recurrence_frequency, recurrence_start_date, reminder_days, responsible, total_amount, unit_cost, updated_at, vat')
      .eq('id', id)
      .single();

    if (error) return handleSupabaseError(error);

    const { data: payments, error: paymentsError } = await supabase
      .from('expense_payments')
      .select('amount, created_at, created_by, date, expense_id, id, payment_method, updated_at')
      .eq('expense_id', id)
      .order('date', { ascending: false });

    if (paymentsError) return handleSupabaseError(paymentsError);

    // Try expense_notes first, fall back to legacy notes table
    let notes: any[] = [];
    const { data: expenseNotes, error: expenseNotesError } = await supabase
      .from('expense_notes')
      .select('id, expense_id, type, text, created_by, created_at, updated_at')
      .eq('expense_id', id)
      .order('created_at', { ascending: false });

    if (!expenseNotesError && expenseNotes && expenseNotes.length > 0) {
      notes = expenseNotes;
    } else {
      const { data: linkedNotes } = await supabase
        .from('notes')
        .select('id, type, text, linked_item_type, linked_item_id, created_by, created_at, updated_at')
        .eq('linked_item_type', 'expense')
        .eq('linked_item_id', id)
        .order('created_at', { ascending: false });
      notes = linkedNotes || [];
    }

    return createApiResponse({
      expense: { ...data, payments: payments || [], notes }
    });
  } catch (error) {
    return handleApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred while fetching the expense');
  }
}

/**
 * PUT /api/expenses/[id]
 * Updates a specific expense
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { expense } = body;

    if (!id) {
      return handleApiError('VALIDATION_ERROR', 'Expense ID is required', { param: 'id' });
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return handleApiError('UNAUTHORIZED', 'Authentication required to update an expense');
    }

    const { balance, ...expenseToUpdate } = expense;

    if (expenseToUpdate.item_name && !expenseToUpdate.description) {
      expenseToUpdate.description = expenseToUpdate.item_name;
    }

    const { data: updatedExpense, error: updateError } = await supabase
      .from('expenses')
      .update({
        ...expenseToUpdate,
        updated_at: new Date().toISOString(),
        responsible: expenseToUpdate.responsible || null
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '428C9') {
        return handleApiError('VALIDATION_ERROR', 'Cannot update a generated column', {
          details: 'Some columns like "balance" are calculated automatically and cannot be updated directly',
          code: updateError.code
        });
      }
      return handleSupabaseError(updateError);
    }

    return createApiResponse({ expense: updatedExpense });
  } catch (error) {
    return handleApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred while updating the expense');
  }
}

/**
 * DELETE /api/expenses/[id]
 * Deletes a specific expense (admin/manager only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return handleApiError('VALIDATION_ERROR', 'Expense ID is required', { param: 'id' });
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return handleApiError('UNAUTHORIZED', 'Authentication required to delete an expense');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      return handleApiError('FORBIDDEN', 'Only admins and managers can delete expenses');
    }

    // Delete legacy linked notes (no CASCADE from this table)
    await supabase
      .from('notes')
      .delete()
      .eq('linked_item_type', 'expense')
      .eq('linked_item_id', id);

    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (deleteError) return handleSupabaseError(deleteError);

    return createApiResponse({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    return handleApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred while deleting the expense');
  }
}
