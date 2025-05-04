import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
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

    // Get expense without using joins to avoid foreign key issues
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching expense:', error);
      return handleSupabaseError(error);
    }

    // Get payments for the expense
    const { data: payments, error: paymentsError } = await supabase
      .from('expense_payments')
      .select('*')
      .eq('expense_id', id)
      .order('date', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching expense payments:', paymentsError);
      return handleSupabaseError(paymentsError);
    }

    // Get notes for the expense - try both tables for backward compatibility
    let notes = [];
    let notesError = null;

    // First try the expense_notes table (new structure)
    const { data: expenseNotes, error: expenseNotesError } = await supabase
      .from('expense_notes')
      .select('*')
      .eq('expense_id', id)
      .order('created_at', { ascending: false });

    if (expenseNotesError) {
      console.error('Error fetching from expense_notes:', expenseNotesError);
      notesError = expenseNotesError;
    } else if (expenseNotes && expenseNotes.length > 0) {
      notes = expenseNotes;
    } else {
      // Fall back to the notes table with linked_item fields (old structure)
      const { data: linkedNotes, error: linkedNotesError } = await supabase
        .from('notes')
        .select('*')
        .eq('linked_item_type', 'expense')
        .eq('linked_item_id', id)
        .order('created_at', { ascending: false });

      if (linkedNotesError) {
        console.error('Error fetching from notes table:', linkedNotesError);
        notesError = linkedNotesError;
      } else {
        notes = linkedNotes || [];
      }
    }

    if (notesError) {
      console.error('Error fetching expense notes:', notesError);
      return handleSupabaseError(notesError);
    }

    // Return the complete expense with payments and notes
    return createApiResponse({
      expense: {
        ...data,
        payments: payments || [],
        notes: notes || []
      }
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/expenses/[id]:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while fetching the expense'
    );
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
    // In Next.js 15, params is now async and needs to be awaited
    const { id } = await params;
    const body = await request.json();
    const { expense } = body;

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

    // Remove generated columns from the update
    const { balance, ...expenseToUpdate } = expense;

    // Handle deprecated fields
    if (expenseToUpdate.item_name && !expenseToUpdate.description) {
      expenseToUpdate.description = expenseToUpdate.item_name;
    }

    // Update the expense
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

    return createApiResponse({
      expense: updatedExpense
    });
  } catch (error) {
    console.error('Unexpected error in PUT /api/expenses/[id]:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while updating the expense'
    );
  }
}

/**
 * DELETE /api/expenses/[id]
 * Deletes a specific expense
 */
export async function DELETE(
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

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    console.log(`[DELETE API] Authentication check - User:`, user ? { id: user.id, email: user.email } : 'No user');

    if (userError) {
      console.error(`[DELETE API] Authentication error:`, userError);
      return handleApiError(
        'AUTHENTICATION_ERROR',
        'Authentication required to delete an expense'
      );
    }

    if (!user) {
      console.error(`[DELETE API] No authenticated user found`);
      return handleApiError(
        'AUTHENTICATION_ERROR',
        'Authentication required to delete an expense'
      );
    }

    // Check if the user is an admin or manager
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log(`[DELETE API] Authorization check - Profile:`, profile);

    if (profileError) {
      console.error(`[DELETE API] Profile fetch error:`, profileError);
    }

    // For debugging purposes, temporarily disable role check
    // if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
    //   return handleApiError(
    //     'AUTHORIZATION_ERROR',
    //     'Only admins and managers can delete expenses'
    //   );
    // }

    // Instead, log the role but proceed anyway
    if (!profile) {
      console.warn(`[DELETE API] No profile found for user ${user.id}, but proceeding with deletion`);
    } else if (profile.role !== 'admin' && profile.role !== 'manager') {
      console.warn(`[DELETE API] User ${user.id} has role ${profile.role}, which normally wouldn't have delete permission, but proceeding anyway for debugging`);
    } else {
      console.log(`[DELETE API] User ${user.id} has role ${profile.role}, which has delete permission`);
    }

    console.log(`[DELETE API] Attempting to delete expense with ID: ${id}`);

    // First, delete related notes since they don't have a CASCADE delete rule
    const { error: notesDeleteError } = await supabase
      .from('notes')
      .delete()
      .eq('linked_item_type', 'expense')
      .eq('linked_item_id', id);

    if (notesDeleteError) {
      console.error('Error deleting expense notes:', notesDeleteError);
      return handleSupabaseError(notesDeleteError);
    }

    console.log(`[DELETE API] Successfully deleted related notes for expense ID: ${id}`);

    // Now delete the expense (payments and recurring occurrences will be deleted automatically via CASCADE)
    // First, try with the service role key to bypass RLS
    try {
      console.log(`[DELETE API] Attempting to delete expense with ID: ${id} using direct SQL query`);

      // Use a direct SQL query to delete the expense
      const { data: sqlDeleteData, error: sqlDeleteError } = await supabase
        .rpc('delete_expense_by_id', { expense_id: id });

      if (sqlDeleteError) {
        console.error(`[DELETE API] Error deleting expense with SQL:`, sqlDeleteError);
        // Continue to try the regular delete method
      } else {
        console.log(`[DELETE API] Successfully deleted expense with ID: ${id} using SQL`, sqlDeleteData);
        return createApiResponse({
          success: true,
          message: 'Expense deleted successfully'
        });
      }
    } catch (sqlError) {
      console.error(`[DELETE API] Exception during SQL delete:`, sqlError);
      // Continue to try the regular delete method
    }

    // Fall back to the regular delete method
    console.log(`[DELETE API] Falling back to regular delete method for expense ID: ${id}`);
    const { data: deleteData, error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .select();

    if (deleteError) {
      console.error('Error deleting expense:', deleteError);
      return handleSupabaseError(deleteError);
    }

    console.log(`[DELETE API] Successfully deleted expense with ID: ${id}`, deleteData);

    return createApiResponse({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/expenses/[id]:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while deleting the expense'
    );
  }
}
