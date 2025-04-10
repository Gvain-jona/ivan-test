import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client directly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    console.log('Creating Supabase client with URL:', supabaseUrl);
    console.log('Has Supabase Key:', !!supabaseKey);
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        message: 'Missing Supabase credentials',
        env: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Test connection by checking profiles table
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.error('Error checking profiles table:', profilesError);
      
      // Try to get table information
      const { data: tablesData, error: tablesError } = await supabase
        .rpc('get_tables');
      
      if (tablesError) {
        console.error('Error getting tables:', tablesError);
        return NextResponse.json({
          success: false,
          message: 'Database connection error',
          profilesError: {
            message: profilesError.message,
            code: profilesError.code,
            hint: profilesError.hint,
            details: profilesError.details
          },
          tablesError: {
            message: tablesError.message,
            code: tablesError.code,
            hint: tablesError.hint,
            details: tablesError.details
          }
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: false,
        message: 'Could not access profiles table',
        error: profilesError.message,
        tables: tablesData
      }, { status: 500 });
    }
    
    // If we got here, we successfully accessed the profiles table
    return NextResponse.json({
      success: true,
      message: 'Successfully accessed profiles table',
      profilesCount: profilesData.length,
      profilesSchema: profilesData.length > 0 ? Object.keys(profilesData[0]) : [],
      // Only return non-sensitive data for security
      profiles: profilesData.map(profile => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        status: profile.status,
        is_verified: profile.is_verified,
        has_pin: !!profile.pin
      }))
    });
  } catch (error) {
    console.error('Test profiles error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error testing profiles table',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
