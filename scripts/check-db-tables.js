// Script to check if the database tables exist and have the correct structure
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create a Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTable(tableName) {
  console.log(`Checking table: ${tableName}`);
  
  try {
    // Check if the table exists
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`Error checking table ${tableName}:`, error.message);
      return false;
    }
    
    console.log(`Table ${tableName} exists.`);
    
    // Get the table structure
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: tableName });
    
    if (columnsError) {
      console.error(`Error getting columns for ${tableName}:`, columnsError.message);
      return false;
    }
    
    console.log(`Columns for ${tableName}:`, columns);
    return true;
  } catch (error) {
    console.error(`Unexpected error checking table ${tableName}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Checking database tables...');
  
  // Check the tables
  await checkTable('clients');
  await checkTable('categories');
  await checkTable('items');
  
  console.log('Done checking tables.');
}

main().catch(console.error);
