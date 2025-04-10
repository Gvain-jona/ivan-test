/**
 * Script to test Supabase API connection
 *
 * Usage:
 * 1. Update the Supabase URL and key below
 * 2. Run: node scripts/test-supabase-api.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.production' });

// Use environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Using Supabase URL:', supabaseUrl);
// Don't log the full key for security reasons
console.log('Anon key available:', !!supabaseKey);

async function testSupabaseConnection() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('Testing Supabase connection...');

    // Test authentication
    console.log('Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('Authentication error:', authError);
    } else {
      console.log('Authentication successful:', authData.session ? 'Session found' : 'No session');
    }

    // Test database query
    console.log('Testing database query...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (profilesError) {
      console.error('Database query error:', profilesError);
    } else {
      console.log('Database query successful:', profilesData);
    }

  } catch (error) {
    console.error('Error testing Supabase connection:', error);
  }
}

testSupabaseConnection();
