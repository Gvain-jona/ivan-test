import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client directly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    console.log('Creating Supabase client with URL:', supabaseUrl);
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Test a simple query
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1);
    
    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({
        success: false,
        message: 'Supabase query error',
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Supabase client is working correctly',
      data,
      clientInfo: {
        url: supabaseUrl,
        hasKey: !!supabaseKey
      }
    });
  } catch (error) {
    console.error('Test Supabase error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error testing Supabase client',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
