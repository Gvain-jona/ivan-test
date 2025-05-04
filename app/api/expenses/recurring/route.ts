import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/unified-server';
import { handleApiError } from '@/lib/api/error-handler';

/**
 * GET /api/expenses/recurring
 * Retrieves upcoming recurring expenses
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Create Supabase client
    const supabase = await createClient();

    // Get recurring expenses with upcoming occurrences
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('is_recurring', true)
      .order('next_occurrence_date', { ascending: true });

    if (expensesError) {
      return handleApiError(
        'DATABASE_ERROR',
        'Failed to fetch recurring expenses',
        { details: expensesError.message }
      );
    }

    // Get existing occurrences for these expenses
    const expenseIds = expenses?.map(expense => expense.id) || [];

    let occurrences = [];
    if (expenseIds.length > 0) {
      // Try to use join syntax first
      const { data: joinOccurrences, error: joinError } = await supabase
        .from('recurring_expense_occurrences')
        .select('*, expense:parent_expense_id(*)')
        .in('parent_expense_id', expenseIds)
        .gte('occurrence_date', startDate)
        .lte('occurrence_date', endDate)
        .order('occurrence_date', { ascending: true });

      if (!joinError && joinOccurrences) {
        // Join worked, use the results
        occurrences = joinOccurrences;
      } else {
        // Join failed, fall back to separate queries
        const { data: simpleOccurrences, error: occurrencesError } = await supabase
          .from('recurring_expense_occurrences')
          .select('*')
          .in('parent_expense_id', expenseIds)
          .gte('occurrence_date', startDate)
          .lte('occurrence_date', endDate)
          .order('occurrence_date', { ascending: true });

        if (occurrencesError) {
          return handleApiError(
            'DATABASE_ERROR',
            'Failed to fetch recurring expense occurrences',
            { details: occurrencesError.message }
          );
        }

        // Process occurrences to ensure they have the expense property
        occurrences = (simpleOccurrences || []).map(occurrence => {
          const matchingExpense = expenses?.find(exp => exp.id === occurrence.parent_expense_id);
          return {
            ...occurrence,
            expense: matchingExpense || null
          };
        });
      }
    }

    return NextResponse.json({
      occurrences,
      startDate,
      endDate
    });
  } catch (error) {
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred',
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * POST /api/expenses/recurring
 * Generate occurrences for recurring expenses
 * This endpoint can be called manually or by a cron job
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization for production (skip in development)
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return handleApiError(
          'AUTHENTICATION_ERROR',
          'Authentication required to access this endpoint',
          { status: 401 }
        );
      }
      // In production, you would validate the token here
    }

    // Create Supabase client
    const supabase = await createClient();

    // Get all active recurring expenses
    const { data: recurringExpenses, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('is_recurring', true);

    if (error) {
      return handleApiError(
        'DATABASE_ERROR',
        'Failed to fetch recurring expenses',
        { details: error.message }
      );
    }

    // Check if any recurring expenses need next_occurrence_date to be set
    const expensesNeedingNextDate = recurringExpenses?.filter(exp => !exp.next_occurrence_date) || [];

    if (expensesNeedingNextDate.length > 0) {
      // Set next_occurrence_date to the original date for these expenses
      for (const expense of expensesNeedingNextDate) {
        await supabase
          .from('expenses')
          .update({ next_occurrence_date: expense.date })
          .eq('id', expense.id);
      }

      // Refresh the recurring expenses list
      const { data: refreshedExpenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('is_recurring', true);

      if (refreshedExpenses) {
        recurringExpenses.length = 0; // Clear the array
        recurringExpenses.push(...refreshedExpenses); // Add refreshed data
      }
    }

    const generatedOccurrences = [];
    const errors = [];

    // Process recurring expenses in batches for better performance
    try {
      // Generate occurrences for the next 3 months
      const today = new Date();
      const threeMonthsLater = new Date();
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

      // Step 1: Get all existing occurrences for these expenses in the date range
      const expenseIds = recurringExpenses?.map(expense => expense.id) || [];

      if (expenseIds.length === 0) {
        return NextResponse.json({
          success: true,
          generatedOccurrences: [],
          message: "No recurring expenses found"
        });
      }

      const { data: existingOccurrences, error: existingError } = await supabase
        .from('recurring_expense_occurrences')
        .select('parent_expense_id, occurrence_date')
        .in('parent_expense_id', expenseIds)
        .gte('occurrence_date', today.toISOString().split('T')[0])
        .lte('occurrence_date', threeMonthsLater.toISOString().split('T')[0]);

      if (existingError) {
        return handleApiError(
          'DATABASE_ERROR',
          'Failed to fetch existing occurrences',
          { details: existingError.message }
        );
      }

      // Create a map of existing occurrences for quick lookup
      const existingMap = new Map();
      (existingOccurrences || []).forEach(occurrence => {
        const key = `${occurrence.parent_expense_id}_${occurrence.occurrence_date}`;
        existingMap.set(key, true);
      });

      // Step 2: Calculate occurrences for each expense
      const occurrencesToCreate = [];

      for (const expense of (recurringExpenses || [])) {
        try {
          // Update the next_occurrence_date for this expense
          await supabase.rpc('calculate_next_occurrence', { expense_id: expense.id });

          // Get the updated expense with the new next_occurrence_date
          const { data: updatedExpense, error: fetchError } = await supabase
            .from('expenses')
            .select('next_occurrence_date, recurrence_frequency, recurrence_day_of_month, recurrence_day_of_week, recurrence_week_of_month, recurrence_month_of_year, monthly_recurrence_type')
            .eq('id', expense.id)
            .single();

          if (fetchError || !updatedExpense) {
            errors.push({
              expense_id: expense.id,
              error: fetchError ? fetchError.message : 'Failed to fetch updated expense'
            });
            continue;
          }

          // Generate occurrences for this expense
          let currentDate = new Date(updatedExpense.next_occurrence_date);
          let iterationCount = 0;
          const maxIterations = 12; // Safety limit

          while (currentDate <= threeMonthsLater && iterationCount < maxIterations) {
            const dateString = currentDate.toISOString().split('T')[0];
            const key = `${expense.id}_${dateString}`;

            // Only create if no occurrence exists
            if (!existingMap.has(key)) {
              occurrencesToCreate.push({
                parent_expense_id: expense.id,
                occurrence_date: dateString,
                status: 'pending'
              });
            }

            // Calculate the next date using our utility function
            currentDate = calculateNextDate(
              currentDate,
              updatedExpense.recurrence_frequency,
              {
                dayOfMonth: updatedExpense.recurrence_day_of_month,
                dayOfWeek: updatedExpense.recurrence_day_of_week,
                weekOfMonth: updatedExpense.recurrence_week_of_month,
                monthOfYear: updatedExpense.recurrence_month_of_year,
                monthlyRecurrenceType: updatedExpense.monthly_recurrence_type
              }
            );

            iterationCount++;
          }
        } catch (expenseError) {
          errors.push({
            expense_id: expense.id,
            error: expenseError instanceof Error ? expenseError.message : 'Unknown error'
          });
        }
      }

      // Step 3: Batch insert the occurrences
      if (occurrencesToCreate.length > 0) {
        // Insert in batches of 100 to avoid hitting limits
        const batchSize = 100;
        for (let i = 0; i < occurrencesToCreate.length; i += batchSize) {
          const batch = occurrencesToCreate.slice(i, i + batchSize);

          const { data: insertedOccurrences, error: insertError } = await supabase
            .from('recurring_expense_occurrences')
            .insert(batch)
            .select();

          if (insertError) {
            errors.push({
              error: `Failed to insert occurrences batch: ${insertError.message}`
            });
          } else if (insertedOccurrences) {
            generatedOccurrences.push(...insertedOccurrences);
          }
        }
      }
    } catch (error) {
      errors.push({
        error: error instanceof Error ? error.message : 'Unknown error in batch processing'
      });
    }

    // Helper function to calculate the next date based on frequency
    function calculateNextDate(date, frequency, options) {
      const nextDate = new Date(date);

      switch (frequency) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);

          // Handle day of month for months with fewer days
          if (options.monthlyRecurrenceType === 'day_of_month' && options.dayOfMonth) {
            const targetDay = options.dayOfMonth;
            nextDate.setDate(1); // Go to the first of the month

            // Get the last day of the month
            const lastDay = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();

            // Set the day, capped at the last day of the month
            nextDate.setDate(Math.min(targetDay, lastDay));
          }
          break;
        case 'quarterly':
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
        default:
          nextDate.setMonth(nextDate.getMonth() + 1);
      }

      return nextDate;
    }

    return NextResponse.json({
      success: true,
      generatedOccurrences,
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
