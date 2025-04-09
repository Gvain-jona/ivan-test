/**
 * Script to push the fixed RLS policies to the cloud Supabase instance
 * 
 * Usage:
 * node scripts/push-fix-to-cloud.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or service role key not found in environment variables.');
  process.exit(1);
}

console.log('=== Pushing Fix to Cloud Supabase ===');
console.log('Supabase URL:', supabaseUrl);
console.log('Service role key available:', !!supabaseKey);

// Read the fix migration file
const fixMigrationPath = path.join(__dirname, '../supabase/migrations/20250800000001_fix_rls_policies.sql');
const fixMigrationSQL = fs.readFileSync(fixMigrationPath, 'utf8');

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey);

async function pushFixToCloud() {
  try {
    console.log('\nExecuting fix migration...');
    
    // Execute the SQL directly using the Supabase API
    const { error } = await supabase.rpc('pgtle_install_extension_if_not_exists', {
      name: 'pg_jsonschema',
      version: '0.1.0',
      source: fixMigrationSQL
    });
    
    if (error) {
      console.error('Error executing fix migration:', error.message);
      
      // Try an alternative approach using the SQL API
      console.log('\nTrying alternative approach...');
      
      // Split the SQL into individual statements
      const statements = fixMigrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim() + ';';
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          // Execute each statement individually
          const { error: stmtError } = await supabase.rpc('exec_sql', {
            sql_query: statement
          });
          
          if (stmtError) {
            console.error(`Error executing statement ${i + 1}:`, stmtError.message);
          } else {
            console.log(`Statement ${i + 1} executed successfully.`);
          }
        } catch (stmtErr) {
          console.error(`Error executing statement ${i + 1}:`, stmtErr.message);
        }
      }
    } else {
      console.log('Fix migration executed successfully.');
    }
    
    console.log('\nTesting connection after fix...');
    
    // Test the connection after the fix
    const { data: tableData, error: tableError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.error('Table query error after fix:', tableError.message);
    } else {
      console.log('Table query successful after fix:', tableData);
    }
    
    console.log('\n=== Fix Push Completed ===');
    
  } catch (error) {
    console.error('Error pushing fix to cloud:', error);
  }
}

pushFixToCloud();
