/**
 * Script to check if the Supabase URL is correct
 * 
 * Usage:
 * node scripts/check-supabase-url.js
 */

require('dotenv').config();

console.log('=== Supabase URL Check ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

// Check if the URL is valid
try {
  new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Supabase URL is valid');
} catch (error) {
  console.error('Supabase URL is invalid:', error.message);
  process.exit(1);
}

// Try to ping the Supabase URL
const https = require('https');

const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
const options = {
  hostname: url.hostname,
  port: 443,
  path: '/',
  method: 'HEAD',
  timeout: 5000 // 5 seconds timeout
};

const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  console.log('Supabase URL is reachable');
});

req.on('error', (error) => {
  console.error('Error connecting to Supabase URL:', error.message);
});

req.on('timeout', () => {
  console.error('Connection to Supabase URL timed out');
  req.destroy();
});

req.end();
