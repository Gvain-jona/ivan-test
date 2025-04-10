/**
 * Script to check environment variables
 *
 * Usage:
 * node scripts/check-env.js
 */

require('dotenv').config();

console.log('=== Environment Variables ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY available:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log('SUPABASE_SERVICE_ROLE_KEY available:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);

// Check if we're using cloud or local
const isCloud = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co');
console.log('Using cloud Supabase:', isCloud ? 'Yes' : 'No');

// Check if the URL is valid
try {
  new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Supabase URL is valid');
} catch (error) {
  console.error('Supabase URL is invalid:', error.message);
}

// Check if we can make a simple fetch request to the Supabase URL
async function testConnection() {
  try {
    console.log('Testing connection to Supabase URL...');
    // Use global fetch if available, otherwise try to require node-fetch
    const fetchFunc = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
    const response = await fetchFunc(process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Connection successful, status:', response.status);
  } catch (error) {
    console.error('Connection failed:', error.message);
  }
}

testConnection();
