import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/api/error-handler';

/**
 * POST /api/cron/generate-recurring-expenses
 * Generates occurrences for recurring expenses
 * This endpoint should be called by a cron job daily
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization (in a real app, you'd use a secret token)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return handleApiError(
        'AUTHENTICATION_ERROR',
        'Authentication required to access this endpoint',
        { status: 401 }
      );
    }

    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = await createClient();

    // Get all active recurring expenses
    const { data: recurringExpenses, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('is_recurring', true)
      .is('recurrence_end_date', null)
      .or(`recurrence_end_date.gte.${new Date().toISOString()}`);

    if (error) {
      return handleApiError(
        'DATABASE_ERROR',
        'Failed to fetch recurring expenses',
        { details: error.message }
      );
    }

    const generatedOccurrences = [];
    const errors = [];

    // Process each recurring expense
    for (const expense of (recurringExpenses || [])) {
      try {
        // Check if it's time to generate a new occurrence
        if (expense.next_occurrence_date && new Date(expense.next_occurrence_date) <= new Date()) {
          // Create a new occurrence
          const { data: occurrence, error: occurrenceError } = await supabase
            .from('recurring_expense_occurrences')
            .insert({
              parent_expense_id: expense.id,
              occurrence_date: expense.next_occurrence_date,
              status: 'pending'
            })
            .select()
            .single();

          if (occurrenceError) {
            errors.push({
              expense_id: expense.id,
              error: occurrenceError.message
            });
            continue;
          }

          generatedOccurrences.push(occurrence);

          // Calculate and update the next occurrence date
          const { error: updateError } = await supabase
            .rpc('calculate_next_occurrence', {
              expense_id: expense.id
            });

          if (updateError) {
            errors.push({
              expense_id: expense.id,
              error: updateError.message
            });
          }
        }
      } catch (expenseError) {
        errors.push({
          expense_id: expense.id,
          error: expenseError instanceof Error ? expenseError.message : 'Unknown error'
        });
      }
    }

    // Send notifications for upcoming expenses with reminders
    const today = new Date();
    const { data: upcomingExpenses, error: upcomingError } = await supabase
      .from('expenses')
      .select('*')
      .eq('is_recurring', true)
      .not('reminder_days', 'is', null)
      .not('next_occurrence_date', 'is', null);

    if (!upcomingError && upcomingExpenses) {
      for (const expense of upcomingExpenses) {
        const nextOccurrence = new Date(expense.next_occurrence_date);
        const daysUntilOccurrence = Math.floor((nextOccurrence.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilOccurrence === expense.reminder_days) {
          // Create a notification
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: expense.created_by,
              type: 'expense_reminder',
              title: 'Upcoming Expense Reminder',
              content: `Reminder: ${expense.item_name} expense of ${expense.total_amount} is due in ${expense.reminder_days} days.`,
              linked_item_type: 'expense',
              linked_item_id: expense.id,
              is_read: false
            });

          if (notificationError) {
            errors.push({
              expense_id: expense.id,
              error: `Failed to create notification: ${notificationError.message}`
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      generated_occurrences: generatedOccurrences.length,
      occurrences: generatedOccurrences,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred',
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
