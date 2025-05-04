// Test script to debug the recurring expenses API
const fetch = require('node-fetch');

async function testRecurringExpensesApi() {
  try {
    // Get today's date and 30 days from now
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Call the API endpoint
    const url = `http://localhost:3000/api/expenses/recurring?startDate=${today}&endDate=${thirtyDaysLater}`;
    console.log(`Calling API endpoint: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      return;
    }
    
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error calling API:', error);
  }
}

testRecurringExpensesApi();
