/**
 * Script to generate occurrences for existing recurring expenses
 * This script should be run once to populate the recurring_expense_occurrences table
 * for existing recurring expenses.
 */

// This script uses the fetch API to call the API endpoint
// It should be run in a Node.js environment with fetch available

async function generateRecurringExpenseOccurrences() {
  try {
    console.log('Generating occurrences for existing recurring expenses...');
    
    // Call the API endpoint
    const response = await fetch('http://localhost:3000/api/expenses/recurring', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer local-development-token' // This should match what your API expects
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      return;
    }
    
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    console.log(`Generated ${data.generatedOccurrences?.length || 0} occurrences`);
  } catch (error) {
    console.error('Error generating occurrences:', error);
  }
}

// Run the function
generateRecurringExpenseOccurrences();
