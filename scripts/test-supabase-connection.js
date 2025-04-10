/**
 * Script to test Supabase connection
 * 
 * Usage:
 * node scripts/test-supabase-connection.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key not found in environment variables.');
  process.exit(1);
}

console.log('=== Supabase Connection Test ===');
console.log('Supabase URL:', supabaseUrl);
console.log('Anon key available:', !!supabaseKey);

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\nTesting connection to Supabase...');
    
    // Test 1: Get session (should be null since we're not authenticated)
    console.log('\nTest 1: Get session');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError.message);
    } else {
      console.log('Session test successful:', sessionData.session ? 'Session found' : 'No session (expected)');
    }
    
    // Test 2: Query public table
    console.log('\nTest 2: Query public table');
    const { data: tableData, error: tableError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.error('Table query error:', tableError.message);
    } else {
      console.log('Table query successful:', tableData);
    }
    
    // Test 3: Test CORS with a simple health check
    console.log('\nTest 3: Health check');
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`);
      console.log('Health check status:', response.status);
      console.log('Health check headers:', Object.fromEntries(response.headers.entries()));
    } catch (error) {
      console.error('Health check error:', error.message);
    }
    
    console.log('\nConnection tests completed.');
    
  } catch (error) {
    console.error('Error testing connection:', error);
  }
}

testConnection();
