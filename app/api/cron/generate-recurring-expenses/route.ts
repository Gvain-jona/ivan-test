import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { handleApiError } from '@/lib/api/error-handler';

export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return handleApiError('INTERNAL_SERVER_ERROR', 'Cron endpoint not configured');
    }
    if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
      return handleApiError('UNAUTHORIZED', 'Invalid cron secret');
    }

    const supabase = await createClient();
    const now = new Date();
    const errors: Array<{ expense_id: string; error: string }> = [];

    // Single query — select only the columns we actually use.
    // .or() with comma-separated filters keeps the IS NULL / gte check in one
    // predicate so operator precedence is correct.
    const { data: expenses, error: fetchError } = await supabase
      .from('expenses')
      .select('id, next_occurrence_date, item_name, total_amount, created_by, reminder_days')
      .eq('is_recurring', true)
      .or(`recurrence_end_date.is.null,recurrence_end_date.gte.${now.toISOString()}`);

    if (fetchError) {
      return handleApiError('DATABASE_ERROR', 'Failed to fetch recurring expenses', {
        details: fetchError.message,
      });
    }

    const allExpenses = expenses ?? [];

    // ── Step 1: Batch INSERT all due occurrences (1 round-trip) ──────────────
    const dueExpenses = allExpenses.filter(
      e => e.next_occurrence_date && new Date(e.next_occurrence_date) <= now,
    );

    let generatedOccurrences: unknown[] = [];

    if (dueExpenses.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('recurring_expense_occurrences')
        .insert(
          dueExpenses.map(e => ({
            parent_expense_id: e.id,
            occurrence_date: e.next_occurrence_date,
            status: 'pending',
          })) as never,
        )
        .select();

      if (insertError) {
        errors.push({ expense_id: 'batch_insert', error: insertError.message });
      } else {
        generatedOccurrences = inserted ?? [];

        // ── Step 2: Update next_occurrence_date — parallel, not sequential ──
        const rpcResults = await Promise.allSettled(
          dueExpenses.map(e =>
            supabase.rpc('calculate_next_occurrence', { expense_id: e.id }),
          ),
        );

        rpcResults.forEach((result, i) => {
          if (result.status === 'rejected') {
            errors.push({ expense_id: dueExpenses[i].id, error: String(result.reason) });
          } else if (result.value.error) {
            errors.push({ expense_id: dueExpenses[i].id, error: result.value.error.message });
          }
        });
      }
    }

    // ── Step 3: Batch INSERT reminder notifications (1 round-trip) ───────────
    const reminderRows = allExpenses
      .filter(e => {
        if (!e.next_occurrence_date || e.reminder_days == null) return false;
        const daysUntil = Math.floor(
          (new Date(e.next_occurrence_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        return daysUntil === e.reminder_days;
      })
      .map(e => ({
        user_id: e.created_by,
        type: 'expense_reminder',
        title: 'Upcoming Expense Reminder',
        content: `Reminder: ${e.item_name} expense of ${e.total_amount} is due in ${e.reminder_days} days.`,
        linked_item_type: 'expense',
        linked_item_id: e.id,
        is_read: false,
      }));

    if (reminderRows.length > 0) {
      const { error: notifError } = await supabase.from('notifications').insert(reminderRows as never);
      if (notifError) {
        errors.push({ expense_id: 'batch_notifications', error: notifError.message });
      }
    }

    return NextResponse.json({
      success: true,
      generated_occurrences: generatedOccurrences.length,
      reminder_notifications_sent: reminderRows.length,
      ...(errors.length > 0 && { errors }),
    });
  } catch {
    return handleApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred');
  }
}
