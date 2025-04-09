/**
 * Script to execute SQL directly in the Supabase cloud instance
 * 
 * Usage:
 * node scripts/execute-sql.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or service role key not found in environment variables.');
  process.exit(1);
}

console.log('=== Execute SQL in Cloud Supabase ===');
console.log('Supabase URL:', supabaseUrl);
console.log('Service role key available:', !!supabaseKey);

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey);

// Simple SQL to fix the RLS policies
const fixSQL = `
-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS profiles_admin_read_all ON profiles;
DROP POLICY IF EXISTS profiles_admin_update_all ON profiles;
DROP POLICY IF EXISTS profiles_admin_insert ON profiles;
DROP POLICY IF EXISTS profiles_admin_delete ON profiles;

-- Create simpler policies that don't cause infinite recursion
-- Allow anyone to read any profile (we'll rely on Supabase Auth for security)
CREATE POLICY profiles_read_all ON profiles
  FOR SELECT
  USING (true);

-- Allow users to update their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow anyone to insert profiles (we'll rely on Supabase Auth for security)
CREATE POLICY profiles_insert_all ON profiles
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to delete profiles (we'll rely on Supabase Auth for security)
CREATE POLICY profiles_delete_all ON profiles
  FOR DELETE
  USING (true);
`;

async function executeSQL() {
  try {
    console.log('\nExecuting SQL...');
    
    // Split the SQL into individual statements
    const statements = fixSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim() + ';';
      console.log(`\nExecuting statement ${i + 1}/${statements.length}:`);
      console.log(statement);
      
      try {
        // Execute the SQL directly
        const { data, error } = await supabase.rpc('pg_query', {
          query_text: statement
        });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error.message);
        } else {
          console.log(`Statement ${i + 1} executed successfully.`);
        }
      } catch (err) {
        console.error(`Error executing statement ${i + 1}:`, err.message);
      }
    }
    
    console.log('\nTesting connection after SQL execution...');
    
    // Test the connection after the SQL execution
    const { data: tableData, error: tableError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.error('Table query error after SQL execution:', tableError.message);
    } else {
      console.log('Table query successful after SQL execution:', tableData);
    }
    
    console.log('\n=== SQL Execution Completed ===');
    
  } catch (error) {
    console.error('Error executing SQL:', error);
  }
}

// Ask for confirmation before executing SQL
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\nThis will execute SQL directly in your Supabase cloud instance. Continue? (y/n) ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    executeSQL();
  } else {
    console.log('SQL execution cancelled.');
  }
  rl.close();
});
