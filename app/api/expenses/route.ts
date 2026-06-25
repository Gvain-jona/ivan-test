import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { handleApiError, handleSupabaseError } from '@/lib/api/error-handler';
import { createApiResponse } from '@/lib/api/response-handler';

/**
 * GET /api/expenses
 * Retrieves a list of expenses with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const expenseType = searchParams.getAll('expense_type');
    const category = searchParams.getAll('category');
    const paymentStatus = searchParams.getAll('paymentStatus');
    const isRecurring = searchParams.get('is_recurring');
    const startDate = searchParams.get('startDate') || null;
    const endDate = searchParams.get('endDate') || null;
    const search = searchParams.get('search') || null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    let query = supabase
      .from('expenses')
      .select('amount_paid, balance, category, created_at, created_by, date, description, id, is_recurring, item_name, next_occurrence_date, notes, payment_status, quantity, recurrence_end_date, recurrence_frequency, recurrence_start_date, reminder_days, responsible, total_amount, unit_cost, updated_at, vat', { count: 'exact' });

    if (expenseType && expenseType.length > 0 && expenseType[0] !== 'all') {
      query = query.in('expense_type', expenseType);
    }

    if (category && category.length > 0 && category[0] !== 'all') {
      query = query.in('category', category);
    }

    if (paymentStatus && paymentStatus.length > 0 && paymentStatus[0] !== 'all') {
      query = query.in('payment_status', paymentStatus);
    }

    if (isRecurring !== null && isRecurring !== undefined) {
      query = query.eq('is_recurring', isRecurring === 'true');
    }

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    if (search) query = query.or(`item_name.ilike.%${search}%,category.ilike.%${search}%`);

    query = query.order('date', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) return handleSupabaseError(error);

    // Batch fetch related data — 3 queries total regardless of expense count
    const expenseIds = (data || []).map(expense => expense.id);

    const [paymentsResult, expenseNotesResult, linkedNotesResult] = await Promise.all([
      supabase
        .from('expense_payments')
        .select('amount, created_at, created_by, date, expense_id, id, payment_method, updated_at')
        .in('expense_id', expenseIds)
        .order('date', { ascending: false }),
      supabase
        .from('expense_notes')
        .select('id, expense_id, type, text, created_by, created_at, updated_at')
        .in('expense_id', expenseIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('notes')
        .select('id, type, text, linked_item_type, linked_item_id, created_by, created_at, updated_at')
        .eq('linked_item_type', 'expense')
        .in('linked_item_id', expenseIds)
        .order('created_at', { ascending: false })
    ]);

    const paymentsByExpenseId = (paymentsResult.data || []).reduce((acc, payment) => {
      const key = payment.expense_id ?? '';
      if (!acc[key]) acc[key] = [];
      acc[key].push(payment);
      return acc;
    }, {} as Record<string, any[]>);

    const expenseNotesByExpenseId = (expenseNotesResult.data || []).reduce((acc, note) => {
      const key = (note as Record<string, unknown>)['expense_id'] as string ?? '';
      if (!acc[key]) acc[key] = [];
      acc[key].push(note);
      return acc;
    }, {} as Record<string, any[]>);

    const linkedNotesByExpenseId = (linkedNotesResult.data || []).reduce((acc, note) => {
      if (!acc[note.linked_item_id]) acc[note.linked_item_id] = [];
      acc[note.linked_item_id].push(note);
      return acc;
    }, {} as Record<string, any[]>);

    const expensesWithDetails = (data || []).map(expense => {
      const payments = paymentsByExpenseId[expense.id] || [];
      const expenseNotes = expenseNotesByExpenseId[expense.id] || [];
      const linkedNotes = linkedNotesByExpenseId[expense.id] || [];
      const notes = expenseNotes.length > 0 ? expenseNotes : linkedNotes;
      return { ...expense, payments, notes };
    });

    return createApiResponse({ expenses: expensesWithDetails, count: count || 0, limit, offset });
  } catch (error) {
    return handleApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred while fetching expenses');
  }
}

/**
 * POST /api/expenses
 * Creates a new expense
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { expense, payments = [], notes = [] } = body;

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return handleApiError('UNAUTHORIZED', 'Authentication required to create an expense');
    }

    if (!expense.date) {
      return handleApiError('VALIDATION_ERROR', 'Date is required', { param: 'date' });
    }

    if (!expense.total_amount && expense.total_amount !== 0) {
      return handleApiError('VALIDATION_ERROR', 'Total amount is required', { param: 'total_amount' });
    }

    if (!expense.category) {
      expense.category = 'variable';
    } else if (!['fixed', 'variable'].includes(expense.category)) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Invalid category value. Must be either "fixed" or "variable".',
        { param: 'category' }
      );
    }

    const amount_paid = payments.reduce((sum: number, payment: any) => sum + (parseFloat(payment.amount) || 0), 0);

    let payment_status = 'unpaid';
    if (amount_paid > 0) {
      payment_status = amount_paid >= parseFloat(expense.total_amount) ? 'paid' : 'partially_paid';
    }

    const {
      expense_type,
      description,
      recurrence_day_of_week,
      recurrence_day_of_month,
      recurrence_week_of_month,
      recurrence_month_of_year,
      recurrence_time,
      monthly_recurrence_type,
      ...cleanedExpense
    } = expense;

    const expenseData: any = {
      ...cleanedExpense,
      created_by: user.id,
      payment_status,
      amount_paid,
      responsible: expense.responsible || null,
      category: expense.category,
      item_name: expense.item_name,
    };

    if (expense.is_recurring) {
      if (recurrence_day_of_week !== undefined) expenseData.recurrence_day_of_week = recurrence_day_of_week;
      if (recurrence_day_of_month !== undefined) expenseData.recurrence_day_of_month = recurrence_day_of_month;
      if (recurrence_week_of_month !== undefined) expenseData.recurrence_week_of_month = recurrence_week_of_month;
      if (recurrence_month_of_year !== undefined) expenseData.recurrence_month_of_year = recurrence_month_of_year;
      if (recurrence_time) expenseData.recurrence_time = recurrence_time;
      if (monthly_recurrence_type) expenseData.monthly_recurrence_type = monthly_recurrence_type;
    }

    const { data: newExpense, error: expenseError } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single();

    if (expenseError) {
      if (expenseError.code === '23502') {
        return handleApiError('VALIDATION_ERROR', 'Missing required field', { details: expenseError.message, code: expenseError.code });
      } else if (expenseError.code === '23503') {
        return handleApiError('VALIDATION_ERROR', 'Referenced record does not exist', { details: expenseError.message, code: expenseError.code });
      } else if (expenseError.code === '23505') {
        return handleApiError('VALIDATION_ERROR', 'Record already exists', { details: expenseError.message, code: expenseError.code });
      } else if (expenseError.code === '428C9') {
        return handleApiError('VALIDATION_ERROR', 'Cannot insert value into a generated column', {
          details: 'Some columns like "balance" are calculated automatically and cannot be set directly',
          code: expenseError.code
        });
      }
      return handleSupabaseError(expenseError);
    }

    if (payments.length > 0) {
      const paymentsWithExpenseId = payments.map((payment: any) => ({
        ...payment,
        expense_id: newExpense.id,
        created_by: user.id
      }));

      const { error: paymentsError } = await supabase
        .from('expense_payments')
        .insert(paymentsWithExpenseId);

      if (paymentsError) {
        if (paymentsError.code === '23502') {
          return handleApiError('VALIDATION_ERROR', 'Missing required field in payment', { details: paymentsError.message, code: paymentsError.code });
        } else if (paymentsError.code === '23514') {
          return handleApiError('VALIDATION_ERROR', 'Payment amount must be greater than 0', { details: paymentsError.message, code: paymentsError.code });
        }
        return handleSupabaseError(paymentsError);
      }
    }

    if (notes.length > 0) {
      const notesWithExpenseId = notes.map((note: any) => ({
        ...note,
        expense_id: newExpense.id,
        created_by: user.id
      }));

      const { error: notesError } = await supabase
        .from('expense_notes')
        .insert(notesWithExpenseId);

      if (notesError) {
        if (notesError.code === '23502') {
          return handleApiError('VALIDATION_ERROR', 'Missing required field in note', { details: notesError.message, code: notesError.code });
        }
        return handleSupabaseError(notesError);
      }
    }

    const { data: completeExpense, error: fetchError } = await supabase
      .from('expenses')
      .select(`
        amount_paid, balance, category, created_at, created_by, date, description, id, is_recurring, item_name, next_occurrence_date, notes, payment_status, quantity, recurrence_end_date, recurrence_frequency, recurrence_start_date, reminder_days, responsible, total_amount, unit_cost, updated_at, vat,
        payments:expense_payments(amount, created_at, created_by, date, expense_id, id, payment_method, updated_at),
        notes:expense_notes(id, expense_id, type, text, created_by, created_at, updated_at)
      `)
      .eq('id', newExpense.id)
      .single();

    if (fetchError) return handleSupabaseError(fetchError);

    return createApiResponse({ expense: completeExpense });
  } catch (error) {
    return handleApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred while creating the expense');
  }
}

/**
 * PUT /api/expenses
 * Updates an existing expense (ID in request body)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { expense } = body;
    const id = body.id;

    if (!id) {
      return handleApiError('VALIDATION_ERROR', 'Expense ID is required', { param: 'id' });
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return handleApiError('UNAUTHORIZED', 'Authentication required to update an expense');
    }

    const {
      balance,
      expense_type,
      description,
      recurrence_day_of_week,
      recurrence_day_of_month,
      recurrence_week_of_month,
      recurrence_month_of_year,
      recurrence_time,
      monthly_recurrence_type,
      ...expenseToUpdate
    } = expense;

    if (!expenseToUpdate.category) {
      expenseToUpdate.category = 'variable';
    } else if (expenseToUpdate.category !== 'fixed') {
      expenseToUpdate.category = 'variable';
    }

    const updateData: any = {
      ...expenseToUpdate,
      updated_at: new Date().toISOString()
    };

    if (expense.is_recurring) {
      if (recurrence_day_of_week !== undefined) updateData.recurrence_day_of_week = recurrence_day_of_week;
      if (recurrence_day_of_month !== undefined) updateData.recurrence_day_of_month = recurrence_day_of_month;
      if (recurrence_week_of_month !== undefined) updateData.recurrence_week_of_month = recurrence_week_of_month;
      if (recurrence_month_of_year !== undefined) updateData.recurrence_month_of_year = recurrence_month_of_year;
      if (recurrence_time) updateData.recurrence_time = recurrence_time;
      if (monthly_recurrence_type) updateData.monthly_recurrence_type = monthly_recurrence_type;
    }

    const { data: updatedExpense, error: updateError } = await supabase
      .from('expenses')
      .update(updateData)
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

    const { data: completeExpense, error: fetchError } = await supabase
      .from('expenses')
      .select(`
        amount_paid, balance, category, created_at, created_by, date, description, id, is_recurring, item_name, next_occurrence_date, notes, payment_status, quantity, recurrence_end_date, recurrence_frequency, recurrence_start_date, reminder_days, responsible, total_amount, unit_cost, updated_at, vat,
        payments:expense_payments(amount, created_at, created_by, date, expense_id, id, payment_method, updated_at),
        notes:expense_notes(id, expense_id, type, text, created_by, created_at, updated_at)
      `)
      .eq('id', id)
      .single();

    if (fetchError) return handleSupabaseError(fetchError);

    return createApiResponse({ expense: completeExpense });
  } catch (error) {
    return handleApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred while updating the expense');
  }
}

/**
 * DELETE /api/expenses
 * Deletes an expense by ID (query param)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

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
