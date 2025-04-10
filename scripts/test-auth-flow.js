/**
 * Script to test the authentication flow with the cloud Supabase instance
 * 
 * Usage:
 * 1. Make sure you've switched to the cloud environment: npm run env:cloud
 * 2. Run: node scripts/test-auth-flow.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key not found in environment variables.');
  console.error('Make sure you have switched to the cloud environment: npm run env:cloud');
  process.exit(1);
}

console.log('Using Supabase URL:', supabaseUrl);
console.log('Anon key available:', !!supabaseKey);

// Test email and password
const testEmail = 'test@example.com';
const testPassword = 'password123';

async function testAuthFlow() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('\n=== Testing Authentication Flow ===\n');
    
    // Step 1: Test sign-up (this will fail if the user already exists)
    console.log('Step 1: Testing sign-up...');
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      });
      
      if (signUpError) {
        console.log('Sign-up failed (expected if user already exists):', signUpError.message);
      } else {
        console.log('Sign-up successful:', signUpData.user ? 'User created' : 'User not created');
      }
    } catch (error) {
      console.error('Sign-up error:', error);
    }
    
    // Step 2: Test sign-in with password
    console.log('\nStep 2: Testing sign-in with password...');
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      if (signInError) {
        console.error('Sign-in failed:', signInError.message);
      } else {
        console.log('Sign-in successful:', signInData.user.email);
        console.log('User ID:', signInData.user.id);
        console.log('Session expires at:', new Date(signInData.session.expires_at * 1000).toLocaleString());
      }
    } catch (error) {
      console.error('Sign-in error:', error);
    }
    
    // Step 3: Test getting user profile
    console.log('\nStep 3: Testing get user profile...');
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Get user failed:', userError.message);
      } else if (userData.user) {
        console.log('Get user successful:', userData.user.email);
        
        // Get profile from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single();
        
        if (profileError) {
          console.error('Get profile failed:', profileError.message);
        } else {
          console.log('Profile data:', profileData);
        }
      } else {
        console.log('No user found');
      }
    } catch (error) {
      console.error('Get user error:', error);
    }
    
    // Step 4: Test sign-out
    console.log('\nStep 4: Testing sign-out...');
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        console.error('Sign-out failed:', signOutError.message);
      } else {
        console.log('Sign-out successful');
      }
    } catch (error) {
      console.error('Sign-out error:', error);
    }
    
    // Step 5: Test magic link (this will only log the request, not actually send the email in this script)
    console.log('\nStep 5: Testing magic link request...');
    try {
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: testEmail,
        options: {
          emailRedirectTo: 'http://localhost:3000/auth/callback'
        }
      });
      
      if (magicLinkError) {
        console.error('Magic link request failed:', magicLinkError.message);
      } else {
        console.log('Magic link request successful');
        console.log('Check the Supabase dashboard for the magic link');
      }
    } catch (error) {
      console.error('Magic link error:', error);
    }
    
    console.log('\n=== Authentication Flow Test Complete ===\n');
    
  } catch (error) {
    console.error('Error testing authentication flow:', error);
  }
}

testAuthFlow();
