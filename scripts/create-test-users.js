/**
 * Script to create test users in the cloud Supabase instance
 *
 * Usage:
 * 1. Make sure you've switched to the cloud environment: npm run env:cloud
 * 2. Run: node scripts/create-test-users.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role key for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or service role key not found in environment variables.');
  console.error('Make sure you have switched to the cloud environment: npm run env:cloud');
  console.error('And that you have set the SUPABASE_SERVICE_ROLE_KEY in your .env file.');
  process.exit(1);
}

console.log('Using Supabase URL:', supabaseUrl);
console.log('Service role key available:', !!supabaseKey);

// Test users to create
const testUsers = [
  {
    email: 'test@example.com',
    password: 'password123',
    user_metadata: {
      full_name: 'Test User',
      role: 'admin'
    },
    profile: {
      full_name: 'Test User',
      role: 'admin',
      status: 'active'
    }
  },
  {
    email: 'manager@example.com',
    password: 'password123',
    user_metadata: {
      full_name: 'Manager User',
      role: 'manager'
    },
    profile: {
      full_name: 'Manager User',
      role: 'manager',
      status: 'active'
    }
  },
  {
    email: 'staff@example.com',
    password: 'password123',
    user_metadata: {
      full_name: 'Staff User',
      role: 'staff'
    },
    profile: {
      full_name: 'Staff User',
      role: 'staff',
      status: 'active'
    }
  },
  {
    email: 'locked@example.com',
    password: 'password123',
    user_metadata: {
      full_name: 'Locked User',
      role: 'staff'
    },
    profile: {
      full_name: 'Locked User',
      role: 'staff',
      status: 'locked'
    }
  }
];

async function createTestUsers() {
  try {
    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('\n=== Creating Test Users ===\n');

    for (const user of testUsers) {
      console.log(`Creating user: ${user.email}...`);

      // Check if user already exists
      const { data: existingUsers, error: existingError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', user.email)
        .limit(1);

      if (existingError) {
        console.error(`Error checking if user exists: ${existingError.message}`);
        continue;
      }

      if (existingUsers && existingUsers.length > 0) {
        console.log(`User ${user.email} already exists. Skipping...`);
        continue;
      }

      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: user.user_metadata
      });

      if (authError) {
        console.error(`Error creating user ${user.email}: ${authError.message}`);
        continue;
      }

      console.log(`User ${user.email} created successfully with ID: ${authData.user.id}`);

      // Create profile for the user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: user.email,
          full_name: user.profile.full_name,
          role: user.profile.role,
          status: user.profile.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (profileError) {
        console.error(`Error creating profile for ${user.email}: ${profileError.message}`);
        continue;
      }

      console.log(`Profile created for ${user.email} with role: ${user.profile.role}`);
    }

    console.log('\n=== Test Users Created Successfully ===\n');

  } catch (error) {
    console.error('Error creating test users:', error);
  }
}

createTestUsers();
