// Script to check database structure using Supabase API
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDatabase() {
  console.log('Checking database structure...');

  try {
    // Check if recurring_expense_occurrences table exists
    console.log('\nChecking recurring_expense_occurrences table...');
    const { data: recurringOccurrences, error: recurringOccurrencesError } = await supabase
      .from('recurring_expense_occurrences')
      .select('*')
      .limit(1);

    if (recurringOccurrencesError) {
      console.error('Error checking recurring_expense_occurrences table:', recurringOccurrencesError);
    } else {
      console.log('recurring_expense_occurrences table exists');
    }

    // Check expenses table structure
    console.log('\nChecking expenses table structure...');
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .limit(1);

    if (expensesError) {
      console.error('Error checking expenses table:', expensesError);
    } else {
      console.log('expenses table exists');
      if (expenses && expenses.length > 0) {
        console.log('Expense columns:', Object.keys(expenses[0]));
      }
    }

    // Check if the expenses table has recurring expense columns
    console.log('\nChecking if expenses table has recurring expense columns...');
    const { data: expensesWithRecurring, error: expensesWithRecurringError } = await supabase
      .from('expenses')
      .select('is_recurring, recurrence_frequency, next_occurrence_date')
      .limit(1);

    if (expensesWithRecurringError) {
      console.error('Error checking recurring expense columns:', expensesWithRecurringError);
    } else {
      console.log('Recurring expense columns exist in expenses table');
    }

    // List all tables in the database
    console.log('\nListing all tables in the database...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('list_tables');

    if (tablesError) {
      console.error('Error listing tables:', tablesError);
    } else {
      console.log('Tables in the database:', tables);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkDatabase();
