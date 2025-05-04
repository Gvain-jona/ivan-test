import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { handleApiError, handleSupabaseError } from '@/lib/api/error-handler';
import { createApiResponse } from '@/lib/api/response-handler';

/**
 * GET /api/expenses
 * Retrieves a list of expenses with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const expenseType = searchParams.getAll('expense_type');
    const category = searchParams.getAll('category');
    const paymentStatus = searchParams.getAll('paymentStatus');
    const isRecurring = searchParams.get('is_recurring');
    const startDate = searchParams.get('startDate') || null;
    const endDate = searchParams.get('endDate') || null;
    const search = searchParams.get('search') || null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Create Supabase client - await it since it's now async
    const cookieStore = await cookies();
    const supabase = await createClient();

    // Start building the query
    let query = supabase
      .from('expenses')
      .select('*', { count: 'exact' });

    // Apply filters
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

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    if (search) {
      query = query.or(`item_name.ilike.%${search}%,category.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.order('date', { ascending: false }).range(offset, offset + limit - 1);

    // Execute the query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching expenses:', error);
      return handleSupabaseError(error);
    }

    // Fetch payments and notes for each expense
    const expensesWithDetails = await Promise.all((data || []).map(async (expense) => {
      // Get payments for the expense
      const { data: payments, error: paymentsError } = await supabase
        .from('expense_payments')
        .select('*')
        .eq('expense_id', expense.id)
        .order('date', { ascending: false });

      if (paymentsError) {
        console.error(`Error fetching payments for expense ${expense.id}:`, paymentsError);
      }

      // Get notes for the expense - try both tables for backward compatibility
      let notes = [];

      // First try the expense_notes table (new structure)
      const { data: expenseNotes, error: expenseNotesError } = await supabase
        .from('expense_notes')
        .select('*')
        .eq('expense_id', expense.id)
        .order('created_at', { ascending: false });

      if (expenseNotesError) {
        console.error(`Error fetching notes from expense_notes for expense ${expense.id}:`, expenseNotesError);
      } else if (expenseNotes && expenseNotes.length > 0) {
        notes = expenseNotes;
      } else {
        // Fall back to the notes table with linked_item fields (old structure)
        const { data: linkedNotes, error: linkedNotesError } = await supabase
          .from('notes')
          .select('*')
          .eq('linked_item_type', 'expense')
          .eq('linked_item_id', expense.id)
          .order('created_at', { ascending: false });

        if (linkedNotesError) {
          console.error(`Error fetching notes from notes table for expense ${expense.id}:`, linkedNotesError);
        } else {
          notes = linkedNotes || [];
        }
      }

      // Return the expense with payments and notes
      return {
        ...expense,
        payments: payments || [],
        notes: notes || []
      };
    }));

    // Create a consistent response structure
    const responseData = {
      expenses: expensesWithDetails || [],
      count: count || 0,
      limit,
      offset
    };

    // More detailed logging to debug the structure
    console.log('API response data:', {
      count: responseData.count,
      limit: responseData.limit,
      offset: responseData.offset,
      expensesCount: responseData.expenses.length,
      // Log the first expense's structure if available
      firstExpenseStructure: responseData.expenses.length > 0 ? {
        id: responseData.expenses[0].id,
        hasPayments: !!responseData.expenses[0].payments,
        paymentsCount: Array.isArray(responseData.expenses[0].payments) ? responseData.expenses[0].payments.length : 0,
        hasNotes: !!responseData.expenses[0].notes,
        notesCount: Array.isArray(responseData.expenses[0].notes) ? responseData.expenses[0].notes.length : 0,
        paymentsSample: Array.isArray(responseData.expenses[0].payments) && responseData.expenses[0].payments.length > 0
          ? responseData.expenses[0].payments[0]
          : null,
        notesSample: Array.isArray(responseData.expenses[0].notes) && responseData.expenses[0].notes.length > 0
          ? responseData.expenses[0].notes[0]
          : null
      } : null
    });

    return createApiResponse(responseData);
  } catch (error) {
    console.error('Unexpected error in GET /api/expenses:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while fetching expenses'
    );
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

    // Create Supabase client - await it since it's now async
    const cookieStore = await cookies();
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return handleApiError(
        'AUTHENTICATION_ERROR',
        'Authentication required to create an expense'
      );
    }

    // Validate required fields
    if (!expense.date) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Date is required',
        { param: 'date' }
      );
    }

    if (!expense.total_amount && expense.total_amount !== 0) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Total amount is required',
        { param: 'total_amount' }
      );
    }

    // Log the received category value
    console.log('Received category value in API:', expense.category);

    // Validate category
    if (!expense.category) {
      console.log('Category not provided, defaulting to variable');
      expense.category = 'variable';
    } else if (!['fixed', 'variable'].includes(expense.category)) {
      console.log('Invalid category provided:', expense.category);
      return handleApiError(
        'VALIDATION_ERROR',
        'Invalid category value. Must be either "fixed" or "variable".',
        { param: 'category' }
      );
    }

    console.log('Final category value in API:', expense.category);

    // Calculate amount_paid
    const amount_paid = payments.reduce((sum, payment) => sum + (parseFloat(payment.amount as any) || 0), 0);

    // Determine payment status
    let payment_status = 'unpaid';
    if (amount_paid > 0) {
      payment_status = amount_paid >= parseFloat(expense.total_amount as any) ? 'paid' : 'partially_paid';
    }

    // Log payment information
    console.log('Payments:', payments);
    console.log('Amount paid:', amount_paid);
    console.log('Total amount:', expense.total_amount);
    console.log('Payment status:', payment_status);

    // Start a transaction
    // Remove any expense_type field if it exists to prevent errors
    // Also extract recurrence pattern fields to handle them explicitly
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

    // Prepare the expense data
    const expenseData = {
      ...cleanedExpense,
      created_by: user.id,
      payment_status,
      amount_paid,
      // balance is a generated column, so we don't need to include it
      responsible: expense.responsible || null,
      category: expense.category,
      // Use item_name as the primary description field
      item_name: expense.item_name,
    };

    // Add recurrence pattern fields if this is a recurring expense
    if (expense.is_recurring) {
      // Only add fields that have values to avoid null entries
      if (recurrence_day_of_week !== undefined) {
        expenseData.recurrence_day_of_week = recurrence_day_of_week;
      }

      if (recurrence_day_of_month !== undefined) {
        expenseData.recurrence_day_of_month = recurrence_day_of_month;
      }

      if (recurrence_week_of_month !== undefined) {
        expenseData.recurrence_week_of_month = recurrence_week_of_month;
      }

      if (recurrence_month_of_year !== undefined) {
        expenseData.recurrence_month_of_year = recurrence_month_of_year;
      }

      if (recurrence_time) {
        expenseData.recurrence_time = recurrence_time;
      }

      if (monthly_recurrence_type) {
        expenseData.monthly_recurrence_type = monthly_recurrence_type;
      }
    }

    const { data: newExpense, error: expenseError } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single();

    if (expenseError) {
      console.error('Error creating expense:', expenseError);

      // Check for specific error types
      if (expenseError.code === '23502') {
        // Not null violation
        return handleApiError(
          'VALIDATION_ERROR',
          'Missing required field',
          { details: expenseError.message, code: expenseError.code }
        );
      } else if (expenseError.code === '23503') {
        // Foreign key violation
        return handleApiError(
          'VALIDATION_ERROR',
          'Referenced record does not exist',
          { details: expenseError.message, code: expenseError.code }
        );
      } else if (expenseError.code === '23505') {
        // Unique violation
        return handleApiError(
          'VALIDATION_ERROR',
          'Record already exists',
          { details: expenseError.message, code: expenseError.code }
        );
      } else if (expenseError.code === '428C9') {
        // Generated column error
        return handleApiError(
          'VALIDATION_ERROR',
          'Cannot insert value into a generated column',
          { details: 'Some columns like "balance" are calculated automatically and cannot be set directly', code: expenseError.code }
        );
      }

      return handleSupabaseError(expenseError);
    }

    // Add payments if any
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
        console.error('Error adding expense payments:', paymentsError);

        // Check for specific payment errors
        if (paymentsError.code === '23502') {
          return handleApiError(
            'VALIDATION_ERROR',
            'Missing required field in payment',
            { details: paymentsError.message, code: paymentsError.code }
          );
        } else if (paymentsError.code === '23514') {
          return handleApiError(
            'VALIDATION_ERROR',
            'Payment amount must be greater than 0',
            { details: paymentsError.message, code: paymentsError.code }
          );
        }

        return handleSupabaseError(paymentsError);
      }
    }

    // Add notes if any
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
        console.error('Error adding expense notes:', notesError);

        // Check for specific note errors
        if (notesError.code === '23502') {
          return handleApiError(
            'VALIDATION_ERROR',
            'Missing required field in note',
            { details: notesError.message, code: notesError.code }
          );
        }

        return handleSupabaseError(notesError);
      }
    }

    // Get the complete expense with payments and notes in a single query
    const { data: completeExpense, error: fetchError } = await supabase
      .from('expenses')
      .select(`
        *,
        payments:expense_payments(*),
        notes:expense_notes(*)
      `)
      .eq('id', newExpense.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete expense:', fetchError);
      return handleSupabaseError(fetchError);
    }

    // Return the complete expense with payments and notes
    return createApiResponse({
      expense: completeExpense
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/expenses:', error);

    // Provide more detailed error information
    let errorMessage = 'An unexpected error occurred while creating the expense';
    let errorDetails = undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = { stack: error.stack };
    } else if (typeof error === 'object' && error !== null) {
      try {
        errorDetails = error;
      } catch (e) {
        console.error('Error processing error object:', e);
      }
    }

    return handleApiError(
      'SERVER_ERROR',
      errorMessage,
      process.env.NODE_ENV === 'development' ? errorDetails : undefined
    );
  }
}

/**
 * PUT /api/expenses/:id
 * Updates an existing expense
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { expense } = body;

    // Get ID from URL path or request body
    let id = params?.id;

    // If ID is not in the URL path, try to get it from the request body
    if (!id) {
      id = body.id;
    }

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

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return handleApiError(
        'AUTHENTICATION_ERROR',
        'Authentication required to update an expense'
      );
    }

    // Remove generated columns, expense_type, and description from the update
    // Also extract recurrence pattern fields to handle them explicitly
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

    // Log the received category value
    console.log('Received category value in PUT API:', expenseToUpdate.category);

    // Ensure category is valid
    if (!expenseToUpdate.category) {
      console.log('Category not provided in update, defaulting to variable');
      expenseToUpdate.category = 'variable';
    } else if (expenseToUpdate.category === 'fixed') {
      console.log('Category in update is fixed, keeping it as fixed');
      expenseToUpdate.category = 'fixed';
    } else {
      console.log('Category in update is not fixed, setting to variable');
      expenseToUpdate.category = 'variable';
    }

    console.log('Final category value in PUT API:', expenseToUpdate.category);

    // Prepare the expense data for update
    const updateData = {
      ...expenseToUpdate,
      updated_at: new Date().toISOString()
    };

    // Add recurrence pattern fields if this is a recurring expense
    if (expense.is_recurring) {
      // Only add fields that have values to avoid null entries
      if (recurrence_day_of_week !== undefined) {
        updateData.recurrence_day_of_week = recurrence_day_of_week;
      }

      if (recurrence_day_of_month !== undefined) {
        updateData.recurrence_day_of_month = recurrence_day_of_month;
      }

      if (recurrence_week_of_month !== undefined) {
        updateData.recurrence_week_of_month = recurrence_week_of_month;
      }

      if (recurrence_month_of_year !== undefined) {
        updateData.recurrence_month_of_year = recurrence_month_of_year;
      }

      if (recurrence_time) {
        updateData.recurrence_time = recurrence_time;
      }

      if (monthly_recurrence_type) {
        updateData.monthly_recurrence_type = monthly_recurrence_type;
      }
    }

    // Update the expense
    const { data: updatedExpense, error: updateError } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating expense:', updateError);

      // Check for specific error types
      if (updateError.code === '428C9') {
        // Generated column error
        return handleApiError(
          'VALIDATION_ERROR',
          'Cannot update a generated column',
          { details: 'Some columns like "balance" are calculated automatically and cannot be updated directly', code: updateError.code }
        );
      }

      return handleSupabaseError(updateError);
    }

    // Get the complete expense with payments and notes in a single query
    const { data: completeExpense, error: fetchError } = await supabase
      .from('expenses')
      .select(`
        *,
        payments:expense_payments(*),
        notes:expense_notes(*)
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete expense after update:', fetchError);
      return handleSupabaseError(fetchError);
    }

    return createApiResponse({
      expense: completeExpense
    });
  } catch (error) {
    console.error('Unexpected error in PUT /api/expenses:', error);

    // Provide more detailed error information
    let errorMessage = 'An unexpected error occurred while updating the expense';
    let errorDetails = undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = { stack: error.stack };
    } else if (typeof error === 'object' && error !== null) {
      try {
        errorDetails = error;
      } catch (e) {
        console.error('Error processing error object:', e);
      }
    }

    return handleApiError(
      'SERVER_ERROR',
      errorMessage,
      process.env.NODE_ENV === 'development' ? errorDetails : undefined
    );
  }
}

/**
 * DELETE /api/expenses
 * Deletes an expense by ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

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

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return handleApiError(
        'AUTHENTICATION_ERROR',
        'Authentication required to delete an expense'
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
        'Only admins and managers can delete expenses'
      );
    }

    // Delete the expense
    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting expense:', deleteError);
      return handleSupabaseError(deleteError);
    }

    return createApiResponse({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/expenses:', error);

    // Provide more detailed error information
    let errorMessage = 'An unexpected error occurred while deleting the expense';
    let errorDetails = undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = { stack: error.stack };
    } else if (typeof error === 'object' && error !== null) {
      try {
        errorDetails = error;
      } catch (e) {
        console.error('Error processing error object:', e);
      }
    }

    return handleApiError(
      'SERVER_ERROR',
      errorMessage,
      process.env.NODE_ENV === 'development' ? errorDetails : undefined
    );
  }
}
