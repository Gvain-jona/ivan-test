// Script to check Supabase configuration
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkSupabaseConfig() {
  console.log('Checking Supabase configuration...');
  
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  );
  
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Supabase Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Loaded' : 'Not loaded');
  
  try {
    // Check if we can connect to Supabase
    console.log('Testing connection to Supabase...');
    const { data, error } = await supabase.from('profiles').select('count');
    
    if (error) {
      console.error('Error connecting to Supabase:', error);
    } else {
      console.log('Successfully connected to Supabase');
    }
    
    // Check auth settings
    console.log('Checking auth settings...');
    const { data: authSettings, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error checking auth settings:', authError);
    } else {
      console.log('Auth settings:', authSettings);
    }
    
    // Try to send a test email
    console.log('Trying to send a test email...');
    const testEmail = 'test@example.com';
    const { error: emailError } = await supabase.auth.admin.inviteUserByEmail(testEmail);
    
    if (emailError) {
      console.error('Error sending test email:', emailError);
    } else {
      console.log('Test email sent successfully');
    }
  } catch (error) {
    console.error('Exception checking Supabase config:', error);
  }
}

checkSupabaseConfig().catch(console.error);
