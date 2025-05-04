/**
 * Script to apply database migrations
 * 
 * Usage:
 * node scripts/apply-migrations.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Read migration SQL
const migrationSql = fs.readFileSync(
  path.join(__dirname, '../supabase/migrations/20250901000002_expense_recurrence_fields.sql'),
  'utf8'
);

// Apply migration
async function applyMigration() {
  console.log('Applying migration...');
  
  try {
    // Execute the SQL directly using the Supabase PostgreSQL function
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSql
    });
    
    if (error) {
      console.error('Error applying migration:', error);
      return;
    }
    
    console.log('Migration applied successfully');
  } catch (error) {
    console.error('Exception applying migration:', error);
  }
}

// Run the migration
applyMigration();
