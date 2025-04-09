/**
 * Script to check CORS configuration
 * 
 * Usage:
 * node scripts/check-cors.js
 */

require('dotenv').config();
const https = require('https');

console.log('=== CORS Check ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

// Check CORS headers
const url = new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`);
const options = {
  hostname: url.hostname,
  port: 443,
  path: '/rest/v1/',
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost:3000',
    'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'Content-Type, Authorization'
  },
  timeout: 5000 // 5 seconds timeout
};

const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('CORS Headers:');
  console.log('  Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
  console.log('  Access-Control-Allow-Methods:', res.headers['access-control-allow-methods']);
  console.log('  Access-Control-Allow-Headers:', res.headers['access-control-allow-headers']);
  console.log('  Access-Control-Max-Age:', res.headers['access-control-max-age']);
  
  if (res.headers['access-control-allow-origin'] === '*' || 
      res.headers['access-control-allow-origin'] === 'http://localhost:3000') {
    console.log('CORS is properly configured for localhost');
  } else {
    console.log('CORS might not be properly configured for localhost');
  }
});

req.on('error', (error) => {
  console.error('Error checking CORS:', error.message);
});

req.on('timeout', () => {
  console.error('CORS check timed out');
  req.destroy();
});

req.end();
