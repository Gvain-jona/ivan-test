/**
 * Script to test direct connection to Supabase PostgreSQL database
 * 
 * Usage:
 * 1. Update the connection details below
 * 2. Run: node scripts/test-db-connection.js
 */

const { Client } = require('pg');

// Update these with your actual connection details from Supabase dashboard
// Project Settings > Database > Connection string
const connectionConfig = {
  host: 'aws-0-eu-central-1.pooler.supabase.com', // From your error message
  port: 5432,
  database: 'postgres',
  user: 'postgres.giwurfpxxktfsdyitgvr', // From your error message
  password: 'your-database-password', // Replace with actual password
  ssl: { rejectUnauthorized: false }
};

async function testConnection() {
  const client = new Client(connectionConfig);
  
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connection successful!');
    
    console.log('Querying database...');
    const result = await client.query('SELECT current_database() as db, current_user as user');
    console.log('Query result:', result.rows[0]);
    
    console.log('Testing profiles table...');
    const profilesResult = await client.query('SELECT COUNT(*) FROM profiles');
    console.log(`Found ${profilesResult.rows[0].count} profiles`);
    
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await client.end();
  }
}

testConnection();
