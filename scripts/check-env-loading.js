/**
 * Script to check which environment variables are being loaded
 * 
 * Usage:
 * node scripts/check-env-loading.js
 */

// Load environment variables from different files
console.log('=== Loading Environment Variables ===');

// Load from .env
try {
  require('dotenv').config({ path: '.env' });
  console.log('.env loaded');
} catch (error) {
  console.error('Error loading .env:', error.message);
}

// Check environment variables
console.log('\n=== Environment Variables ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY available:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Load from .env.local
try {
  require('dotenv').config({ path: '.env.local', override: true });
  console.log('\n.env.local loaded');
} catch (error) {
  console.error('Error loading .env.local:', error.message);
}

// Check environment variables again
console.log('\n=== Environment Variables after .env.local ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY available:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Load from .env.production
try {
  require('dotenv').config({ path: '.env.production', override: true });
  console.log('\n.env.production loaded');
} catch (error) {
  console.error('Error loading .env.production:', error.message);
}

// Check environment variables again
console.log('\n=== Environment Variables after .env.production ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY available:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Check if we're using cloud or local
const isCloud = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co');
console.log('\nUsing cloud Supabase:', isCloud ? 'Yes' : 'No');
