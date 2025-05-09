/**
 * Script to force the use of cloud Supabase URL
 * 
 * Usage:
 * node scripts/force-cloud-env.js
 */

const fs = require('fs');
const path = require('path');

// Cloud Supabase credentials
const CLOUD_SUPABASE_URL = 'https://giwurfpxxktfsdyitgvr.supabase.co';
const CLOUD_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpd3VyZnB4eGt0ZnNkeWl0Z3ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxOTQxNTMsImV4cCI6MjA1ODc3MDE1M30.fi86AKeND0mFfrCBZyor3qNUM6bZNOrePE9nzJ9Gvck';

// Create or update .env file
const envPath = path.join(__dirname, '../.env');
const envContent = `# This file is auto-generated by scripts/force-cloud-env.js
# IMPORTANT: Using cloud Supabase instance

# Supabase Cloud Configuration
NEXT_PUBLIC_SUPABASE_URL=${CLOUD_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${CLOUD_SUPABASE_ANON_KEY}

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

// Write the .env file
fs.writeFileSync(envPath, envContent);
console.log('.env file updated with cloud Supabase URL');

// Create or update .env.local file
const envLocalPath = path.join(__dirname, '../.env.local');
const envLocalContent = `# This file is auto-generated by scripts/force-cloud-env.js
# IMPORTANT: Using cloud Supabase instance

# Supabase Cloud Configuration
NEXT_PUBLIC_SUPABASE_URL=${CLOUD_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${CLOUD_SUPABASE_ANON_KEY}

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

// Write the .env.local file
fs.writeFileSync(envLocalPath, envLocalContent);
console.log('.env.local file updated with cloud Supabase URL');

console.log('Environment files updated successfully. Please restart your application.');
