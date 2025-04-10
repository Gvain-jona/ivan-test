/**
 * Script to push local schema to cloud Supabase instance
 *
 * Usage:
 * 1. Update the SUPABASE_PROJECT_ID and SUPABASE_ACCESS_TOKEN below
 * 2. Run: node scripts/push-to-cloud.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration - UPDATE THESE VALUES
const SUPABASE_PROJECT_ID = 'giwurfpxxktfsdyitgvr'; // Your project ID from the error message
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'your-access-token';

// Database connection info - from Project Settings > Database
const DB_HOST = 'aws-0-eu-central-1.pooler.supabase.com'; // From your error message
const DB_PASSWORD = process.env.DB_PASSWORD || 'your-database-password';

// Paths
const MIGRATIONS_DIR = path.join(__dirname, '../supabase/migrations');
const SEED_FILE = path.join(__dirname, '../supabase/seed.sql');
const TEST_USERS_FILE = path.join(__dirname, '../supabase/test-user.sql');

// Check if Supabase CLI is installed
try {
  execSync('supabase --version', { stdio: 'ignore' });
} catch (error) {
  console.error('Supabase CLI is not installed. Please install it first:');
  console.error('npm install -g supabase');
  process.exit(1);
}

// Login to Supabase
console.log('Logging in to Supabase...');
try {
  // Check if already logged in
  try {
    execSync('supabase projects list', { stdio: 'ignore' });
    console.log('Already logged in to Supabase');
  } catch {
    // Not logged in, so login
    execSync(`supabase login ${SUPABASE_ACCESS_TOKEN}`, { stdio: 'inherit' });
  }
} catch (error) {
  console.error('Failed to login to Supabase. Please check your access token.');
  console.error('You can get your access token from https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

// Link to project
console.log(`Linking to Supabase project ${SUPABASE_PROJECT_ID}...`);
try {
  execSync(`supabase link --project-ref ${SUPABASE_PROJECT_ID}`, { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to link to Supabase project. Please check your project ID.');
  process.exit(1);
}

// Push migrations
console.log('Pushing migrations to cloud...');
try {
  execSync('supabase db push', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to push migrations to cloud.');
  process.exit(1);
}

// Run seed file if it exists
if (fs.existsSync(SEED_FILE)) {
  console.log('Running seed file...');
  try {
    execSync(`supabase db execute --file ${SEED_FILE}`, { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to run seed file.');
    console.error(error);
  }
}

// Run test users file if it exists
if (fs.existsSync(TEST_USERS_FILE)) {
  console.log('Creating test users...');
  try {
    execSync(`supabase db execute --file ${TEST_USERS_FILE}`, { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to create test users.');
    console.error(error);
  }
}

console.log('Done! Your local schema has been pushed to the cloud Supabase instance.');
console.log('Next steps:');
console.log('1. Update .env.production with your cloud Supabase URL and keys');
console.log('2. Deploy your application');
console.log('3. Test the authentication flow with real emails');
