/**
 * Test script for expense recurrence functionality
 * 
 * This script tests the creation of a recurring expense with advanced pattern fields
 * and verifies that the fields are correctly stored in the database.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test expense creation with recurrence pattern
async function testExpenseCreation() {
  console.log('Testing expense creation with recurrence pattern...');
  
  try {
    // Create a test expense with recurrence pattern
    const expenseData = {
      category: 'fixed',
      item_name: 'Test Recurring Expense',
      quantity: 1,
      unit_cost: 100,
      total_amount: 100,
      date: new Date().toISOString(),
      is_recurring: true,
      recurrence_frequency: 'monthly',
      recurrence_start_date: new Date().toISOString(),
      recurrence_day_of_month: 15,
      monthly_recurrence_type: 'day_of_month',
      created_by: 'test-user'
    };
    
    // Insert the expense
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating expense:', error);
      return;
    }
    
    console.log('Expense created successfully:', expense);
    
    // Verify that the recurrence pattern fields were stored
    const { data: retrievedExpense, error: retrieveError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', expense.id)
      .single();
    
    if (retrieveError) {
      console.error('Error retrieving expense:', retrieveError);
      return;
    }
    
    console.log('Retrieved expense:', retrievedExpense);
    console.log('Recurrence pattern fields:');
    console.log('- recurrence_frequency:', retrievedExpense.recurrence_frequency);
    console.log('- recurrence_day_of_month:', retrievedExpense.recurrence_day_of_month);
    console.log('- monthly_recurrence_type:', retrievedExpense.monthly_recurrence_type);
    
    // Clean up - delete the test expense
    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expense.id);
    
    if (deleteError) {
      console.error('Error deleting expense:', deleteError);
      return;
    }
    
    console.log('Test expense deleted successfully');
  } catch (error) {
    console.error('Exception in test:', error);
  }
}

// Run the test
testExpenseCreation();
