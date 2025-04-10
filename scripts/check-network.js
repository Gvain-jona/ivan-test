/**
 * Script to check network connectivity
 * 
 * Usage:
 * node scripts/check-network.js
 */

require('dotenv').config();
const https = require('https');
const dns = require('dns');

console.log('=== Network Connectivity Check ===');

// Check DNS resolution
console.log('\nChecking DNS resolution...');
const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
dns.lookup(supabaseUrl.hostname, (err, address, family) => {
  if (err) {
    console.error('DNS resolution failed:', err.message);
  } else {
    console.log(`DNS resolution successful: ${supabaseUrl.hostname} -> ${address} (IPv${family})`);
  }
});

// Check connectivity to common websites
console.log('\nChecking connectivity to common websites...');
const websites = [
  'google.com',
  'github.com',
  'supabase.com'
];

websites.forEach(website => {
  const req = https.request({
    hostname: website,
    port: 443,
    path: '/',
    method: 'HEAD',
    timeout: 5000
  }, (res) => {
    console.log(`${website}: Status Code ${res.statusCode}`);
  });
  
  req.on('error', (error) => {
    console.error(`${website}: Error - ${error.message}`);
  });
  
  req.on('timeout', () => {
    console.error(`${website}: Timeout`);
    req.destroy();
  });
  
  req.end();
});

// Check connectivity to Supabase
console.log('\nChecking connectivity to Supabase...');
const req = https.request({
  hostname: supabaseUrl.hostname,
  port: 443,
  path: '/rest/v1/',
  method: 'GET',
  headers: {
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  },
  timeout: 5000
}, (res) => {
  console.log(`Supabase: Status Code ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsedData = JSON.parse(data);
      console.log('Supabase response:', parsedData);
    } catch (e) {
      console.log('Supabase response (not JSON):', data.substring(0, 100) + (data.length > 100 ? '...' : ''));
    }
  });
});

req.on('error', (error) => {
  console.error(`Supabase: Error - ${error.message}`);
});

req.on('timeout', () => {
  console.error(`Supabase: Timeout`);
  req.destroy();
});

req.end();
