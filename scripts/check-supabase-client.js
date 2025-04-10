/**
 * Script to check if the Supabase client is using the correct URL
 * 
 * Usage:
 * node scripts/check-supabase-client.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('=== Supabase Client Check ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY available:', !!supabaseKey);

// Check if we're using cloud or local
const isCloud = supabaseUrl?.includes('supabase.co');
console.log('Using cloud Supabase:', isCloud ? 'Yes' : 'No');

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Test the connection
async function testConnection() {
  try {
    console.log('\nTesting connection to Supabase...');
    
    // Test auth
    console.log('\nTest 1: Get session');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError.message);
    } else {
      console.log('Session test successful:', sessionData.session ? 'Session found' : 'No session (expected)');
    }
    
    // Test query
    console.log('\nTest 2: Query profiles table');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profilesError) {
      console.error('Profiles query error:', profilesError.message);
    } else {
      console.log('Profiles query successful:', profilesData);
    }
    
    console.log('\nConnection tests completed.');
  } catch (error) {
    console.error('Error testing connection:', error);
  }
}

testConnection();
